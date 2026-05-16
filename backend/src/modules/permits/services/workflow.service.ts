import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, ActionType, Role, Prisma, PermitType } from '@prisma/client';
import { SLAService } from './sla.service';
import { NotificationService } from './notification.service';
import { WORKFLOW_CONFIG } from '../constants/workflow.config';

export interface ApproveApplicationDto {
    notes?: string;
    inspectionNotes?: string;
}

export interface RejectApplicationDto {
    reason: string;
    notes?: string;
}

export interface StaffDashboardFilters {
    permitType?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'COMPLETED' | 'EXPIRED';
}

@Injectable()
export class WorkflowService {
    constructor(
        private prisma: PrismaService,
        private slaService: SLAService,
        private notificationService: NotificationService,
    ) { }

    /**
     * Approve application at current stage
     * Validates user role, advances stage, creates audit trail
     */
    async approveApplication(
        applicationId: string,
        userId: string,
        dto: ApproveApplicationDto,
    ) {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const canAccess = await this.canUserAccessStage(
            userId,
            application.currentStage,
            application.permitType,
        );

        if (!canAccess) {
            throw new ForbiddenException(
                `You do not have permission to approve applications at ${application.currentStage} stage`,
            );
        }

        const nextStage = this.getNextStage(application.currentStage, application.permitType);

        if (!nextStage) {
            throw new BadRequestException('Cannot advance from current stage');
        }

        if (
            user.roles.includes(Role.FIELD_INSPECTOR) &&
            application.currentStage === WorkflowStage.FIELD_INSPECTION &&
            !dto.inspectionNotes
        ) {
            throw new BadRequestException(
                'Inspection notes are required for field inspection approval',
            );
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            const updateData: Prisma.PermitApplicationUpdateInput = {
                status: nextStage,
                currentStage: nextStage,
            };

            if (dto.inspectionNotes) {
                updateData.inspectionNotes = dto.inspectionNotes;
            }

            const applicationUpdate = await tx.permitApplication.update({
                where: { id: applicationId },
                data: updateData,
                include: {
                    applicant: {
                        select: { id: true, email: true, name: true },
                    },
                },
            });

            await tx.validationAction.create({
                data: {
                    actionType: ActionType.APPROVE,
                    stage: application.currentStage,
                    notes: dto.notes,
                    applicationId,
                    performedById: userId,
                },
            });

            // --- DELEGATED SLA LOGIC ---
            await this.slaService.completeStageHistory(applicationId, application.currentStage, tx);

            await tx.stageHistory.create({
                data: {
                    applicationId,
                    fromStage: application.currentStage,
                    toStage: nextStage,
                    transitionedBy: userId,
                },
            });

            // --- CENTRALIZED AUDIT LOG ---
            await this.logActivity(tx, {
                entityType: 'PermitApplication',
                entityId: applicationId,
                action: 'APPROVE',
                performedBy: userId,
                changes: {
                    from: application.currentStage,
                    to: nextStage,
                    notes: dto.notes,
                }
            });

            return applicationUpdate;
        });

        try {
            if (nextStage === WorkflowStage.APPROVED) {
                await this.notificationService.notifyApplicationApproved(applicationId);
            } else {
                await this.notificationService.notifyStageAdvanced(applicationId, nextStage);
            }
        } catch (error) {
            console.error('Notification failed:', error);
        }

