import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, ActionType, Role, Prisma } from '@prisma/client';
import { SLAService } from './sla.service';
import { NotificationService } from './notification.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
    AuditEntityType,
    AuditActionType,
} from '../../audit-log/dto/audit-log.dto';
import { BatchApproveItemDto, BatchRejectItemDto } from '../dto/batch.dto';

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
}

@Injectable()
export class WorkflowService {
    private readonly logger = new Logger(WorkflowService.name);

    constructor(
        private prisma: PrismaService,
        private slaService: SLAService,
        private notificationService: NotificationService,
        private auditLogService: AuditLogService,
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
        );

        if (!canAccess) {
            throw new ForbiddenException(
                `You do not have permission to approve applications at ${application.currentStage} stage`,
            );
        }

        // Get next stage
        const nextStage = this.getNextStage(application.currentStage);

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

                // Note: checkSLACompliance uses findUnique on SLARule, which is fine inside tx
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

            return updated;
        });

        // 5. Create audit log (after transaction)
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
        if (nextStage === WorkflowStage.APPROVED) {
            await this.notificationService.notifyApplicationApproved(applicationId);
        } else {
            await this.notificationService.notifyStageAdvanced(applicationId, nextStage);
        }

        return result;
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
        );

        if (!canAccess) {
            throw new ForbiddenException(
                `You do not have permission to reject applications at ${application.currentStage} stage`,
            );
        }

        // Execute atomic transaction
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

            return updated;
        });

        // 5. Create audit log (after transaction)
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
        await this.notificationService.notifyApplicationRejected(
            applicationId,
            dto.reason,
        );

        return result;
    }

    /**
     * Check if user has permission to access a specific workflow stage
     * Based on role-stage mapping
     */
    async canUserAccessStage(
        userId: string,
        stage: WorkflowStage,
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

        // Role-stage mapping
        const roleStageMap: Record<WorkflowStage, Role[]> = {
            [WorkflowStage.DRAFT]: [], // No staff access needed
            [WorkflowStage.DOCUMENT_CHECK]: [Role.DOCUMENT_VALIDATOR],
            [WorkflowStage.FIELD_INSPECTION]: [Role.FIELD_INSPECTOR],
            [WorkflowStage.LEGALIZATION]: [Role.LEGALIZER],
            [WorkflowStage.APPROVED]: [], // No further validation needed
            [WorkflowStage.REJECTED]: [], // No further validation needed
        };

        const requiredRoles = roleStageMap[stage] || [];

        // Check if user has any of the required roles
        return requiredRoles.some((role) => user.roles.includes(role));
    }

    /**
     * Get next workflow stage based on current stage
     * Returns null if no next stage exists
     */
    getNextStage(currentStage: WorkflowStage): WorkflowStage | null {
        const stageFlow: Record<WorkflowStage, WorkflowStage | null> = {
            [WorkflowStage.DRAFT]: WorkflowStage.DOCUMENT_CHECK,
            [WorkflowStage.DOCUMENT_CHECK]: WorkflowStage.FIELD_INSPECTION,
            [WorkflowStage.FIELD_INSPECTION]: WorkflowStage.LEGALIZATION,
            [WorkflowStage.LEGALIZATION]: WorkflowStage.APPROVED,
            [WorkflowStage.APPROVED]: null,
            [WorkflowStage.REJECTED]: null,
        };

        return stageFlow[currentStage] || null;
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
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Determine which stages user can access
        const accessibleStages: WorkflowStage[] = [];

        if (user.roles.includes(Role.ADMIN)) {
            // Admin can see all stages
            accessibleStages.push(
                WorkflowStage.DOCUMENT_CHECK,
                WorkflowStage.FIELD_INSPECTION,
                WorkflowStage.LEGALIZATION,
            );
        } else {
            if (user.roles.includes(Role.DOCUMENT_VALIDATOR)) {
                accessibleStages.push(WorkflowStage.DOCUMENT_CHECK);
            }
            if (user.roles.includes(Role.FIELD_INSPECTOR)) {
                accessibleStages.push(WorkflowStage.FIELD_INSPECTION);
            }
            if (user.roles.includes(Role.LEGALIZER)) {
                accessibleStages.push(WorkflowStage.LEGALIZATION);
            }
        }

        if (accessibleStages.length === 0) {
            return [];
        }

        // Build query
        const where: Prisma.PermitApplicationWhereInput = {
            currentStage: {
                in: accessibleStages,
            },
        };

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

        // Get SLA rules for all stages to avoid N+1
        const slaRules = await this.prisma.sLARule.findMany();
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

        // Determine which stages user can access
        const accessibleStages: WorkflowStage[] = [];

        if (user.roles.includes(Role.ADMIN)) {
            accessibleStages.push(
                WorkflowStage.DOCUMENT_CHECK,
                WorkflowStage.FIELD_INSPECTION,
                WorkflowStage.LEGALIZATION,
            );
        } else {
            if (user.roles.includes(Role.DOCUMENT_VALIDATOR)) {
                accessibleStages.push(WorkflowStage.DOCUMENT_CHECK);
            }
            if (user.roles.includes(Role.FIELD_INSPECTOR)) {
                accessibleStages.push(WorkflowStage.FIELD_INSPECTION);
            }
            if (user.roles.includes(Role.LEGALIZER)) {
                accessibleStages.push(WorkflowStage.LEGALIZATION);
            }
        }

        if (accessibleStages.length === 0) {
            return 0;
        }

        return this.prisma.permitApplication.count({
            where: {
                currentStage: {
                    in: accessibleStages,
                },
            },
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
