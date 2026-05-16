import { Test, TestingModule } from '@nestjs/testing';
import { BottleneckRecommendationService } from '../../src/modules/bottleneck/services/bottleneck-recommendation.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
    WorkflowStage,
    BottleneckSeverity,
    BottleneckStatus,
    RecommendationType,
    RecommendationPriority,
} from '@prisma/client';

describe('BottleneckRecommendationService', () => {
    let service: BottleneckRecommendationService;
    let prisma: PrismaService;

    const mockPrismaService = {
        bottleneckRecommendation: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BottleneckRecommendationService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<BottleneckRecommendationService>(
            BottleneckRecommendationService,
        );
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateRecommendations', () => {
        it('should generate ADD_STAFF recommendation when queue weight > 40%', async () => {
            const bottleneck = {
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                score: 75,
                severity: BottleneckSeverity.MEDIUM,
                queueLength: 25,
                queueWeight: 50.0,
                avgProcessingTime: 10.0,
                processingWeight: 20.0,
                slaViolationRate: 15.0,
                slaWeight: 15.0,
                staffWorkload: 5.0,
                workloadWeight: 25.0,
                status: BottleneckStatus.ACTIVE,
                detectedAt: new Date(),
                resolvedAt: null,
                resolutionDuration: null,
            };

            mockPrismaService.bottleneckRecommendation.create.mockImplementation(
                (args) => Promise.resolve({ id: 'rec-id', ...args.data }),
            );

            const result = await service.generateRecommendations(bottleneck);

            expect(result.length).toBeGreaterThan(0);
            expect(
                result.some((r) => r.type === RecommendationType.ADD_STAFF),
            ).toBe(true);
            expect(
                mockPrismaService.bottleneckRecommendation.create,
            ).toHaveBeenCalled();
        });

        it('should generate OPTIMIZE_PROCESS recommendation when processing weight > 40%', async () => {
            const bottleneck = {
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                score: 70,
                severity: BottleneckSeverity.MEDIUM,
                queueLength: 10,
                queueWeight: 20.0,
                avgProcessingTime: 30.0,
                processingWeight: 50.0,
                slaViolationRate: 10.0,
                slaWeight: 10.0,
                staffWorkload: 3.0,
                workloadWeight: 15.0,
                status: BottleneckStatus.ACTIVE,
                detectedAt: new Date(),
                resolvedAt: null,
                resolutionDuration: null,
            };

            mockPrismaService.bottleneckRecommendation.create.mockImplementation(
                (args) => Promise.resolve({ id: 'rec-id', ...args.data }),
            );

            const result = await service.generateRecommendations(bottleneck);

            expect(result.length).toBeGreaterThan(0);
            expect(
                result.some(
                    (r) => r.type === RecommendationType.OPTIMIZE_PROCESS,
                ),
            ).toBe(true);
        });

        it('should generate ADJUST_SLA recommendation when SLA weight > 40%', async () => {
            const bottleneck = {
                id: 'test-id',
                stage: WorkflowStage.FIELD_INSPECTION,
                score: 80,
                severity: BottleneckSeverity.HIGH,
                queueLength: 15,
                queueWeight: 25.0,
                avgProcessingTime: 20.0,
                processingWeight: 20.0,
                slaViolationRate: 60.0,
                slaWeight: 50.0,
                staffWorkload: 4.0,
                workloadWeight: 20.0,
                status: BottleneckStatus.ACTIVE,
                detectedAt: new Date(),
                resolvedAt: null,
                resolutionDuration: null,
            };

            mockPrismaService.bottleneckRecommendation.create.mockImplementation(
                (args) => Promise.resolve({ id: 'rec-id', ...args.data }),
            );

            const result = await service.generateRecommendations(bottleneck);

            expect(result.length).toBeGreaterThan(0);
            expect(
                result.some((r) => r.type === RecommendationType.ADJUST_SLA),
            ).toBe(true);
        });

        it('should generate REASSIGN_STAFF recommendation when workload weight > 40%', async () => {
            const bottleneck = {
                id: 'test-id',
                stage: WorkflowStage.LEGALIZATION,
                score: 65,
                severity: BottleneckSeverity.MEDIUM,
                queueLength: 18,
                queueWeight: 30.0,
                avgProcessingTime: 15.0,
                processingWeight: 15.0,
                slaViolationRate: 10.0,
                slaWeight: 10.0,
                staffWorkload: 9.0,
                workloadWeight: 45.0,
                status: BottleneckStatus.ACTIVE,
                detectedAt: new Date(),
                resolvedAt: null,
                resolutionDuration: null,
            };

            mockPrismaService.bottleneckRecommendation.create.mockImplementation(
                (args) => Promise.resolve({ id: 'rec-id', ...args.data }),
            );

            const result = await service.generateRecommendations(bottleneck);

            expect(result.length).toBeGreaterThan(0);
            expect(
                result.some(
                    (r) =>
                        r.type === RecommendationType.REASSIGN_STAFF ||
                        r.type === RecommendationType.ADD_STAFF,
                ),
            ).toBe(true);
        });

        it('should include specific metrics in recommendations', async () => {
            const bottleneck = {
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                score: 75,
                severity: BottleneckSeverity.MEDIUM,
                queueLength: 20,
                queueWeight: 50.0,
                avgProcessingTime: 10.0,
                processingWeight: 20.0,
                slaViolationRate: 15.0,
                slaWeight: 15.0,
                staffWorkload: 5.0,
                workloadWeight: 25.0,
                status: BottleneckStatus.ACTIVE,
                detectedAt: new Date(),
                resolvedAt: null,
                resolutionDuration: null,
            };

            mockPrismaService.bottleneckRecommendation.create.mockImplementation(
                (args) => Promise.resolve({ id: 'rec-id', ...args.data }),
            );

            const result = await service.generateRecommendations(bottleneck);

            const addStaffRec = result.find(
                (r) => r.type === RecommendationType.ADD_STAFF,
            );
            expect(addStaffRec).toBeDefined();
            expect(addStaffRec.specificMetrics).toHaveProperty('staffToAdd');
            expect(addStaffRec.specificMetrics).toHaveProperty('targetStage');
        });

        it('should prioritize HIGH priority recommendations first', async () => {
            const bottleneck = {
                id: 'test-id',
                stage: WorkflowStage.DOCUMENT_CHECK,
                score: 85,
                severity: BottleneckSeverity.HIGH,
                queueLength: 30,
                queueWeight: 60.0,
                avgProcessingTime: 25.0,
                processingWeight: 45.0,
                slaViolationRate: 40.0,
                slaWeight: 40.0,
                staffWorkload: 10.0,
                workloadWeight: 50.0,
                status: BottleneckStatus.ACTIVE,
                detectedAt: new Date(),
                resolvedAt: null,
                resolutionDuration: null,
            };

            mockPrismaService.bottleneckRecommendation.create.mockImplementation(
                (args) => Promise.resolve({ id: 'rec-id', ...args.data }),
            );

            const result = await service.generateRecommendations(bottleneck);

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].priority).toBe(RecommendationPriority.HIGH);
        });
    });

    describe('getRecommendationsForBottleneck', () => {
        it('should return recommendations for a bottleneck', async () => {
            const mockRecommendations = [
                {
                    id: 'rec-1',
                    bottleneckId: 'bottleneck-id',
                    type: RecommendationType.ADD_STAFF,
                    priority: RecommendationPriority.HIGH,
                    description: 'Add 2 staff members',
                    specificMetrics: { staffToAdd: 2 },
                    estimatedImpact: 'HIGH',
                    createdAt: new Date(),
                },
                {
                    id: 'rec-2',
                    bottleneckId: 'bottleneck-id',
                    type: RecommendationType.OPTIMIZE_PROCESS,
                    priority: RecommendationPriority.MEDIUM,
                    description: 'Review process',
                    specificMetrics: {},
                    estimatedImpact: 'MEDIUM',
                    createdAt: new Date(),
                },
            ];

            mockPrismaService.bottleneckRecommendation.findMany.mockResolvedValue(
                mockRecommendations,
            );

            const result =
                await service.getRecommendationsForBottleneck('bottleneck-id');

            expect(result).toHaveLength(2);
            expect(result[0].priority).toBe(RecommendationPriority.HIGH);
        });
    });

    describe('getRecommendationById', () => {
        it('should return recommendation by ID', async () => {
            const mockRecommendation = {
                id: 'rec-id',
                bottleneckId: 'bottleneck-id',
                type: RecommendationType.ADD_STAFF,
                priority: RecommendationPriority.HIGH,
                description: 'Add staff',
                specificMetrics: {},
                estimatedImpact: 'HIGH',
                createdAt: new Date(),
            };

            mockPrismaService.bottleneckRecommendation.findUnique.mockResolvedValue(
                mockRecommendation,
            );

            const result = await service.getRecommendationById('rec-id');

            expect(result).toEqual(mockRecommendation);
        });

        it('should return null when recommendation not found', async () => {
            mockPrismaService.bottleneckRecommendation.findUnique.mockResolvedValue(
                null,
            );

            const result = await service.getRecommendationById('non-existent');

            expect(result).toBeNull();
        });
    });
});
