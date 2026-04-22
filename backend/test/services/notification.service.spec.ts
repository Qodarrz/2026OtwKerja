import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../../src/modules/permits/services/notification.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationType, PermitType, WorkflowStage } from '@prisma/client';

describe('NotificationService', () => {
    let service: NotificationService;
    let prisma: PrismaService;

    const mockPrismaService = {
        permitApplication: {
            findUnique: jest.fn(),
        },
        notification: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
        prisma = module.get<PrismaService>(PrismaService);

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('notifyApplicationSubmitted', () => {
        it('should create notification when application is submitted', async () => {
            const applicationId = 'app-123';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
                permitType: PermitType.BUILDING_PERMIT,
                status: WorkflowStage.DOCUMENT_CHECK,
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue({
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.APPLICATION_SUBMITTED,
                title: 'Application Submitted',
                message: `Your application ${mockApplication.referenceNumber} has been submitted for document check`,
                applicationId,
                isRead: false,
                createdAt: new Date(),
            });

            await service.notifyApplicationSubmitted(applicationId);

            expect(mockPrismaService.permitApplication.findUnique).toHaveBeenCalledWith({
                where: { id: applicationId },
            });
            expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    type: NotificationType.APPLICATION_SUBMITTED,
                    title: 'Application Submitted',
                    message: `Your application ${mockApplication.referenceNumber} has been submitted for document check`,
                    applicationId,
                },
            });
        });

        it('should throw NotFoundException if application not found', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.notifyApplicationSubmitted('invalid-id'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('notifyStageAdvanced', () => {
        it('should create notification when stage advances', async () => {
            const applicationId = 'app-123';
            const newStage = 'FIELD_INSPECTION';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue({
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.STAGE_ADVANCED,
                title: 'Stage Advanced',
                message: `Your application ${mockApplication.referenceNumber} has advanced to ${newStage} stage`,
                applicationId,
                isRead: false,
                createdAt: new Date(),
            });

            await service.notifyStageAdvanced(applicationId, newStage);

            expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    type: NotificationType.STAGE_ADVANCED,
                    title: 'Stage Advanced',
                    message: `Your application ${mockApplication.referenceNumber} has advanced to ${newStage} stage`,
                    applicationId,
                },
            });
        });

        it('should throw NotFoundException if application not found', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.notifyStageAdvanced('invalid-id', 'FIELD_INSPECTION'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('notifyApplicationApproved', () => {
        it('should create notification when application is approved', async () => {
            const applicationId = 'app-123';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue({
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.APPLICATION_APPROVED,
                title: 'Application Approved',
                message: `Your application ${mockApplication.referenceNumber} has been approved`,
                applicationId,
                isRead: false,
                createdAt: new Date(),
            });

            await service.notifyApplicationApproved(applicationId);

            expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    type: NotificationType.APPLICATION_APPROVED,
                    title: 'Application Approved',
                    message: `Your application ${mockApplication.referenceNumber} has been approved`,
                    applicationId,
                },
            });
        });

        it('should throw NotFoundException if application not found', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.notifyApplicationApproved('invalid-id'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('notifyApplicationRejected', () => {
        it('should create notification when application is rejected', async () => {
            const applicationId = 'app-123';
            const reason = 'Missing required documents';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue({
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.APPLICATION_REJECTED,
                title: 'Application Rejected',
                message: `Your application ${mockApplication.referenceNumber} has been rejected. Reason: ${reason}`,
                applicationId,
                isRead: false,
                createdAt: new Date(),
            });

            await service.notifyApplicationRejected(applicationId, reason);

            expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    type: NotificationType.APPLICATION_REJECTED,
                    title: 'Application Rejected',
                    message: `Your application ${mockApplication.referenceNumber} has been rejected. Reason: ${reason}`,
                    applicationId,
                },
            });
        });

        it('should throw NotFoundException if application not found', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.notifyApplicationRejected('invalid-id', 'Some reason'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('getUserNotifications', () => {
        it('should return paginated notifications for user', async () => {
            const userId = 'user-123';
            const mockNotifications = [
                {
                    id: 'notif-1',
                    userId,
                    type: NotificationType.APPLICATION_SUBMITTED,
                    title: 'Application Submitted',
                    message: 'Your application has been submitted',
                    isRead: false,
                    createdAt: new Date(),
                    application: {
                        id: 'app-1',
                        referenceNumber: 'BP/2026/04/00001',
                        permitType: PermitType.BUILDING_PERMIT,
                        status: WorkflowStage.DOCUMENT_CHECK,
                    },
                },
            ];

            mockPrismaService.notification.findMany.mockResolvedValue(
                mockNotifications,
            );
            mockPrismaService.notification.count.mockResolvedValue(1);

            const result = await service.getUserNotifications(userId, {
                page: 1,
                limit: 10,
            });

            expect(result).toEqual({
                data: mockNotifications,
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            });
            expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
                where: { userId },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
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
            });
        });

        it('should filter by isRead status', async () => {
            const userId = 'user-123';
            mockPrismaService.notification.findMany.mockResolvedValue([]);
            mockPrismaService.notification.count.mockResolvedValue(0);

            await service.getUserNotifications(userId, {
                isRead: false,
                page: 1,
                limit: 10,
            });

            expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId, isRead: false },
                }),
            );
        });
    });

    describe('getUnreadCount', () => {
        it('should return count of unread notifications', async () => {
            const userId = 'user-123';
            mockPrismaService.notification.count.mockResolvedValue(5);

            const count = await service.getUnreadCount(userId);

            expect(count).toBe(5);
            expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
                where: {
                    userId,
                    isRead: false,
                },
            });
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            const notificationId = 'notif-123';
            const userId = 'user-123';
            const mockNotification = {
                id: notificationId,
                userId,
                type: NotificationType.APPLICATION_SUBMITTED,
                title: 'Test',
                message: 'Test message',
                isRead: false,
                createdAt: new Date(),
            };

            mockPrismaService.notification.findUnique.mockResolvedValue(
                mockNotification,
            );
            mockPrismaService.notification.update.mockResolvedValue({
                ...mockNotification,
                isRead: true,
            });

            await service.markAsRead(notificationId, userId);

            expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
                where: { id: notificationId },
                data: { isRead: true },
            });
        });

        it('should throw NotFoundException if notification not found', async () => {
            mockPrismaService.notification.findUnique.mockResolvedValue(null);

            await expect(
                service.markAsRead('invalid-id', 'user-123'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user does not own notification', async () => {
            const mockNotification = {
                id: 'notif-123',
                userId: 'other-user',
                type: NotificationType.APPLICATION_SUBMITTED,
                title: 'Test',
                message: 'Test message',
                isRead: false,
                createdAt: new Date(),
            };

            mockPrismaService.notification.findUnique.mockResolvedValue(
                mockNotification,
            );

            await expect(
                service.markAsRead('notif-123', 'user-123'),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all unread notifications as read for user', async () => {
            const userId = 'user-123';
            mockPrismaService.notification.updateMany.mockResolvedValue({
                count: 3,
            });

            await service.markAllAsRead(userId);

            expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                },
            });
        });
    });
});