        return updated;
    }

    /**
     * Reject application at current stage
     */
    async rejectApplication(
        applicationId: string,
        userId: string,
        dto: RejectApplicationDto,
    ) {
        if (!dto.reason || dto.reason.trim() === '') {
            throw new BadRequestException('Rejection reason is required');
        }

        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        const canAccess = await this.canUserAccessStage(
            userId,
            application.currentStage,
            application.permitType,
        );

        if (!canAccess) {
            throw new ForbiddenException(
                `You do not have permission to reject applications at ${application.currentStage} stage`,
            );
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.permitApplication.update({
                where: { id: applicationId },
                data: {
                    status: WorkflowStage.REJECTED,
                    currentStage: WorkflowStage.REJECTED,
                    rejectionReason: dto.reason,
                    rejectedBy: userId,
                    rejectedAt: new Date(),
                },
                include: {
                    applicant: {
                        select: { id: true, email: true, name: true },
                    },
                },
            });

            await tx.validationAction.create({
                data: {
                    actionType: ActionType.REJECT,
                    stage: application.currentStage,
                    notes: dto.notes,
                    applicationId,
                    performedById: userId,
                },
            });

            // --- DELEGATED SLA LOGIC ---
            await this.slaService.completeStageHistory(applicationId, application.currentStage, tx);

            await tx.stageHistory.create({
                data: {
                    applicationId,
                    fromStage: application.currentStage,
                    toStage: WorkflowStage.REJECTED,
                    transitionedBy: userId,
                },
            });

            // --- CENTRALIZED AUDIT LOG ---
            await this.logActivity(tx, {
                entityType: 'PermitApplication',
                entityId: applicationId,
                action: 'REJECT',
                performedBy: userId,
                changes: {
                    from: application.currentStage,
                    to: WorkflowStage.REJECTED,
                    reason: dto.reason,
                    notes: dto.notes,
                }
            });

            return updated;
        });

        try {
            await this.notificationService.notifyApplicationRejected(applicationId, dto.reason);
        } catch (error) {
            console.error('Notification failed:', error);
        }

        return updated;
    }

    async canUserAccessStage(
        userId: string,
        stage: WorkflowStage,
        permitType: PermitType,
    ): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) return false;
        if (user.roles.includes(Role.ADMIN)) return true;

        const config = WORKFLOW_CONFIG[permitType];
        if (!config) return false;

        const requiredRoles = config.roles[stage] || [];
        return requiredRoles.some((role) => user.roles.includes(role));
    }

    getNextStage(currentStage: WorkflowStage, permitType: PermitType): WorkflowStage | null {
        const config = WORKFLOW_CONFIG[permitType];
        if (!config) return null;

        const currentIndex = config.stages.indexOf(currentStage);
        if (currentIndex === -1 || currentIndex === config.stages.length - 1) {
            return null;
        }

        return config.stages[currentIndex + 1];
    }

    async getStageHistory(applicationId: string) {
        return this.prisma.stageHistory.findMany({
            where: { applicationId },
            orderBy: { transitionedAt: 'asc' },
        });
    }

    async getValidationActions(applicationId: string) {
        return this.prisma.validationAction.findMany({
            where: { applicationId },
            include: {
                performedBy: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { performedAt: 'desc' },
        });
    }

    async getApplicationsForStaff(
        userId: string,
        filters: StaffDashboardFilters,
    ) {
        const [user, slaRules] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: userId } }),
            this.prisma.sLARule.findMany()
        ]);

        if (!user) throw new NotFoundException('User not found');

        const accessibleStages = new Set<WorkflowStage>();

        if (user.roles.includes(Role.ADMIN)) {
            accessibleStages.add(WorkflowStage.DOCUMENT_CHECK);
            accessibleStages.add(WorkflowStage.FIELD_INSPECTION);
            accessibleStages.add(WorkflowStage.LEGALIZATION);
        } else {
            for (const type in WORKFLOW_CONFIG) {
                const config = WORKFLOW_CONFIG[type as PermitType];
                for (const stage in config.roles) {
                    const roles = config.roles[stage as WorkflowStage];
                    if (roles?.some(role => user.roles.includes(role))) {
                        accessibleStages.add(stage as WorkflowStage);
                    }
                }
            }
        }

        if (accessibleStages.size === 0) return [];

        const stagesArray = Array.from(accessibleStages);
        const where: Prisma.PermitApplicationWhereInput = {};

        if (filters.status === 'COMPLETED') {
            where.status = { in: [WorkflowStage.APPROVED, WorkflowStage.REJECTED] };
        } else if (filters.status === 'EXPIRED') {
            where.currentStage = { in: stagesArray };
        } else {
            where.currentStage = { in: stagesArray };
            where.status = { notIn: [WorkflowStage.APPROVED, WorkflowStage.REJECTED, WorkflowStage.DRAFT] };
        }

        if (filters.permitType) where.permitType = filters.permitType as any;

        if (filters.search) {
            where.OR = [
                { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
                { applicant: { name: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }

        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const applications = await this.prisma.permitApplication.findMany({
            where, skip, take: limit,
            orderBy: { submittedAt: 'asc' },
            include: {
                applicant: { select: { id: true, email: true, name: true } },
                stageHistory: {
                    where: { completedAt: null },
                    orderBy: { transitionedAt: 'desc' },
                    take: 1,
                },
            },
        });

        const slaRuleMap = new Map(slaRules.map(r => [r.stage, r]));
        const now = new Date();

        return applications.map((app) => {
            const activeStage = app.stageHistory[0];
            const startTime = activeStage?.transitionedAt || app.submittedAt || app.createdAt;
            const hoursPending = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60 * 60));
            const slaRule = slaRuleMap.get(app.currentStage);
            const maxHours = slaRule?.maxDurationHours || 24;
            const remainingHours = Math.max(0, maxHours - hoursPending);

            return {
                ...app,
                hoursPending,
                remainingHours,
                maxHours,
                slaStatus: hoursPending >= maxHours ? 'OVERDUE' : 
                          hoursPending >= maxHours * (slaRule?.warningThreshold || 0.8) ? 'WARNING' : 'ON_TIME',
                activeStageHistory: activeStage,
            };
        });
    }

    async getPendingCount(userId: string): Promise<number> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) return 0;

        const accessibleStages = new Set<WorkflowStage>();
        if (user.roles.includes(Role.ADMIN)) {
            accessibleStages.add(WorkflowStage.DOCUMENT_CHECK);
            accessibleStages.add(WorkflowStage.FIELD_INSPECTION);
            accessibleStages.add(WorkflowStage.LEGALIZATION);
        } else {
            for (const type in WORKFLOW_CONFIG) {
                const config = WORKFLOW_CONFIG[type as PermitType];
                for (const stage in config.roles) {
                    const roles = config.roles[stage as WorkflowStage];
                    if (roles?.some(role => user.roles.includes(role))) {
                        accessibleStages.add(stage as WorkflowStage);
                    }
                }
            }
        }

        if (accessibleStages.size === 0) return 0;

        return this.prisma.permitApplication.count({
            where: { currentStage: { in: Array.from(accessibleStages) } },
        });
    }

    /**
     * Centralized logging helper with Immutability (Hashing)
     */
    private async logActivity(
        tx: Prisma.TransactionClient,
        data: {
            entityType: string;
            entityId: string;
            action: string;
            performedBy: string;
            changes: any;
        }
    ) {
        const crypto = require('crypto');

        // 1. Get the last log entry to get its hash
        const lastLog = await tx.auditLog.findFirst({
            orderBy: { createdAt: 'desc' },
        });

        const previousHash = lastLog?.hash || 'GENESIS_HASH';

        // 2. Create data string for hashing
        const logContent = JSON.stringify({
            ...data,
            previousHash,
            timestamp: new Date().toISOString(),
        });

        // 3. Generate SHA-256 hash
        const hash = crypto.createHash('sha256').update(logContent).digest('hex');

        // 4. Create the log entry
        return tx.auditLog.create({
            data: {
                ...data,
                previousHash,
                hash,
                createdAt: new Date(),
            },
        });
    }
}
