import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';

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
    constructor(private prisma: PrismaService) { }

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

        await this.prisma.notification.create({
            data: {
                userId: application.applicantId,
                type: NotificationType.APPLICATION_SUBMITTED,
                title: 'Application Submitted',
                message: `Your application ${application.referenceNumber} has been submitted for document check`,
                applicationId,
            },
        });
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

        await this.prisma.notification.create({
            data: {
                userId: application.applicantId,
                type: NotificationType.STAGE_ADVANCED,
                title: 'Stage Advanced',
                message: `Your application ${application.referenceNumber} has advanced to ${newStage} stage`,
                applicationId,
            },
        });
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

        await this.prisma.notification.create({
            data: {
                userId: application.applicantId,
                type: NotificationType.APPLICATION_APPROVED,
                title: 'Application Approved',
                message: `Your application ${application.referenceNumber} has been approved`,
                applicationId,
            },
        });
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

        await this.prisma.notification.create({
            data: {
                userId: application.applicantId,
                type: NotificationType.APPLICATION_REJECTED,
                title: 'Application Rejected',
                message: `Your application ${application.referenceNumber} has been rejected. Reason: ${reason}`,
                applicationId,
            },
        });
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
