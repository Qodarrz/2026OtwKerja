import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType, Prisma, Role } from '@prisma/client';
import { NotificationGateway } from '../gateways/notification.gateway';

export interface ListNotificationsQuery {
    isRead?: boolean;
    page?: number;
    limit?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class NotificationService {
    constructor(
        private prisma: PrismaService,
        private gateway: NotificationGateway,
    ) { }

    /**
     * Create notification when application is submitted
     */
    async notifyApplicationSubmitted(applicationId: string): Promise<void> {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        const notification = await this.prisma.notification.create({
            data: {
                userId: application.applicantId,
                type: NotificationType.APPLICATION_SUBMITTED,
                title: 'Application Submitted',
                message: `Your application ${application.referenceNumber} has been submitted for document check`,
                applicationId,
            },
        });

        try {
            this.gateway.sendToUser(application.applicantId, 'notification:application_submitted', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                timestamp: notification.createdAt.toISOString(),
                metadata: {
                    applicationId,
                    referenceNumber: application.referenceNumber,
                },
            });
        } catch (error) {
            console.error('WebSocket delivery failed:', error);
        }
    }

    /**
     * Create notification when application advances to a new stage
     */
    async notifyStageAdvanced(
        applicationId: string,
        newStage: string,
    ): Promise<void> {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        const notification = await this.prisma.notification.create({
            data: {
                userId: application.applicantId,
                type: NotificationType.STAGE_ADVANCED,
                title: 'Stage Advanced',
                message: `Your application ${application.referenceNumber} has advanced to ${newStage} stage`,
                applicationId,
            },
        });

        try {
            this.gateway.sendToUser(application.applicantId, 'notification:stage_advanced', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                timestamp: notification.createdAt.toISOString(),
                metadata: {
                    applicationId,
                    referenceNumber: application.referenceNumber,
                    stage: newStage,
                },
            });
        } catch (error) {
            console.error('WebSocket delivery failed:', error);
        }
    }

    /**
     * Create notification when application is approved
     */
    async notifyApplicationApproved(applicationId: string): Promise<void> {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        const notification = await this.prisma.notification.create({
            data: {
                userId: application.applicantId,
                type: NotificationType.APPLICATION_APPROVED,
                title: 'Application Approved',
                message: `Your application ${application.referenceNumber} has been approved`,
                applicationId,
            },
        });

        try {
            this.gateway.sendToUser(application.applicantId, 'notification:application_approved', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                timestamp: notification.createdAt.toISOString(),
                metadata: {
                    applicationId,
                    referenceNumber: application.referenceNumber,
                },
            });
        } catch (error) {
            console.error('WebSocket delivery failed:', error);
        }
    }

    /**
     * Create notification when application is rejected
     */
    async notifyApplicationRejected(
        applicationId: string,
        reason: string,
    ): Promise<void> {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        const notification = await this.prisma.notification.create({
            data: {
                userId: application.applicantId,
                type: NotificationType.APPLICATION_REJECTED,
                title: 'Application Rejected',
                message: `Your application ${application.referenceNumber} has been rejected. Reason: ${reason}`,
                applicationId,
            },
        });

        try {
            this.gateway.sendToUser(application.applicantId, 'notification:application_rejected', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                timestamp: notification.createdAt.toISOString(),
                metadata: {
                    applicationId,
                    referenceNumber: application.referenceNumber,
                    rejectionReason: reason,
                },
            });
        } catch (error) {
            console.error('WebSocket delivery failed:', error);
        }
    }

    /**
     * Create notification for staff when application is nearing SLA limit
     */
    async notifySLAWarning(
        applicationId: string,
        staffId: string,
        stage: string,
    ): Promise<void> {
        const [application, staff] = await Promise.all([
            this.prisma.permitApplication.findUnique({
                where: { id: applicationId },
            }),
            this.prisma.user.findUnique({
                where: { id: staffId },
            }),
        ]);

        if (!application) return;

        const notification = await this.prisma.notification.create({
            data: {
                userId: staffId,
                type: 'SLA_WARNING' as any,
                title: 'SLA Warning',
                message: `Application ${application.referenceNumber} in ${stage} is nearing SLA limit. Please process immediately.`,
                applicationId,
            },
        });

        const payload = {
            id: notification.id,
            type: 'SLA_WARNING',
            title: 'SLA Warning',
            message: notification.message,
            timestamp: notification.createdAt.toISOString(),
            metadata: {
                applicationId,
                referenceNumber: application.referenceNumber,
                stage,
                urgencyLevel: 'high',
                assignedStaffName: staff?.name || 'Unknown',
                timeRemaining: 3600, // Mock value
            },
        };

        try {
            this.gateway.sendToUser(staffId, 'notification:sla_warning', payload);
            
            // Broadcast to relevant role
            let roleToNotify: Role | null = null;
            if (stage === 'DOCUMENT_CHECK') roleToNotify = Role.DOCUMENT_VALIDATOR;
            else if (stage === 'FIELD_INSPECTION') roleToNotify = Role.FIELD_INSPECTOR;
            else if (stage === 'LEGALIZATION') roleToNotify = Role.LEGALIZER;

            if (roleToNotify) {
                this.gateway.sendToRole(roleToNotify, 'notification:sla_warning', payload);
            }
        } catch (error) {
            console.error('WebSocket delivery failed:', error);
        }
    }

    /**
     * Create notification for supervisor when application is overdue (Escalation)
     */
    async notifySLAEscalation(
        applicationId: string,
        supervisorId: string,
        stage: string,
        staffName: string,
    ): Promise<void> {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) return;

        const notification = await this.prisma.notification.create({
            data: {
                userId: supervisorId,
                type: 'SLA_ESCALATION' as any,
                title: 'SLA Escalation Alert',
                message: `URGENT: Application ${application.referenceNumber} in ${stage} is OVERDUE. Assigned to: ${staffName}.`,
                applicationId,
            },
        });

        const payload = {
            id: notification.id,
            type: 'SLA_ESCALATION',
            title: 'SLA Escalation Alert',
            message: notification.message,
            timestamp: notification.createdAt.toISOString(),
            metadata: {
                applicationId,
                referenceNumber: application.referenceNumber,
                stage,
                urgencyLevel: 'critical',
                assignedStaffName: staffName,
                overdueDuration: 7200, // Mock value
            },
        };

        try {
            this.gateway.sendToUser(supervisorId, 'notification:sla_overdue', payload);
            this.gateway.sendToRole(Role.ADMIN, 'notification:sla_overdue', payload);
        } catch (error) {
            console.error('WebSocket delivery failed:', error);
        }
    }

    /**
     * Get user notifications with pagination
     */
    async getUserNotifications(
        userId: string,
        query: ListNotificationsQuery,
    ): Promise<PaginatedResult<any>> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.NotificationWhereInput = {
            userId,
        };

        if (query.isRead !== undefined) {
            where.isRead = query.isRead;
        }

        const [data, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    application: {
                        select: {
                            id: true,
                            referenceNumber: true,
                            permitType: true,
                            status: true,
                        },
                    },
                },
            }),
            this.prisma.notification.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get unread notification count for badge display
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<void> {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        if (notification.userId !== userId) {
            throw new ForbiddenException(
                'You can only mark your own notifications as read',
            );
        }

        await this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<void> {
        await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });
    }
}