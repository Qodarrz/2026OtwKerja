import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, ActionType, Role, Prisma } from '@prisma/client';
import { SLAService } from './sla.service';

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
    constructor(
        private prisma: PrismaService,
        private slaService: SLAService,
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
        // Get application
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Get user with roles
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
            throw new BadRequestException(
                'Cannot advance from current stage',
            );
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

        // Update application
        const updateData: Prisma.PermitApplicationUpdateInput = {
            status: nextStage,
            currentStage: nextStage,
        };

        // Save inspection notes if provided
        if (dto.inspectionNotes) {
            updateData.inspectionNotes = dto.inspectionNotes;
        }

        const updated = await this.prisma.permitApplication.update({
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

        // Create validation action
        await this.prisma.validationAction.create({
            data: {
                actionType: ActionType.APPROVE,
                stage: application.currentStage,
                notes: dto.notes,
                applicationId,
                performedById: userId,
            },
        });

        // Create stage history with SLA tracking
        const previousStageHistory = await this.prisma.stageHistory.findFirst({
            where: {
                applicationId,
                toStage: application.currentStage,
                completedAt: null,
            },
            orderBy: {
                transitionedAt: 'desc',
            },
        });

        // Complete previous stage and calculate SLA
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

            await this.prisma.stageHistory.update({
                where: { id: previousStageHistory.id },
                data: {
                    completedAt,
                    durationHours,
                    slaStatus: slaCheck.status,
                },
            });
        }

        // Create new stage history for next stage
        await this.prisma.stageHistory.create({
            data: {
                applicationId,
                fromStage: application.currentStage,
                toStage: nextStage,
                transitionedBy: userId,
            },
        });

        // Create audit log
        await this.prisma.auditLog.create({
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

        // Create notification for applicant
        const notificationType =
            nextStage === WorkflowStage.APPROVED
                ? 'APPLICATION_APPROVED'
                : 'STAGE_ADVANCED';

        const notificationMessage =
            nextStage === WorkflowStage.APPROVED
                ? `Your application ${application.referenceNumber} has been approved`
                : `Your application ${application.referenceNumber} has advanced to ${nextStage} stage`;

        await this.prisma.notification.create({
            data: {
                userId: application.applicantId,
                type: notificationType,
                title:
                    nextStage === WorkflowStage.APPROVED
                        ? 'Application Approved'
                        : 'Stage Advanced',
                message: notificationMessage,
                applicationId,
            },
        });

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

        // Get application
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Get user with roles
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

        // Update application
        const updated = await this.prisma.permitApplication.update({
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

        // Create validation action
        await this.prisma.validationAction.create({
            data: {
                actionType: ActionType.REJECT,
                stage: application.currentStage,
                notes: dto.notes,
                applicationId,
                performedById: userId,
            },
        });

        // Create stage history with SLA tracking
        const previousStageHistory = await this.prisma.stageHistory.findFirst({
            where: {
                applicationId,
                toStage: application.currentStage,
                completedAt: null,
            },
            orderBy: {
                transitionedAt: 'desc',
            },
        });

        // Complete previous stage and calculate SLA
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

            await this.prisma.stageHistory.update({
                where: { id: previousStageHistory.id },
                data: {
                    completedAt,
                    durationHours,
                    slaStatus: slaCheck.status,
                },
            });
        }

        // Create new stage history for rejection
        await this.prisma.stageHistory.create({
            data: {
                applicationId,
                fromStage: application.currentStage,
                toStage: WorkflowStage.REJECTED,
                transitionedBy: userId,
            },
        });

        // Create audit log
        await this.prisma.auditLog.create({
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

        // Create notification for applicant
        await this.prisma.notification.create({
            data: {
                userId: application.applicantId,
                type: 'APPLICATION_REJECTED',
                title: 'Application Rejected',
                message: `Your application ${application.referenceNumber} has been rejected. Reason: ${dto.reason}`,
                applicationId,
            },
        });

        return updated;
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
            },
        });

        // Calculate days pending for each application
        const now = new Date();
        const applicationsWithPending = applications.map((app) => {
            const daysPending = app.submittedAt
                ? Math.floor(
                    (now.getTime() - app.submittedAt.getTime()) /
                    (1000 * 60 * 60 * 24),
                )
                : 0;

            return {
                ...app,
                daysPending,
                isPendingLong: daysPending > 7,
            };
        });

        return applicationsWithPending;
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
}
