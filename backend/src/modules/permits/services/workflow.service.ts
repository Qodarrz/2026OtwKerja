import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, ActionType, Role, Prisma, PermitType } from '@prisma/client';
import { SLAService } from './sla.service';
import { NotificationService } from './notification.service';
import { WORKFLOW_CONFIG } from '../constants/workflow.config';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
    AuditEntityType,
    AuditActionType,
} from '../../audit-log/dto/audit-log.dto';
import { BatchApproveItemDto, BatchRejectItemDto } from '../dto/batch.dto';
import { WorkflowTemplateService } from '../../workflow-template/services/workflow-template.service';

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
    private readonly logger = new Logger(WorkflowService.name);

    constructor(
        private prisma: PrismaService,
        private slaService: SLAService,
        private notificationService: NotificationService,
        private auditLogService: AuditLogService,
        private workflowTemplateService: WorkflowTemplateService,
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

        const nextStage = await this.getNextStage(application.currentStage, application.permitType);

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

        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Update application status
            const updateData: Prisma.PermitApplicationUpdateInput = {
                status: nextStage,
                currentStage: nextStage,
            };

            if (dto.inspectionNotes) {
                updateData.inspectionNotes = dto.inspectionNotes;
            }

            const updated = await tx.permitApplication.update({
                where: { id: applicationId },
                data: updateData,
                include: {
                    applicant: {
                        select: { id: true, email: true, name: true },
                    },
                },
            });

            // 2. Record validation action
            await tx.validationAction.create({
                data: {
                    actionType: ActionType.APPROVE,
                    stage: application.currentStage,
                    notes: dto.notes,
                    applicationId,
                    performedById: userId,
                },
            });

            // 3. Delegate SLA completion logic
            await this.slaService.completeStageHistory(applicationId, application.currentStage, tx);

            // 4. Start next stage history
            await tx.stageHistory.create({
                data: {
                    applicationId,
                    fromStage: application.currentStage,
                    toStage: nextStage,
                    transitionedBy: userId,
                },
            });

            return updated;
        });

        // 5. Create audit log (async via service)
        await this.auditLogService.createAuditLog({
            entityType: AuditEntityType.PERMIT_APPLICATION,
            entityId: applicationId,
            action: AuditActionType.APPROVE,
            performedBy: userId,
            changes: {
                fromStage: application.currentStage,
                toStage: nextStage,
                notes: dto.notes,
                inspectionNotes: dto.inspectionNotes,
            },
        });

        // 6. Trigger notifications
        try {
            if (nextStage === WorkflowStage.APPROVED) {
                await this.notificationService.notifyApplicationApproved(applicationId);
            } else {
                await this.notificationService.notifyStageAdvanced(applicationId, nextStage);
            }
        } catch (error) {
            this.logger.error('Notification failed:', error);
        }

        return result;
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

        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Update application status to REJECTED
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

            // 2. Record validation action
            await tx.validationAction.create({
                data: {
                    actionType: ActionType.REJECT,
                    stage: application.currentStage,
                    notes: dto.notes,
                    applicationId,
                    performedById: userId,
                },
            });

            // 3. Delegate SLA completion logic
            await this.slaService.completeStageHistory(applicationId, application.currentStage, tx);

            // 4. Start rejection history
            await tx.stageHistory.create({
                data: {
                    applicationId,
                    fromStage: application.currentStage,
                    toStage: WorkflowStage.REJECTED,
                    transitionedBy: userId,
                },
            });

            return updated;
        });

        // 5. Create audit log (async via service)
        await this.auditLogService.createAuditLog({
            entityType: AuditEntityType.PERMIT_APPLICATION,
            entityId: applicationId,
            action: AuditActionType.REJECT,
            performedBy: userId,
            changes: {
                fromStage: application.currentStage,
                toStage: WorkflowStage.REJECTED,
                reason: dto.reason,
                notes: dto.notes,
            },
        });

        // 6. Trigger notification
        try {
            await this.notificationService.notifyApplicationRejected(
                applicationId,
                dto.reason,
            );
        } catch (error) {
            this.logger.error('Notification failed:', error);
        }

        return result;
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

        const config = await this.workflowTemplateService.getWorkflowDefinition(permitType);
        if (!config) return false;

        const requiredRoles = config.roles[stage] || [];
        return requiredRoles.some((role) => user.roles.includes(role));
    }

    async getNextStage(currentStage: WorkflowStage, permitType: PermitType): Promise<WorkflowStage | null> {
        const config = await this.workflowTemplateService.getWorkflowDefinition(permitType);
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
            where.status = { notIn: [WorkflowStage.APPROVED, WorkflowStage.REJECTED] };
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

        const mappedApplications = applications.map((app) => {
            const activeStage = app.stageHistory[0];
            const startTime = activeStage?.transitionedAt || app.submittedAt || app.createdAt;
            const hoursPending = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60 * 60));
            const slaRule = slaRuleMap.get(app.currentStage);
            const maxHours = slaRule?.maxDurationHours || 24;
            const remainingHours = maxHours - ((now.getTime() - startTime.getTime()) / (1000 * 60 * 60));

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

        if (filters.status === 'EXPIRED') {
            return mappedApplications.filter(app => app.slaStatus === 'OVERDUE');
        }

        return mappedApplications;
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
     * Batch approve multiple applications
     * Processes each item independently — partial success is allowed
     */
    async batchApprove(
        userId: string,
        items: BatchApproveItemDto[],
    ): Promise<{
        succeeded: { applicationId: string; referenceNumber: string; fromStage: WorkflowStage; toStage: WorkflowStage }[];
        failed: { applicationId: string; reason: string }[];
    }> {
        const succeeded: { applicationId: string; referenceNumber: string; fromStage: WorkflowStage; toStage: WorkflowStage }[] = [];
        const failed: { applicationId: string; reason: string }[] = [];

        for (const item of items) {
            try {
                // Capture current stage before approval
                const application = await this.prisma.permitApplication.findUnique({
                    where: { id: item.applicationId },
                    select: { currentStage: true, referenceNumber: true },
                });

                if (!application) {
                    failed.push({ applicationId: item.applicationId, reason: 'Application not found' });
                    continue;
                }

                const fromStage = application.currentStage;

                await this.approveApplication(item.applicationId, userId, {
                    notes: item.notes,
                    inspectionNotes: item.inspectionNotes,
                });

                // Fetch updated stage after approval
                const updated = await this.prisma.permitApplication.findUnique({
                    where: { id: item.applicationId },
                    select: { currentStage: true },
                });

                succeeded.push({
                    applicationId: item.applicationId,
                    referenceNumber: application.referenceNumber,
                    fromStage,
                    toStage: updated!.currentStage,
                });
            } catch (error) {
                failed.push({
                    applicationId: item.applicationId,
                    reason: error instanceof Error ? error.message : String(error),
                });
            }
        }

        this.logger.log(
            `Batch approve summary — total: ${items.length}, succeeded: ${succeeded.length}, failed: ${failed.length}`,
        );

        return { succeeded, failed };
    }

    /**
     * Batch reject multiple applications
     * Processes each item independently — partial success is allowed
     */
    async batchReject(
        userId: string,
        items: BatchRejectItemDto[],
    ): Promise<{
        succeeded: { applicationId: string; referenceNumber: string; stage: WorkflowStage }[];
        failed: { applicationId: string; reason: string }[];
    }> {
        const succeeded: { applicationId: string; referenceNumber: string; stage: WorkflowStage }[] = [];
        const failed: { applicationId: string; reason: string }[] = [];

        for (const item of items) {
            try {
                // Capture current stage and reference number before rejection
                const application = await this.prisma.permitApplication.findUnique({
                    where: { id: item.applicationId },
                    select: { currentStage: true, referenceNumber: true },
                });

                if (!application) {
                    failed.push({ applicationId: item.applicationId, reason: 'Application not found' });
                    continue;
                }

                const stage = application.currentStage;

                await this.rejectApplication(item.applicationId, userId, {
                    reason: item.reason,
                    notes: item.notes,
                });

                succeeded.push({
                    applicationId: item.applicationId,
                    referenceNumber: application.referenceNumber,
                    stage,
                });
            } catch (error) {
                failed.push({
                    applicationId: item.applicationId,
                    reason: error instanceof Error ? error.message : String(error),
                });
            }
        }

        this.logger.log(
            `Batch reject summary — total: ${items.length}, succeeded: ${succeeded.length}, failed: ${failed.length}`,
        );

        return { succeeded, failed };
    }
}
