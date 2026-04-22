import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from '../../src/modules/permits/services/workflow.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { WorkflowStage, ActionType, Role, PermitType } from '@prisma/client';
import {
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';

describe('WorkflowService', () => {
    let service: WorkflowService;
    let prisma: PrismaService;

    const mockPrismaService = {
        permitApplication: {
            findUnique: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        validationAction: {
            create: jest.fn(),
        },
        stageHistory: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
        notification: {
            create: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WorkflowService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<WorkflowService>(WorkflowService);
        prisma = module.get<PrismaService>(PrismaService);

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getNextStage', () => {
        it('should return DOCUMENT_CHECK for DRAFT', () => {
            expect(service.getNextStage(WorkflowStage.DRAFT)).toBe(
                WorkflowStage.DOCUMENT_CHECK,
            );
        });

        it('should return FIELD_INSPECTION for DOCUMENT_CHECK', () => {
            expect(service.getNextStage(WorkflowStage.DOCUMENT_CHECK)).toBe(
                WorkflowStage.FIELD_INSPECTION,
            );
        });

        it('should return LEGALIZATION for FIELD_INSPECTION', () => {
            expect(service.getNextStage(WorkflowStage.FIELD_INSPECTION)).toBe(
                WorkflowStage.LEGALIZATION,
            );
        });

        it('should return APPROVED for LEGALIZATION', () => {
            expect(service.getNextStage(WorkflowStage.LEGALIZATION)).toBe(
                WorkflowStage.APPROVED,
            );
        });

        it('should return null for APPROVED', () => {
            expect(service.getNextStage(WorkflowStage.APPROVED)).toBeNull();
        });

        it('should return null for REJECTED', () => {
            expect(service.getNextStage(WorkflowStage.REJECTED)).toBeNull();
        });
    });

    describe('canUserAccessStage', () => {
        it('should allow ADMIN to access all stages', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.ADMIN],
            });

            expect(
                await service.canUserAccessStage(
                    'user-1',
                    WorkflowStage.DOCUMENT_CHECK,
                ),
            ).toBe(true);
            expect(
                await service.canUserAccessStage(
                    'user-1',
                    WorkflowStage.FIELD_INSPECTION,
                ),
            ).toBe(true);
            expect(
                await service.canUserAccessStage(
                    'user-1',
                    WorkflowStage.LEGALIZATION,
                ),
            ).toBe(true);
        });

        it('should allow DOCUMENT_VALIDATOR to access DOCUMENT_CHECK', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.DOCUMENT_VALIDATOR],
            });

            expect(
                await service.canUserAccessStage(
                    'user-1',
                    WorkflowStage.DOCUMENT_CHECK,
                ),
            ).toBe(true);
        });

        it('should not allow DOCUMENT_VALIDATOR to access FIELD_INSPECTION', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.DOCUMENT_VALIDATOR],
            });

            expect(
                await service.canUserAccessStage(
                    'user-1',
                    WorkflowStage.FIELD_INSPECTION,
                ),
            ).toBe(false);
        });

        it('should allow FIELD_INSPECTOR to access FIELD_INSPECTION', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.FIELD_INSPECTOR],
            });

            expect(
                await service.canUserAccessStage(
                    'user-1',
                    WorkflowStage.FIELD_INSPECTION,
                ),
            ).toBe(true);
        });

        it('should allow LEGALIZER to access LEGALIZATION', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.LEGALIZER],
            });

            expect(
                await service.canUserAccessStage(
                    'user-1',
                    WorkflowStage.LEGALIZATION,
                ),
            ).toBe(true);
        });

        it('should return false for non-existent user', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            expect(
                await service.canUserAccessStage(
                    'user-1',
                    WorkflowStage.DOCUMENT_CHECK,
                ),
            ).toBe(false);
        });
    });

    describe('approveApplication', () => {
        const mockApplication = {
            id: 'app-1',
            referenceNumber: 'BP/2026/04/00001',
            currentStage: WorkflowStage.DOCUMENT_CHECK,
            applicantId: 'applicant-1',
        };

        const mockUser = {
            id: 'user-1',
            roles: [Role.DOCUMENT_VALIDATOR],
        };

        it('should approve application and advance to next stage', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.permitApplication.update.mockResolvedValue({
                ...mockApplication,
                currentStage: WorkflowStage.FIELD_INSPECTION,
            });

            const result = await service.approveApplication('app-1', 'user-1', {
                notes: 'Documents verified',
            });

            expect(result.currentStage).toBe(WorkflowStage.FIELD_INSPECTION);
            expect(mockPrismaService.validationAction.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        actionType: ActionType.APPROVE,
                        stage: WorkflowStage.DOCUMENT_CHECK,
                    }),
                }),
            );
            expect(mockPrismaService.stageHistory.create).toHaveBeenCalled();
            expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
            expect(mockPrismaService.notification.create).toHaveBeenCalled();
        });

        it('should throw NotFoundException if application not found', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.approveApplication('app-1', 'user-1', {}),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user lacks permission', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.USER],
            });

            await expect(
                service.approveApplication('app-1', 'user-1', {}),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should require inspection notes for Field Inspector', async () => {
            const fieldInspectionApp = {
                ...mockApplication,
                currentStage: WorkflowStage.FIELD_INSPECTION,
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                fieldInspectionApp,
            );
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.FIELD_INSPECTOR],
            });

            await expect(
                service.approveApplication('app-1', 'user-1', {}),
            ).rejects.toThrow(BadRequestException);
        });

        it('should accept inspection notes for Field Inspector', async () => {
            const fieldInspectionApp = {
                ...mockApplication,
                currentStage: WorkflowStage.FIELD_INSPECTION,
            };

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                fieldInspectionApp,
            );
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.FIELD_INSPECTOR],
            });
            mockPrismaService.permitApplication.update.mockResolvedValue({
                ...fieldInspectionApp,
                currentStage: WorkflowStage.LEGALIZATION,
            });

            const result = await service.approveApplication('app-1', 'user-1', {
                inspectionNotes: 'Property inspected and verified',
            });

            expect(result.currentStage).toBe(WorkflowStage.LEGALIZATION);
        });
    });

    describe('rejectApplication', () => {
        const mockApplication = {
            id: 'app-1',
            referenceNumber: 'BP/2026/04/00001',
            currentStage: WorkflowStage.DOCUMENT_CHECK,
            applicantId: 'applicant-1',
        };

        const mockUser = {
            id: 'user-1',
            roles: [Role.DOCUMENT_VALIDATOR],
        };

        it('should reject application with reason', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.permitApplication.update.mockResolvedValue({
                ...mockApplication,
                status: WorkflowStage.REJECTED,
                currentStage: WorkflowStage.REJECTED,
                rejectionReason: 'Missing documents',
            });

            const result = await service.rejectApplication('app-1', 'user-1', {
                reason: 'Missing documents',
            });

            expect(result.status).toBe(WorkflowStage.REJECTED);
            expect(mockPrismaService.validationAction.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        actionType: ActionType.REJECT,
                    }),
                }),
            );
            expect(mockPrismaService.stageHistory.create).toHaveBeenCalled();
            expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
            expect(mockPrismaService.notification.create).toHaveBeenCalled();
        });

        it('should throw BadRequestException if reason is empty', async () => {
            await expect(
                service.rejectApplication('app-1', 'user-1', { reason: '' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if application not found', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.rejectApplication('app-1', 'user-1', {
                    reason: 'Missing documents',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user lacks permission', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.USER],
            });

            await expect(
                service.rejectApplication('app-1', 'user-1', {
                    reason: 'Missing documents',
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getApplicationsForStaff', () => {
        it('should return applications for DOCUMENT_VALIDATOR', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.DOCUMENT_VALIDATOR],
            });

            const mockApplications = [
                {
                    id: 'app-1',
                    currentStage: WorkflowStage.DOCUMENT_CHECK,
                    submittedAt: new Date('2026-04-01'),
                    applicant: { id: 'applicant-1', name: 'John Doe' },
                },
            ];

            mockPrismaService.permitApplication.findMany.mockResolvedValue(
                mockApplications,
            );

            const result = await service.getApplicationsForStaff('user-1', {});

            expect(result.length).toBe(1);
            expect(result[0].currentStage).toBe(WorkflowStage.DOCUMENT_CHECK);
            expect(result[0]).toHaveProperty('daysPending');
            expect(result[0]).toHaveProperty('isPendingLong');
        });

        it('should return applications for multiple roles', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR],
            });

            mockPrismaService.permitApplication.findMany.mockResolvedValue([]);

            await service.getApplicationsForStaff('user-1', {});

            expect(mockPrismaService.permitApplication.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        currentStage: {
                            in: expect.arrayContaining([
                                WorkflowStage.DOCUMENT_CHECK,
                                WorkflowStage.FIELD_INSPECTION,
                            ]),
                        },
                    }),
                }),
            );
        });

        it('should return empty array for user without staff roles', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.USER],
            });

            const result = await service.getApplicationsForStaff('user-1', {});

            expect(result).toEqual([]);
        });

        it('should allow ADMIN to see all stages', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.ADMIN],
            });

            mockPrismaService.permitApplication.findMany.mockResolvedValue([]);

            await service.getApplicationsForStaff('user-1', {});

            expect(mockPrismaService.permitApplication.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        currentStage: {
                            in: expect.arrayContaining([
                                WorkflowStage.DOCUMENT_CHECK,
                                WorkflowStage.FIELD_INSPECTION,
                                WorkflowStage.LEGALIZATION,
                            ]),
                        },
                    }),
                }),
            );
        });
    });

    describe('getPendingCount', () => {
        it('should return count of pending applications', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.DOCUMENT_VALIDATOR],
            });

            mockPrismaService.permitApplication.count.mockResolvedValue(5);

            const result = await service.getPendingCount('user-1');

            expect(result).toBe(5);
        });

        it('should return 0 for user without staff roles', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                roles: [Role.USER],
            });

            const result = await service.getPendingCount('user-1');

            expect(result).toBe(0);
        });

        it('should return 0 for non-existent user', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            const result = await service.getPendingCount('user-1');

            expect(result).toBe(0);
        });
    });

    describe('getStageHistory', () => {
        it('should return stage history for application', async () => {
            const mockHistory = [
                {
                    id: 'history-1',
                    fromStage: WorkflowStage.DRAFT,
                    toStage: WorkflowStage.DOCUMENT_CHECK,
                    transitionedAt: new Date(),
                },
            ];

            mockPrismaService.stageHistory.findMany.mockResolvedValue(mockHistory);

            const result = await service.getStageHistory('app-1');

            expect(result).toEqual(mockHistory);
            expect(mockPrismaService.stageHistory.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { applicationId: 'app-1' },
                    orderBy: { transitionedAt: 'asc' },
                }),
            );
        });
    });

    describe('getValidationActions', () => {
        it('should return validation actions for application', async () => {
            const mockActions = [
                {
                    id: 'action-1',
                    actionType: ActionType.APPROVE,
                    stage: WorkflowStage.DOCUMENT_CHECK,
                    performedBy: { id: 'user-1', name: 'Staff Member' },
                },
            ];

            mockPrismaService.validationAction.findMany = jest
                .fn()
                .mockResolvedValue(mockActions);

            const result = await service.getValidationActions('app-1');

            expect(result).toEqual(mockActions);
        });
    });
});
