import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../../src/modules/permits/services/notification.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotificationGateway } from '../../src/modules/permits/gateways/notification.gateway';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationType, PermitType, WorkflowStage } from '@prisma/client';

describe('NotificationService', () => {
    let service: NotificationService;
    let prisma: PrismaService;
    let gateway: NotificationGateway;

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
        user: {
            findUnique: jest.fn(),
        },
    };

    const mockNotificationGateway = {
        sendToUser: jest.fn(),
        sendToRole: jest.fn(),
        sendNotification: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: NotificationGateway,
                    useValue: mockNotificationGateway,
                },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
        prisma = module.get<PrismaService>(PrismaService);
        gateway = module.get<NotificationGateway>(NotificationGateway);

        // Clear all mocks and reset implementations before each test
        jest.clearAllMocks();
        mockNotificationGateway.sendToUser.mockImplementation(() => undefined);
        mockNotificationGateway.sendToRole.mockImplementation(() => undefined);
        mockNotificationGateway.sendNotification.mockImplementation(() => undefined);
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

        it('should emit WebSocket event after creating notification', async () => {
            const applicationId = 'app-123';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
                permitType: PermitType.BUILDING_PERMIT,
                status: WorkflowStage.DOCUMENT_CHECK,
            };
            const mockNotification = {
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.APPLICATION_SUBMITTED,
                title: 'Application Submitted',
                message: `Your application ${mockApplication.referenceNumber} has been submitted for document check`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            await service.notifyApplicationSubmitted(applicationId);

            expect(mockNotificationGateway.sendToUser).toHaveBeenCalledWith(
                'user-123',
                'notification:application_submitted',
                {
                    id: 'notif-123',
                    type: NotificationType.APPLICATION_SUBMITTED,
                    title: 'Application Submitted',
                    message: `Your application ${mockApplication.referenceNumber} has been submitted for document check`,
                    timestamp: '2026-04-22T10:00:00.000Z',
                    metadata: {
                        applicationId: 'app-123',
                        referenceNumber: 'BP/2026/04/00001',
                    },
                }
            );
        });

        it('should handle WebSocket delivery failure gracefully', async () => {
            const applicationId = 'app-123';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
                permitType: PermitType.BUILDING_PERMIT,
                status: WorkflowStage.DOCUMENT_CHECK,
            };
            const mockNotification = {
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.APPLICATION_SUBMITTED,
                title: 'Application Submitted',
                message: `Your application ${mockApplication.referenceNumber} has been submitted for document check`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            mockNotificationGateway.sendToUser.mockImplementation(() => {
                throw new Error('WebSocket connection failed');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Should not throw error - graceful failure
            await expect(
                service.notifyApplicationSubmitted(applicationId)
            ).resolves.not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                'WebSocket delivery failed:',
                expect.any(Error),
            );
            consoleSpy.mockRestore();

            // Notification should still be created in database
            expect(mockPrismaService.notification.create).toHaveBeenCalled();
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

        it('should emit WebSocket event after creating notification', async () => {
            const applicationId = 'app-123';
            const newStage = 'FIELD_INSPECTION';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.STAGE_ADVANCED,
                title: 'Stage Advanced',
                message: `Your application ${mockApplication.referenceNumber} has advanced to ${newStage} stage`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            await service.notifyStageAdvanced(applicationId, newStage);

            expect(mockNotificationGateway.sendToUser).toHaveBeenCalledWith(
                'user-123',
                'notification:stage_advanced',
                {
                    id: 'notif-123',
                    type: NotificationType.STAGE_ADVANCED,
                    title: 'Stage Advanced',
                    message: `Your application ${mockApplication.referenceNumber} has advanced to ${newStage} stage`,
                    timestamp: '2026-04-22T10:00:00.000Z',
                    metadata: {
                        applicationId: 'app-123',
                        referenceNumber: 'BP/2026/04/00001',
                        stage: newStage,
                    },
                }
            );
        });

        it('should handle WebSocket delivery failure gracefully', async () => {
            const applicationId = 'app-123';
            const newStage = 'FIELD_INSPECTION';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.STAGE_ADVANCED,
                title: 'Stage Advanced',
                message: `Your application ${mockApplication.referenceNumber} has advanced to ${newStage} stage`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            mockNotificationGateway.sendToUser.mockImplementation(() => {
                throw new Error('WebSocket connection failed');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Should not throw error - graceful failure
            await expect(
                service.notifyStageAdvanced(applicationId, newStage)
            ).resolves.not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                'WebSocket delivery failed:',
                expect.any(Error),
            );
            consoleSpy.mockRestore();

            // Notification should still be created in database
            expect(mockPrismaService.notification.create).toHaveBeenCalled();
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

        it('should emit WebSocket event after creating notification', async () => {
            const applicationId = 'app-123';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.APPLICATION_APPROVED,
                title: 'Application Approved',
                message: `Your application ${mockApplication.referenceNumber} has been approved`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            await service.notifyApplicationApproved(applicationId);

            expect(mockNotificationGateway.sendToUser).toHaveBeenCalledWith(
                'user-123',
                'notification:application_approved',
                {
                    id: 'notif-123',
                    type: NotificationType.APPLICATION_APPROVED,
                    title: 'Application Approved',
                    message: `Your application ${mockApplication.referenceNumber} has been approved`,
                    timestamp: '2026-04-22T10:00:00.000Z',
                    metadata: {
                        applicationId: 'app-123',
                        referenceNumber: 'BP/2026/04/00001',
                    },
                }
            );
        });

        it('should handle WebSocket delivery failure gracefully', async () => {
            const applicationId = 'app-123';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.APPLICATION_APPROVED,
                title: 'Application Approved',
                message: `Your application ${mockApplication.referenceNumber} has been approved`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            mockNotificationGateway.sendToUser.mockImplementation(() => {
                throw new Error('WebSocket connection failed');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Should not throw error - graceful failure
            await expect(
                service.notifyApplicationApproved(applicationId)
            ).resolves.not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                'WebSocket delivery failed:',
                expect.any(Error),
            );
            consoleSpy.mockRestore();

            // Notification should still be created in database
            expect(mockPrismaService.notification.create).toHaveBeenCalled();
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

        it('should emit WebSocket event after creating notification', async () => {
            const applicationId = 'app-123';
            const reason = 'Missing required documents';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.APPLICATION_REJECTED,
                title: 'Application Rejected',
                message: `Your application ${mockApplication.referenceNumber} has been rejected. Reason: ${reason}`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            await service.notifyApplicationRejected(applicationId, reason);

            expect(mockNotificationGateway.sendToUser).toHaveBeenCalledWith(
                'user-123',
                'notification:application_rejected',
                {
                    id: 'notif-123',
                    type: NotificationType.APPLICATION_REJECTED,
                    title: 'Application Rejected',
                    message: `Your application ${mockApplication.referenceNumber} has been rejected. Reason: ${reason}`,
                    timestamp: '2026-04-22T10:00:00.000Z',
                    metadata: {
                        applicationId: 'app-123',
                        referenceNumber: 'BP/2026/04/00001',
                        rejectionReason: reason,
                    },
                }
            );
        });

        it('should handle WebSocket delivery failure gracefully', async () => {
            const applicationId = 'app-123';
            const reason = 'Missing required documents';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: 'user-123',
                type: NotificationType.APPLICATION_REJECTED,
                title: 'Application Rejected',
                message: `Your application ${mockApplication.referenceNumber} has been rejected. Reason: ${reason}`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            mockNotificationGateway.sendToUser.mockImplementation(() => {
                throw new Error('WebSocket connection failed');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Should not throw error - graceful failure
            await expect(
                service.notifyApplicationRejected(applicationId, reason)
            ).resolves.not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                'WebSocket delivery failed:',
                expect.any(Error),
            );
            consoleSpy.mockRestore();

            // Notification should still be created in database
            expect(mockPrismaService.notification.create).toHaveBeenCalled();
        });

        it('should throw NotFoundException if application not found', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.notifyApplicationRejected('invalid-id', 'Some reason'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('notifySLAWarning', () => {
        it('should create SLA warning notification for staff member', async () => {
            const applicationId = 'app-123';
            const staffId = 'staff-123';
            const stage = 'DOCUMENT_CHECK';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockStaff = {
                id: staffId,
                name: 'John Validator',
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
            mockPrismaService.notification.create.mockResolvedValue({
                id: 'notif-123',
                userId: staffId,
                type: 'SLA_WARNING',
                title: 'SLA Warning',
                message: `Application ${mockApplication.referenceNumber} in ${stage} is nearing SLA limit. Please process immediately.`,
                applicationId,
                isRead: false,
                createdAt: new Date(),
            });

            await service.notifySLAWarning(applicationId, staffId, stage);

            expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: staffId,
                    type: 'SLA_WARNING',
                    title: 'SLA Warning',
                    message: `Application ${mockApplication.referenceNumber} in ${stage} is nearing SLA limit. Please process immediately.`,
                    applicationId,
                },
            });
        });

        it('should emit WebSocket event to assigned staff member', async () => {
            const applicationId = 'app-123';
            const staffId = 'staff-123';
            const stage = 'DOCUMENT_CHECK';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockStaff = {
                id: staffId,
                name: 'John Validator',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: staffId,
                type: 'SLA_WARNING',
                title: 'SLA Warning',
                message: `Application ${mockApplication.referenceNumber} in ${stage} is nearing SLA limit. Please process immediately.`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            await service.notifySLAWarning(applicationId, staffId, stage);

            expect(mockNotificationGateway.sendToUser).toHaveBeenCalledWith(
                staffId,
                'notification:sla_warning',
                {
                    id: 'notif-123',
                    type: 'SLA_WARNING',
                    title: 'SLA Warning',
                    message: `Application ${mockApplication.referenceNumber} in ${stage} is nearing SLA limit. Please process immediately.`,
                    timestamp: '2026-04-22T10:00:00.000Z',
                    metadata: {
                        applicationId: 'app-123',
                        referenceNumber: 'BP/2026/04/00001',
                        stage: 'DOCUMENT_CHECK',
                        urgencyLevel: 'high',
                        assignedStaffName: 'John Validator',
                        timeRemaining: 3600,
                    },
                }
            );
        });

        it('should broadcast to DOCUMENT_VALIDATOR role for DOCUMENT_CHECK stage', async () => {
            const applicationId = 'app-123';
            const staffId = 'staff-123';
            const stage = 'DOCUMENT_CHECK';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockStaff = {
                id: staffId,
                name: 'John Validator',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: staffId,
                type: 'SLA_WARNING',
                title: 'SLA Warning',
                message: `Application ${mockApplication.referenceNumber} in ${stage} is nearing SLA limit. Please process immediately.`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            // Don't throw error - let both sendToUser and sendToRole be called
            mockNotificationGateway.sendToUser.mockReturnValue(undefined);
            mockNotificationGateway.sendToRole.mockReturnValue(undefined);

            await service.notifySLAWarning(applicationId, staffId, stage);

            expect(mockNotificationGateway.sendToRole).toHaveBeenCalledWith(
                'DOCUMENT_VALIDATOR',
                'notification:sla_warning',
                expect.objectContaining({
                    id: 'notif-123',
                    type: 'SLA_WARNING',
                    metadata: expect.objectContaining({
                        stage: 'DOCUMENT_CHECK',
                    }),
                })
            );
        });

        it('should broadcast to FIELD_INSPECTOR role for FIELD_INSPECTION stage', async () => {
            const applicationId = 'app-123';
            const staffId = 'staff-123';
            const stage = 'FIELD_INSPECTION';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockStaff = {
                id: staffId,
                name: 'Jane Inspector',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: staffId,
                type: 'SLA_WARNING',
                title: 'SLA Warning',
                message: `Application ${mockApplication.referenceNumber} in ${stage} is nearing SLA limit. Please process immediately.`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            // Don't throw error - let both sendToUser and sendToRole be called
            mockNotificationGateway.sendToUser.mockReturnValue(undefined);
            mockNotificationGateway.sendToRole.mockReturnValue(undefined);

            await service.notifySLAWarning(applicationId, staffId, stage);

            expect(mockNotificationGateway.sendToRole).toHaveBeenCalledWith(
                'FIELD_INSPECTOR',
                'notification:sla_warning',
                expect.objectContaining({
                    metadata: expect.objectContaining({
                        stage: 'FIELD_INSPECTION',
                    }),
                })
            );
        });

        it('should broadcast to LEGALIZER role for LEGALIZATION stage', async () => {
            const applicationId = 'app-123';
            const staffId = 'staff-123';
            const stage = 'LEGALIZATION';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockStaff = {
                id: staffId,
                name: 'Bob Legalizer',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: staffId,
                type: 'SLA_WARNING',
                title: 'SLA Warning',
                message: `Application ${mockApplication.referenceNumber} in ${stage} is nearing SLA limit. Please process immediately.`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            // Don't throw error - let both sendToUser and sendToRole be called
            mockNotificationGateway.sendToUser.mockReturnValue(undefined);
            mockNotificationGateway.sendToRole.mockReturnValue(undefined);

            await service.notifySLAWarning(applicationId, staffId, stage);

            expect(mockNotificationGateway.sendToRole).toHaveBeenCalledWith(
                'LEGALIZER',
                'notification:sla_warning',
                expect.objectContaining({
                    metadata: expect.objectContaining({
                        stage: 'LEGALIZATION',
                    }),
                })
            );
        });

        it('should handle WebSocket delivery failure gracefully', async () => {
            const applicationId = 'app-123';
            const staffId = 'staff-123';
            const stage = 'DOCUMENT_CHECK';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockStaff = {
                id: staffId,
                name: 'John Validator',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: staffId,
                type: 'SLA_WARNING',
                title: 'SLA Warning',
                message: `Application ${mockApplication.referenceNumber} in ${stage} is nearing SLA limit. Please process immediately.`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue(mockStaff);
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            mockNotificationGateway.sendToUser.mockImplementation(() => {
                throw new Error('WebSocket connection failed');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Should not throw error - graceful failure
            await expect(
                service.notifySLAWarning(applicationId, staffId, stage)
            ).resolves.not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                'WebSocket delivery failed:',
                expect.any(Error),
            );
            consoleSpy.mockRestore();

            // Notification should still be created in database
            expect(mockPrismaService.notification.create).toHaveBeenCalled();
        });

        it('should return early if application not found', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await service.notifySLAWarning('invalid-id', 'staff-123', 'DOCUMENT_CHECK');

            // Should not create notification if application not found
            expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
            expect(mockNotificationGateway.sendToUser).not.toHaveBeenCalled();
            expect(mockNotificationGateway.sendToRole).not.toHaveBeenCalled();
        });

        it('should handle missing staff name gracefully', async () => {
            const applicationId = 'app-123';
            const staffId = 'staff-123';
            const stage = 'DOCUMENT_CHECK';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: staffId,
                type: 'SLA_WARNING',
                title: 'SLA Warning',
                message: `Application ${mockApplication.referenceNumber} in ${stage} is nearing SLA limit. Please process immediately.`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            await service.notifySLAWarning(applicationId, staffId, stage);

            expect(mockNotificationGateway.sendToUser).toHaveBeenCalledWith(
                staffId,
                'notification:sla_warning',
                expect.objectContaining({
                    metadata: expect.objectContaining({
                        assignedStaffName: 'Unknown',
                    }),
                })
            );
        });
    });

    describe('notifySLAEscalation', () => {
        it('should create SLA escalation notification for supervisor', async () => {
            const applicationId = 'app-123';
            const supervisorId = 'supervisor-123';
            const stage = 'DOCUMENT_CHECK';
            const staffName = 'John Validator';
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
                userId: supervisorId,
                type: 'SLA_ESCALATION',
                title: 'SLA Escalation Alert',
                message: `URGENT: Application ${mockApplication.referenceNumber} in ${stage} is OVERDUE. Assigned to: ${staffName}.`,
                applicationId,
                isRead: false,
                createdAt: new Date(),
            });

            await service.notifySLAEscalation(applicationId, supervisorId, stage, staffName);

            expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: supervisorId,
                    type: 'SLA_ESCALATION',
                    title: 'SLA Escalation Alert',
                    message: `URGENT: Application ${mockApplication.referenceNumber} in ${stage} is OVERDUE. Assigned to: ${staffName}.`,
                    applicationId,
                },
            });
        });

        it('should emit WebSocket event to supervisor', async () => {
            const applicationId = 'app-123';
            const supervisorId = 'supervisor-123';
            const stage = 'DOCUMENT_CHECK';
            const staffName = 'John Validator';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: supervisorId,
                type: 'SLA_ESCALATION',
                title: 'SLA Escalation Alert',
                message: `URGENT: Application ${mockApplication.referenceNumber} in ${stage} is OVERDUE. Assigned to: ${staffName}.`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            await service.notifySLAEscalation(applicationId, supervisorId, stage, staffName);

            expect(mockNotificationGateway.sendToUser).toHaveBeenCalledWith(
                supervisorId,
                'notification:sla_overdue',
                {
                    id: 'notif-123',
                    type: 'SLA_ESCALATION',
                    title: 'SLA Escalation Alert',
                    message: `URGENT: Application ${mockApplication.referenceNumber} in ${stage} is OVERDUE. Assigned to: ${staffName}.`,
                    timestamp: '2026-04-22T10:00:00.000Z',
                    metadata: {
                        applicationId: 'app-123',
                        referenceNumber: 'BP/2026/04/00001',
                        stage: 'DOCUMENT_CHECK',
                        urgencyLevel: 'critical',
                        assignedStaffName: 'John Validator',
                        overdueDuration: 7200,
                    },
                }
            );
        });

        it('should broadcast to ADMIN role', async () => {
            const applicationId = 'app-123';
            const supervisorId = 'supervisor-123';
            const stage = 'FIELD_INSPECTION';
            const staffName = 'Jane Inspector';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: supervisorId,
                type: 'SLA_ESCALATION',
                title: 'SLA Escalation Alert',
                message: `URGENT: Application ${mockApplication.referenceNumber} in ${stage} is OVERDUE. Assigned to: ${staffName}.`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            // Don't throw error - let both sendToUser and sendToRole be called
            mockNotificationGateway.sendToUser.mockReturnValue(undefined);
            mockNotificationGateway.sendToRole.mockReturnValue(undefined);

            await service.notifySLAEscalation(applicationId, supervisorId, stage, staffName);

            expect(mockNotificationGateway.sendToRole).toHaveBeenCalledWith(
                'ADMIN',
                'notification:sla_overdue',
                expect.objectContaining({
                    id: 'notif-123',
                    type: 'SLA_ESCALATION',
                    metadata: expect.objectContaining({
                        stage: 'FIELD_INSPECTION',
                        urgencyLevel: 'critical',
                        assignedStaffName: 'Jane Inspector',
                        overdueDuration: 7200,
                    }),
                })
            );
        });

        it('should handle WebSocket delivery failure gracefully', async () => {
            const applicationId = 'app-123';
            const supervisorId = 'supervisor-123';
            const stage = 'LEGALIZATION';
            const staffName = 'Bob Legalizer';
            const mockApplication = {
                id: applicationId,
                applicantId: 'user-123',
                referenceNumber: 'BP/2026/04/00001',
            };
            const mockNotification = {
                id: 'notif-123',
                userId: supervisorId,
                type: 'SLA_ESCALATION',
                title: 'SLA Escalation Alert',
                message: `URGENT: Application ${mockApplication.referenceNumber} in ${stage} is OVERDUE. Assigned to: ${staffName}.`,
                applicationId,
                isRead: false,
                createdAt: new Date('2026-04-22T10:00:00Z'),
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.notification.create.mockResolvedValue(mockNotification);
            mockNotificationGateway.sendToUser.mockImplementation(() => {
                throw new Error('WebSocket connection failed');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Should not throw error - graceful failure
            await expect(
                service.notifySLAEscalation(applicationId, supervisorId, stage, staffName)
            ).resolves.not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                'WebSocket delivery failed:',
                expect.any(Error),
            );
            consoleSpy.mockRestore();

            // Notification should still be created in database
            expect(mockPrismaService.notification.create).toHaveBeenCalled();
        });

        it('should return early if application not found', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await service.notifySLAEscalation('invalid-id', 'supervisor-123', 'DOCUMENT_CHECK', 'John Validator');

            // Should not create notification if application not found
            expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
            expect(mockNotificationGateway.sendToUser).not.toHaveBeenCalled();
            expect(mockNotificationGateway.sendToRole).not.toHaveBeenCalled();
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
