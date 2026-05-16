import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BottleneckThresholdService } from '../../src/modules/bottleneck/services/bottleneck-threshold.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { WorkflowStage } from '@prisma/client';

describe('BottleneckThresholdService', () => {
    let service: BottleneckThresholdService;
    let prisma: PrismaService;

    const mockPrismaService = {
        bottleneckThreshold: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BottleneckThresholdService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<BottleneckThresholdService>(
            BottleneckThresholdService,
        );
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getThresholds', () => {
        it('should return stage-specific thresholds when available', async () => {
            const mockThreshold = {
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                queueLengthThreshold: 15,
                processingTimeMultiplier: 2.0,
                slaViolationPercentage: 25.0,
                workloadPerStaff: 6.0,
                bottleneckScoreThreshold: 70,
                createdBy: 'admin',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                mockThreshold,
            );

            const result = await service.getThresholds(
                WorkflowStage.DOCUMENT_CHECK,
            );

            expect(result.queueLengthThreshold).toBe(15);
            expect(result.processingTimeMultiplier).toBe(2.0);
            expect(result.slaViolationPercentage).toBe(25.0);
            expect(result.workloadPerStaff).toBe(6.0);
            expect(result.bottleneckScoreThreshold).toBe(70);
        });

        it('should return global default when stage-specific not found', async () => {
            const mockGlobalThreshold = {
                id: 'global-id',
                stage: null,
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
                createdBy: 'system',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.findFirst.mockResolvedValue(
                mockGlobalThreshold,
            );

            const result = await service.getThresholds(
                WorkflowStage.DOCUMENT_CHECK,
            );

            expect(result.queueLengthThreshold).toBe(10);
            expect(result.processingTimeMultiplier).toBe(1.5);
        });

        it('should return hardcoded defaults when no configuration exists', async () => {
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.findFirst.mockResolvedValue(
                null,
            );

            const result = await service.getThresholds(
                WorkflowStage.DOCUMENT_CHECK,
            );

            expect(result.queueLengthThreshold).toBe(10);
            expect(result.processingTimeMultiplier).toBe(1.5);
            expect(result.slaViolationPercentage).toBe(20.0);
            expect(result.workloadPerStaff).toBe(5.0);
            expect(result.bottleneckScoreThreshold).toBe(60);
        });
    });

    describe('getAllThresholds', () => {
        it('should return all threshold configurations', async () => {
            const mockThresholds = [
                {
                    id: 'global-id',
                    stage: null,
                    queueLengthThreshold: 10,
                    processingTimeMultiplier: 1.5,
                    slaViolationPercentage: 20.0,
                    workloadPerStaff: 5.0,
                    bottleneckScoreThreshold: 60,
                    createdBy: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 'stage-id',
                    stage: WorkflowStage.DOCUMENT_CHECK,
                    queueLengthThreshold: 15,
                    processingTimeMultiplier: 2.0,
                    slaViolationPercentage: 25.0,
                    workloadPerStaff: 6.0,
                    bottleneckScoreThreshold: 70,
                    createdBy: 'admin',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPrismaService.bottleneckThreshold.findMany.mockResolvedValue(
                mockThresholds,
            );

            const result = await service.getAllThresholds();

            expect(result).toHaveLength(2);
            expect(result[0].stage).toBeNull();
            expect(result[1].stage).toBe(WorkflowStage.DOCUMENT_CHECK);
        });
    });

    describe('updateThresholds', () => {
        it('should update existing threshold configuration', async () => {
            const existingThreshold = {
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
                createdBy: 'admin',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const updatedThreshold = {
                ...existingThreshold,
                queueLengthThreshold: 15,
                processingTimeMultiplier: 2.0,
            };

            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                existingThreshold,
            );
            mockPrismaService.bottleneckThreshold.update.mockResolvedValue(
                updatedThreshold,
            );

            const result = await service.updateThresholds({
                stage: WorkflowStage.DOCUMENT_CHECK,
                queueLengthThreshold: 15,
                processingTimeMultiplier: 2.0,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
                createdBy: 'admin',
            });

            expect(result.queueLengthThreshold).toBe(15);
            expect(result.processingTimeMultiplier).toBe(2.0);
            expect(mockPrismaService.bottleneckThreshold.update).toHaveBeenCalled();
        });

        it('should create new threshold if not exists', async () => {
            const newThreshold = {
                id: 'new-id',
                stage: WorkflowStage.FIELD_INSPECTION,
                queueLengthThreshold: 12,
                processingTimeMultiplier: 1.8,
                slaViolationPercentage: 22.0,
                workloadPerStaff: 5.5,
                bottleneckScoreThreshold: 65,
                createdBy: 'admin',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.create.mockResolvedValue(
                newThreshold,
            );

            const result = await service.updateThresholds({
                stage: WorkflowStage.FIELD_INSPECTION,
                queueLengthThreshold: 12,
                processingTimeMultiplier: 1.8,
                slaViolationPercentage: 22.0,
                workloadPerStaff: 5.5,
                bottleneckScoreThreshold: 65,
                createdBy: 'admin',
            });

            expect(result.stage).toBe(WorkflowStage.FIELD_INSPECTION);
            expect(mockPrismaService.bottleneckThreshold.create).toHaveBeenCalled();
        });

        it('should reject negative queueLengthThreshold', async () => {
            await expect(
                service.updateThresholds({
                    stage: WorkflowStage.DOCUMENT_CHECK,
                    queueLengthThreshold: -5,
                    processingTimeMultiplier: 1.5,
                    slaViolationPercentage: 20.0,
                    workloadPerStaff: 5.0,
                    bottleneckScoreThreshold: 60,
                    createdBy: 'admin',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject zero processingTimeMultiplier', async () => {
            await expect(
                service.updateThresholds({
                    stage: WorkflowStage.DOCUMENT_CHECK,
                    queueLengthThreshold: 10,
                    processingTimeMultiplier: 0,
                    slaViolationPercentage: 20.0,
                    workloadPerStaff: 5.0,
                    bottleneckScoreThreshold: 60,
                    createdBy: 'admin',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject slaViolationPercentage outside 0-100 range', async () => {
            await expect(
                service.updateThresholds({
                    stage: WorkflowStage.DOCUMENT_CHECK,
                    queueLengthThreshold: 10,
                    processingTimeMultiplier: 1.5,
                    slaViolationPercentage: 150,
                    workloadPerStaff: 5.0,
                    bottleneckScoreThreshold: 60,
                    createdBy: 'admin',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject queueLengthThreshold exceeding maximum limit', async () => {
            await expect(
                service.updateThresholds({
                    stage: WorkflowStage.DOCUMENT_CHECK,
                    queueLengthThreshold: 1500,
                    processingTimeMultiplier: 1.5,
                    slaViolationPercentage: 20.0,
                    workloadPerStaff: 5.0,
                    bottleneckScoreThreshold: 60,
                    createdBy: 'admin',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject processingTimeMultiplier exceeding maximum limit', async () => {
            await expect(
                service.updateThresholds({
                    stage: WorkflowStage.DOCUMENT_CHECK,
                    queueLengthThreshold: 10,
                    processingTimeMultiplier: 15,
                    slaViolationPercentage: 20.0,
                    workloadPerStaff: 5.0,
                    bottleneckScoreThreshold: 60,
                    createdBy: 'admin',
                }),
            ).rejects.toThrow(BadRequestException);
        });

        it('should reject workloadPerStaff exceeding maximum limit', async () => {
            await expect(
                service.updateThresholds({
                    stage: WorkflowStage.DOCUMENT_CHECK,
                    queueLengthThreshold: 10,
                    processingTimeMultiplier: 1.5,
                    slaViolationPercentage: 20.0,
                    workloadPerStaff: 150,
                    bottleneckScoreThreshold: 60,
                    createdBy: 'admin',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('deleteThreshold', () => {
        it('should delete threshold configuration', async () => {
            const mockThreshold = {
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
                createdBy: 'admin',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                mockThreshold,
            );
            mockPrismaService.bottleneckThreshold.delete.mockResolvedValue(
                mockThreshold,
            );

            await service.deleteThreshold(WorkflowStage.DOCUMENT_CHECK);

            expect(mockPrismaService.bottleneckThreshold.delete).toHaveBeenCalledWith(
                {
                    where: { stage: WorkflowStage.DOCUMENT_CHECK },
                },
            );
        });

        it('should throw NotFoundException when threshold not found', async () => {
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );

            await expect(
                service.deleteThreshold(WorkflowStage.DOCUMENT_CHECK),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('getThresholdById', () => {
        it('should return threshold by ID', async () => {
            const mockThreshold = {
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
                createdBy: 'admin',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                mockThreshold,
            );

            const result = await service.getThresholdById('test-id');

            expect(result).toEqual(mockThreshold);
            expect(mockPrismaService.bottleneckThreshold.findUnique).toHaveBeenCalledWith(
                {
                    where: { id: 'test-id' },
                },
            );
        });

        it('should return null when threshold not found', async () => {
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );

            const result = await service.getThresholdById('non-existent-id');

            expect(result).toBeNull();
        });
    });
});
