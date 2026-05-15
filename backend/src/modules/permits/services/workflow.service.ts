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
        // Get application and user first (outside transaction for read efficiency)
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

        // Validate user can access current stage
        const canAccess = await this.canUserAccessStage(
            userId,
            application.currentStage,
            application.permitType,
        );

        if (!canAccess) {
            throw new ForbiddenException(
                `You do not have permission to approve applications at ${application.currentStage} stage for ${application.permitType}`,
            );
        }

        // Get next stage
        const nextStage = this.getNextStage(application.currentStage, application.permitType);

        if (!nextStage) {
            throw new BadRequestException('Cannot advance from current stage');
        }

        // For Field Inspector, inspection notes are required
        if (
            user.roles.includes(Role.FIELD_INSPECTOR) &&
            application.currentStage === WorkflowStage.FIELD_INSPECTION &&
            !dto.inspectionNotes
        ) {
            throw new BadRequestException(
                'Inspection notes are required for field inspection approval',
            );
        }

        // Execute atomic transaction
        const updated = await this.prisma.$transaction(async (tx) => {
            // 1. Update application status
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
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
            });

            // 2. Create validation action
            await tx.validationAction.create({
                data: {
                    actionType: ActionType.APPROVE,
                    stage: application.currentStage,
                    notes: dto.notes,
                    applicationId,
                    performedById: userId,
                },
            });

            // 3. Update stage history and SLA
            const previousStageHistory = await tx.stageHistory.findFirst({
                where: {
                    applicationId,
                    toStage: application.currentStage,
                    completedAt: null,
                },
                orderBy: {
                    transitionedAt: 'desc',
                },
            });

            if (previousStageHistory) {
                const completedAt = new Date();
                const durationHours = this.slaService.calculateDuration(
                    previousStageHistory.transitionedAt,
                    completedAt,
                );

                const slaCheck = await this.slaService.checkSLACompliance(
                    previousStageHistory.transitionedAt,
                    application.currentStage,
                );

                await tx.stageHistory.update({
                    where: { id: previousStageHistory.id },
                    data: {
                        completedAt,
                        durationHours,
                        slaStatus: slaCheck.status,
                    },
                });
            }

            // 4. Create new stage history entry
            await tx.stageHistory.create({
                data: {
                    applicationId,
                    fromStage: application.currentStage,
                    toStage: nextStage,
                    transitionedBy: userId,
                },
            });

            // 5. Create audit log
            await tx.auditLog.create({
                data: {
                    entityType: 'PermitApplication',
                    entityId: applicationId,
                    action: 'APPROVE',
                    changes: {
                        from: application.currentStage,
                        to: nextStage,
                        approvedBy: userId,
                        notes: dto.notes,
                        inspectionNotes: dto.inspectionNotes,
                    },
                    performedBy: userId,
                },
            });

            return applicationUpdate;
        });

        // 6. Trigger notifications (STRICTLY OUTSIDE TRANSACTION to prevent timeouts)
        try {
            if (nextStage === WorkflowStage.APPROVED) {
                await this.notificationService.notifyApplicationApproved(applicationId);
            } else {
                await this.notificationService.notifyStageAdvanced(applicationId, nextStage);
            }
        } catch (error) {
            console.error('Notification failed but transaction succeeded:', error);
        }

        return updated;
    }

    /**
     * Reject application at current stage
     * Validates user role, sets status to REJECTED, creates audit trail
     */
    async rejectApplication(
        applicationId: string,
        userId: string,
        dto: RejectApplicationDto,
    ) {
        // Validate rejection reason is provided
        if (!dto.reason || dto.reason.trim() === '') {
            throw new BadRequestException('Rejection reason is required');
        }

        // Get application and user (outside transaction)
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

        // Validate user can access current stage
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

        // Execute atomic transaction
        const updated = await this.prisma.$transaction(async (tx) => {
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
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
            });

            // 2. Create validation action
            await tx.validationAction.create({
                data: {
                    actionType: ActionType.REJECT,
                    stage: application.currentStage,
                    notes: dto.notes,
                    applicationId,
                    performedById: userId,
                },
            });

            // 3. Update stage history and SLA
            const previousStageHistory = await tx.stageHistory.findFirst({
                where: {
                    applicationId,
                    toStage: application.currentStage,
                    completedAt: null,
                },
                orderBy: {
                    transitionedAt: 'desc',
                },
            });

            if (previousStageHistory) {
                const completedAt = new Date();
                const durationHours = this.slaService.calculateDuration(
                    previousStageHistory.transitionedAt,
                    completedAt,
                );

                const slaCheck = await this.slaService.checkSLACompliance(
                    previousStageHistory.transitionedAt,
                    application.currentStage,
                );

                await tx.stageHistory.update({
                    where: { id: previousStageHistory.id },
                    data: {
                        completedAt,
                        durationHours,
                        slaStatus: slaCheck.status,
                    },
                });
            }

            // 4. Create new stage history for rejection
            await tx.stageHistory.create({
                data: {
                    applicationId,
                    fromStage: application.currentStage,
                    toStage: WorkflowStage.REJECTED,
                    transitionedBy: userId,
                },
            });

            // 5. Create audit log
            await tx.auditLog.create({
                data: {
                    entityType: 'PermitApplication',
                    entityId: applicationId,
                    action: 'REJECT',
                    changes: {
                        from: application.currentStage,
                        to: WorkflowStage.REJECTED,
                        rejectedBy: userId,
                        reason: dto.reason,
                        notes: dto.notes,
                    },
                    performedBy: userId,
                },
            });

            return updated;
        });

        // 6. Trigger notification (OUTSIDE TRANSACTION)
        try {
            await this.notificationService.notifyApplicationRejected(
                applicationId,
                dto.reason,
            );
        } catch (error) {
            console.error('Notification failed but rejection succeeded:', error);
        }

        return updated;
    }

    /**
     * Check if user has permission to access a specific workflow stage
     * Based on role-stage mapping
     */
    async canUserAccessStage(
        userId: string,
        stage: WorkflowStage,
        permitType: PermitType,
    ): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return false;
        }

        // Admin can access all stages
        if (user.roles.includes(Role.ADMIN)) {
            return true;
        }

        const config = WORKFLOW_CONFIG[permitType];
        if (!config) return false;

        const requiredRoles = config.roles[stage] || [];

        // Check if user has any of the required roles
        return requiredRoles.some((role) => user.roles.includes(role));
    }

    /**
     * Get next workflow stage based on current stage and permit type
     */
    getNextStage(currentStage: WorkflowStage, permitType: PermitType): WorkflowStage | null {
        const config = WORKFLOW_CONFIG[permitType];
        if (!config) return null;

        const currentIndex = config.stages.indexOf(currentStage);
        if (currentIndex === -1 || currentIndex === config.stages.length - 1) {
            // Either stage not found or it's the last stage
            return null;
        }

        return config.stages[currentIndex + 1];
    }

    /**
     * Get stage history for an application
     */
    async getStageHistory(applicationId: string) {
        return this.prisma.stageHistory.findMany({
            where: { applicationId },
            orderBy: { transitionedAt: 'asc' },
        });
    }

    /**
     * Get validation actions for an application
     */
    async getValidationActions(applicationId: string) {
        return this.prisma.validationAction.findMany({
            where: { applicationId },
            include: {
                performedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { performedAt: 'desc' },
        });
    }

    /**
     * Get applications for staff dashboard
     * Filters by user's assigned workflow stages
     */
    async getApplicationsForStaff(
        userId: string,
        filters: StaffDashboardFilters,
    ) {
        // Fetch user and SLA rules in parallel
        const [user, slaRules] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
            }),
            this.prisma.sLARule.findMany()
        ]);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Determine which stages user can access across all permit types
        const accessibleStages = new Set<WorkflowStage>();

        if (user.roles.includes(Role.ADMIN)) {
            // Admin can see all processing stages
            accessibleStages.add(WorkflowStage.DOCUMENT_CHECK);
            accessibleStages.add(WorkflowStage.FIELD_INSPECTION);
            accessibleStages.add(WorkflowStage.LEGALIZATION);
        } else {
            // Collect stages user can access based on their roles and WORKFLOW_CONFIG
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

        if (accessibleStages.size === 0) {
            return [];
        }

        const stagesArray = Array.from(accessibleStages);

        // Build query
        const where: Prisma.PermitApplicationWhereInput = {};

        if (filters.status === 'COMPLETED') {
            where.status = { in: [WorkflowStage.APPROVED, WorkflowStage.REJECTED] };
        } else if (filters.status === 'EXPIRED') {
            where.currentStage = { in: stagesArray };
        } else {
            // Default: PENDING
            where.currentStage = { in: stagesArray };
            where.status = { notIn: [WorkflowStage.APPROVED, WorkflowStage.REJECTED, WorkflowStage.DRAFT] };
        }

        if (filters.permitType) {
            where.permitType = filters.permitType as any;
        }

        if (filters.search) {
            where.OR = [
                {
                    referenceNumber: {
                        contains: filters.search,
                        mode: 'insensitive',
                    },
                },
                {
                    applicant: {
                        name: { contains: filters.search, mode: 'insensitive' },
                    },
                },
            ];
        }

        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const applications = await this.prisma.permitApplication.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                submittedAt: 'asc', // Oldest first
            },
            include: {
                applicant: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                stageHistory: {
                    where: {
                        completedAt: null,
                    },
                    orderBy: {
                        transitionedAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        const slaRuleMap = new Map(slaRules.map(r => [r.stage, r]));

        // Calculate days pending and attach SLA info
        const now = new Date();
        const applicationsWithSLA = applications.map((app) => {
            const activeStage = app.stageHistory[0];
            const startTime = activeStage?.transitionedAt || app.submittedAt || app.createdAt;
            
            const hoursPending = Math.floor(
                (now.getTime() - startTime.getTime()) / (1000 * 60 * 60),
            );
            
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

        if (filters.status === 'EXPIRED') {
            return applicationsWithSLA.filter(app => app.slaStatus === 'OVERDUE');
        }

        return applicationsWithSLA;
    }

    /**
     * Get count of pending applications for staff member
     */
    async getPendingCount(userId: string): Promise<number> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return 0;
        }

        // Determine accessible stages
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

        if (accessibleStages.size === 0) {
            return 0;
        }

        return this.prisma.permitApplication.count({
            where: {
                currentStage: {
                    in: Array.from(accessibleStages),
                },
            },
        });
    }
}
