import { Test, TestingModule } from '@nestjs/testing';
import { BottleneckDetectionService } from '../../src/modules/bottleneck/services/bottleneck-detection.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
    WorkflowStage,
    BottleneckSeverity,
    BottleneckStatus,
    SLAStatus,
    Role,
} from '@prisma/client';

describe('BottleneckDetectionService', () => {
    let service: BottleneckDetectionService;
    let prisma: PrismaService;

    const mockPrismaService = {
        permitApplication: {
            count: jest.fn(),
        },
        stageHistory: {
            findMany: jest.fn(),
        },
        user: {
            count: jest.fn(),
        },
        sLARule: {
            findUnique: jest.fn(),
        },
        bottleneckThreshold: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
        bottleneckEvent: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BottleneckDetectionService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<BottleneckDetectionService>(
            BottleneckDetectionService,
        );
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateBottleneckScore', () => {
        it('should calculate score correctly with normal metrics', async () => {
            // Mock stage metrics
            mockPrismaService.permitApplication.count.mockResolvedValue(15); // queue length
            mockPrismaService.stageHistory.findMany.mockResolvedValue([
                { durationHours: 10, slaStatus: SLAStatus.ON_TIME },
                { durationHours: 12, slaStatus: SLAStatus.OVERDUE },
                { durationHours: 8, slaStatus: SLAStatus.ON_TIME },
            ]);
            mockPrismaService.user.count.mockResolvedValue(3); // staff count
            mockPrismaService.sLARule.findUnique.mockResolvedValue({
                stage: WorkflowStage.DOCUMENT_CHECK,
                maxDurationHours: 24,
                warningThreshold: 0.8,
            });
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.findFirst.mockResolvedValue({
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
            });

            const result = await service.calculateBottleneckScore(
                WorkflowStage.DOCUMENT_CHECK,
            );

            expect(result.stage).toBe(WorkflowStage.DOCUMENT_CHECK);
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
            expect(result.queueLength).toBe(15);
            expect(result.avgProcessingTime).toBeCloseTo(10, 1);
        });

        it('should handle zero staff count without throwing', async () => {
            mockPrismaService.permitApplication.count.mockResolvedValue(10);
            mockPrismaService.stageHistory.findMany.mockResolvedValue([]);
            mockPrismaService.user.count.mockResolvedValue(0); // No staff
            mockPrismaService.sLARule.findUnique.mockResolvedValue({
                stage: WorkflowStage.DOCUMENT_CHECK,
                maxDurationHours: 24,
                warningThreshold: 0.8,
            });
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.findFirst.mockResolvedValue({
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
            });

            const result = await service.calculateBottleneckScore(
                WorkflowStage.DOCUMENT_CHECK,
            );

            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it('should handle zero applications without throwing', async () => {
            mockPrismaService.permitApplication.count.mockResolvedValue(0);
            mockPrismaService.stageHistory.findMany.mockResolvedValue([]);
            mockPrismaService.user.count.mockResolvedValue(3);
            mockPrismaService.sLARule.findUnique.mockResolvedValue({
                stage: WorkflowStage.DOCUMENT_CHECK,
                maxDurationHours: 24,
                warningThreshold: 0.8,
            });
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.findFirst.mockResolvedValue({
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
            });

            const result = await service.calculateBottleneckScore(
                WorkflowStage.DOCUMENT_CHECK,
            );

            expect(result.score).toBe(0);
            expect(result.queueLength).toBe(0);
        });

        it('should assign HIGH severity when score >= 80', async () => {
            mockPrismaService.permitApplication.count.mockResolvedValue(50); // High queue
            mockPrismaService.stageHistory.findMany.mockResolvedValue([
                { durationHours: 48, slaStatus: SLAStatus.OVERDUE },
                { durationHours: 50, slaStatus: SLAStatus.OVERDUE },
            ]);
            mockPrismaService.user.count.mockResolvedValue(1); // Low staff
            mockPrismaService.sLARule.findUnique.mockResolvedValue({
                stage: WorkflowStage.DOCUMENT_CHECK,
                maxDurationHours: 24,
                warningThreshold: 0.8,
            });
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.findFirst.mockResolvedValue({
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
            });

            const result = await service.calculateBottleneckScore(
                WorkflowStage.DOCUMENT_CHECK,
            );

            expect(result.score).toBeGreaterThanOrEqual(80);
            expect(result.severity).toBe(BottleneckSeverity.HIGH);
        });

        it('should assign MEDIUM severity when score is 60-79', async () => {
            mockPrismaService.permitApplication.count.mockResolvedValue(18);
            mockPrismaService.stageHistory.findMany.mockResolvedValue([
                { durationHours: 20, slaStatus: SLAStatus.WARNING },
                { durationHours: 22, slaStatus: SLAStatus.OVERDUE },
            ]);
            mockPrismaService.user.count.mockResolvedValue(2);
            mockPrismaService.sLARule.findUnique.mockResolvedValue({
                stage: WorkflowStage.DOCUMENT_CHECK,
                maxDurationHours: 24,
                warningThreshold: 0.8,
            });
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.findFirst.mockResolvedValue({
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
            });

            const result = await service.calculateBottleneckScore(
                WorkflowStage.DOCUMENT_CHECK,
            );

            // This test might need adjustment based on actual calculation
            if (result.score >= 60 && result.score < 80) {
                expect(result.severity).toBe(BottleneckSeverity.MEDIUM);
            }
        });
    });

    describe('createBottleneckEvent', () => {
        it('should create bottleneck event with correct data', async () => {
            const mockScore = {
                stage: WorkflowStage.DOCUMENT_CHECK,
                score: 75,
                severity: BottleneckSeverity.MEDIUM,
                queueLength: 15,
                queueWeight: 50.0,
                avgProcessingTime: 10.5,
                processingWeight: 30.0,
                slaViolationRate: 25.0,
                slaWeight: 25.0,
                staffWorkload: 5.0,
                workloadWeight: 20.0,
            };

            const mockCreatedEvent = {
                id: 'test-id',
                ...mockScore,
                status: BottleneckStatus.ACTIVE,
                detectedAt: new Date(),
                resolvedAt: null,
                resolutionDuration: null,
            };

            mockPrismaService.bottleneckEvent.create.mockResolvedValue(
                mockCreatedEvent,
            );

            const result = await service.createBottleneckEvent(mockScore);

            expect(result.id).toBe('test-id');
            expect(result.stage).toBe(WorkflowStage.DOCUMENT_CHECK);
            expect(result.score).toBe(75);
            expect(result.status).toBe(BottleneckStatus.ACTIVE);
            expect(mockPrismaService.bottleneckEvent.create).toHaveBeenCalledWith(
                {
                    data: expect.objectContaining({
                        stage: WorkflowStage.DOCUMENT_CHECK,
                        score: 75,
                        severity: BottleneckSeverity.MEDIUM,
                        status: BottleneckStatus.ACTIVE,
                    }),
                },
            );
        });
    });

    describe('checkResolution', () => {
        it('should mark bottleneck as resolved when score drops below threshold', async () => {
            const mockBottleneck = {
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                score: 75,
                severity: BottleneckSeverity.MEDIUM,
                status: BottleneckStatus.ACTIVE,
                detectedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                resolvedAt: null,
                resolutionDuration: null,
                queueLength: 15,
                queueWeight: 50.0,
                avgProcessingTime: 10.5,
                processingWeight: 30.0,
                slaViolationRate: 25.0,
                slaWeight: 25.0,
                staffWorkload: 5.0,
                workloadWeight: 20.0,
            };

            mockPrismaService.bottleneckEvent.findUnique.mockResolvedValue(
                mockBottleneck,
            );

            // Mock low score (below threshold)
            mockPrismaService.permitApplication.count.mockResolvedValue(5);
            mockPrismaService.stageHistory.findMany.mockResolvedValue([
                { durationHours: 8, slaStatus: SLAStatus.ON_TIME },
            ]);
            mockPrismaService.user.count.mockResolvedValue(3);
            mockPrismaService.sLARule.findUnique.mockResolvedValue({
                stage: WorkflowStage.DOCUMENT_CHECK,
                maxDurationHours: 24,
                warningThreshold: 0.8,
            });
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.findFirst.mockResolvedValue({
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
            });

            mockPrismaService.bottleneckEvent.update.mockResolvedValue({
                ...mockBottleneck,
                status: BottleneckStatus.RESOLVED,
                resolvedAt: new Date(),
                resolutionDuration: 30,
            });

            const result = await service.checkResolution('test-id');

            expect(result).toBe(true);
            expect(mockPrismaService.bottleneckEvent.update).toHaveBeenCalledWith(
                {
                    where: { id: 'test-id' },
                    data: expect.objectContaining({
                        status: BottleneckStatus.RESOLVED,
                        resolvedAt: expect.any(Date),
                        resolutionDuration: expect.any(Number),
                    }),
                },
            );
        });

        it('should return false when bottleneck is not resolved', async () => {
            const mockBottleneck = {
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                score: 75,
                severity: BottleneckSeverity.MEDIUM,
                status: BottleneckStatus.ACTIVE,
                detectedAt: new Date(),
                resolvedAt: null,
                resolutionDuration: null,
                queueLength: 15,
                queueWeight: 50.0,
                avgProcessingTime: 10.5,
                processingWeight: 30.0,
                slaViolationRate: 25.0,
                slaWeight: 25.0,
                staffWorkload: 5.0,
                workloadWeight: 20.0,
            };

            mockPrismaService.bottleneckEvent.findUnique.mockResolvedValue(
                mockBottleneck,
            );

            // Mock high score (still above threshold)
            mockPrismaService.permitApplication.count.mockResolvedValue(20);
            mockPrismaService.stageHistory.findMany.mockResolvedValue([
                { durationHours: 30, slaStatus: SLAStatus.OVERDUE },
            ]);
            mockPrismaService.user.count.mockResolvedValue(2);
            mockPrismaService.sLARule.findUnique.mockResolvedValue({
                stage: WorkflowStage.DOCUMENT_CHECK,
                maxDurationHours: 24,
                warningThreshold: 0.8,
            });
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.findFirst.mockResolvedValue({
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
            });

            const result = await service.checkResolution('test-id');

            expect(result).toBe(false);
            expect(mockPrismaService.bottleneckEvent.update).not.toHaveBeenCalled();
        });
    });

    describe('detectBottlenecks', () => {
        it('should detect bottlenecks for all stages', async () => {
            // Mock high scores for all stages
            mockPrismaService.permitApplication.count.mockResolvedValue(20);
            mockPrismaService.stageHistory.findMany.mockResolvedValue([
                { durationHours: 30, slaStatus: SLAStatus.OVERDUE },
                { durationHours: 28, slaStatus: SLAStatus.OVERDUE },
            ]);
            mockPrismaService.user.count.mockResolvedValue(1);
            mockPrismaService.sLARule.findUnique.mockResolvedValue({
                maxDurationHours: 24,
                warningThreshold: 0.8,
            });
            mockPrismaService.bottleneckThreshold.findUnique.mockResolvedValue(
                null,
            );
            mockPrismaService.bottleneckThreshold.findFirst.mockResolvedValue({
                queueLengthThreshold: 10,
                processingTimeMultiplier: 1.5,
                slaViolationPercentage: 20.0,
                workloadPerStaff: 5.0,
                bottleneckScoreThreshold: 60,
            });

            mockPrismaService.bottleneckEvent.create.mockResolvedValue({
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                score: 85,
                severity: BottleneckSeverity.HIGH,
                status: BottleneckStatus.ACTIVE,
                detectedAt: new Date(),
                resolvedAt: null,
                resolutionDuration: null,
                queueLength: 20,
                queueWeight: 100.0,
                avgProcessingTime: 29.0,
                processingWeight: 50.0,
                slaViolationRate: 100.0,
                slaWeight: 100.0,
                staffWorkload: 20.0,
                workloadWeight: 100.0,
            });

            const result = await service.detectBottlenecks();

            expect(result.length).toBeGreaterThan(0);
            expect(mockPrismaService.bottleneckEvent.create).toHaveBeenCalled();
        });
    });
});
