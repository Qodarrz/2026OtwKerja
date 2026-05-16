import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    WorkflowStage,
    BottleneckSeverity,
    BottleneckStatus,
    BottleneckEvent,
    SLAStatus,
    Role,
} from '@prisma/client';
import { SLAService } from '../../permits/services/sla.service';
import { AnalyticsService } from '../../permits/services/analytics.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
    AuditEntityType,
    AuditActionType,
} from '../../audit-log/dto/audit-log.dto';

export interface BottleneckScore {
    stage: WorkflowStage;
    score: number;
    severity: BottleneckSeverity;
    queueLength: number;
    queueWeight: number;
    avgProcessingTime: number;
    processingWeight: number;
    slaViolationRate: number;
    slaWeight: number;
    staffWorkload: number;
    workloadWeight: number;
}

export interface StageMetrics {
    queueLength: number;
    avgProcessingTime: number;
    slaViolationCount: number;
    totalApplications: number;
    activeStaffCount: number;
}

export interface StageThresholds {
    queueLengthThreshold: number;
    processingTimeMultiplier: number;
    slaViolationPercentage: number;
    workloadPerStaff: number;
    bottleneckScoreThreshold: number;
}

@Injectable()
export class BottleneckDetectionService {
    private readonly logger = new Logger(BottleneckDetectionService.name);

    /** In-memory cache for stage metrics. Key: stage name. */
    private readonly metricsCache = new Map<
        string,
        { data: StageMetrics; expiresAt: number }
    >();

    /** Cache TTL: 2 minutes (120 000 ms) */
    private readonly CACHE_TTL_MS = 120_000;

    constructor(
        private prisma: PrismaService,
        private slaService: SLAService,
        private analyticsService: AnalyticsService,
        private auditLogService: AuditLogService,
    ) {}

    /**
     * Main detection method - analyzes all stages for bottlenecks
     */
    async detectBottlenecks(): Promise<BottleneckEvent[]> {
        const stages = [
            WorkflowStage.DOCUMENT_CHECK,
            WorkflowStage.FIELD_INSPECTION,
            WorkflowStage.LEGALIZATION,
        ];

        const detectedBottlenecks: BottleneckEvent[] = [];

        for (const stage of stages) {
            try {
                const score = await this.calculateBottleneckScore(stage);
                const thresholds = await this.getThresholds(stage);

                // Create bottleneck event if score exceeds threshold
                if (score.score >= thresholds.bottleneckScoreThreshold) {
                    const bottleneck = await this.createBottleneckEvent(score);
                    detectedBottlenecks.push(bottleneck);
                    this.logger.log(
                        `Bottleneck detected at ${stage}: score=${score.score}, severity=${score.severity}`,
                    );
                }
            } catch (error) {
                this.logger.error(
                    `Error detecting bottleneck for stage ${stage}:`,
                    error,
                );
                // Continue processing other stages even if one fails
            }
        }

        return detectedBottlenecks;
    }

    /**
     * Calculate bottleneck score for a specific stage
     */
    async calculateBottleneckScore(
        stage: WorkflowStage,
    ): Promise<BottleneckScore> {
        const metrics = await this.getStageMetrics(stage);
        const thresholds = await this.getThresholds(stage);

        let expectedProcessingTime = 24;
        try {
            const slaRules = await this.slaService.getAllSLARules();
            const slaRule = slaRules.find((r) => r.stage === stage);
            if (slaRule) {
                expectedProcessingTime = slaRule.maxDurationHours;
            }
        } catch (error) {
            this.logger.warn(
                `Could not retrieve SLA rules for stage ${stage}, using default: ${error.message}`,
            );
        }

        const queueWeight = this.normalizeMetric(
            metrics.queueLength,
            thresholds.queueLengthThreshold,
            100,
        );

        // Processing time weight: ((current / expected) - 1) × 100, capped at 100
        const processingTimeRatio =
            metrics.avgProcessingTime / expectedProcessingTime;
        const processingWeight = Math.min(
            100,
            Math.max(0, (processingTimeRatio - 1) * 100),
        );

        // SLA violation weight: (violations / total) × 100
        const slaWeight =
            metrics.totalApplications > 0
                ? (metrics.slaViolationCount / metrics.totalApplications) * 100
                : 0;

        // Workload weight: (current workload / threshold) × 100, capped at 100
        const currentWorkload =
            metrics.activeStaffCount > 0
                ? metrics.queueLength / metrics.activeStaffCount
                : metrics.queueLength; // If no staff, use queue length directly
        const workloadWeight = this.normalizeMetric(
            currentWorkload,
            thresholds.workloadPerStaff,
            100,
        );

        // Apply weights: 0.3, 0.3, 0.25, 0.15
        const score =
            0.3 * queueWeight +
            0.3 * processingWeight +
            0.25 * slaWeight +
            0.15 * workloadWeight;

        const finalScore = Math.min(100, Math.max(0, Math.round(score)));

        let severity: BottleneckSeverity;
        if (finalScore >= 80) {
            severity = BottleneckSeverity.HIGH;
        } else if (finalScore >= 60) {
            severity = BottleneckSeverity.MEDIUM;
        } else {
            severity = BottleneckSeverity.LOW;
        }

        return {
            stage,
            score: finalScore,
            severity,
            queueLength: metrics.queueLength,
            queueWeight: Math.round(queueWeight * 10) / 10,
            avgProcessingTime: Math.round(metrics.avgProcessingTime * 10) / 10,
            processingWeight: Math.round(processingWeight * 10) / 10,
            slaViolationRate:
                metrics.totalApplications > 0
                    ? Math.round(
                          (metrics.slaViolationCount / metrics.totalApplications) *
                              100 *
                              10,
                      ) / 10
                    : 0,
            slaWeight: Math.round(slaWeight * 10) / 10,
            staffWorkload: Math.round(currentWorkload * 10) / 10,
            workloadWeight: Math.round(workloadWeight * 10) / 10,
        };
    }

    /**
     * Get current metrics for a stage.
     * Results are cached for 2 minutes to reduce database queries.
     */
    private async getStageMetrics(
        stage: WorkflowStage,
    ): Promise<StageMetrics> {
        const cacheKey = stage as string;
        const cached = this.metricsCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }

        let result: StageMetrics;

        try {
            const stageBottlenecks = await this.analyticsService.getStageBottlenecks();
            const stageData = stageBottlenecks.find((b) => b.stage === stage);

            if (stageData) {
                // Use analytics service data for queue length, processing time, and staff count
                const queueLength = stageData.activeCount;
                const avgProcessingTime = stageData.averageDurationHours;
                const activeStaffCount = stageData.staffCount;

                // SLA violation data from analytics
                const slaViolationCount = stageData.overdueCount;
                const totalApplications =
                    stageData.overdueCount + stageData.warningCount + stageData.activeCount;

                result = {
                    queueLength,
                    avgProcessingTime,
                    slaViolationCount,
                    totalApplications,
                    activeStaffCount,
                };
            } else {
                result = await this.getStageMetricsDirect(stage);
            }
        } catch (error) {
            this.logger.warn(
                `Could not retrieve analytics data for stage ${stage}, falling back to direct queries: ${error.message}`,
            );
            result = await this.getStageMetricsDirect(stage);
        }

        this.metricsCache.set(cacheKey, {
            data: result,
            expiresAt: Date.now() + this.CACHE_TTL_MS,
        });

        return result;
    }

    /**
     * Direct database query fallback for stage metrics
     */
    private async getStageMetricsDirect(
        stage: WorkflowStage,
    ): Promise<StageMetrics> {
        // Get queue length (active applications at this stage)
        const queueLength = await this.prisma.permitApplication.count({
            where: { currentStage: stage },
        });

        // Get completed stage histories for average processing time
        const completedStages = await this.prisma.stageHistory.findMany({
            where: {
                toStage: stage,
                completedAt: { not: null },
            },
            select: {
                durationHours: true,
                slaStatus: true,
            },
            orderBy: {
                completedAt: 'desc',
            },
            take: 100,
        });

        // Calculate average processing time
        const totalDuration = completedStages.reduce(
            (sum, s) => sum + (s.durationHours || 0),
            0,
        );
        const avgProcessingTime =
            completedStages.length > 0
                ? totalDuration / completedStages.length
                : 0;

        // Count SLA violations
        const slaViolationCount = completedStages.filter(
            (s) => s.slaStatus === SLAStatus.OVERDUE,
        ).length;

        // Get active staff count for this stage
        const roleMap = {
            [WorkflowStage.DOCUMENT_CHECK]: Role.DOCUMENT_VALIDATOR,
            [WorkflowStage.FIELD_INSPECTION]: Role.FIELD_INSPECTOR,
            [WorkflowStage.LEGALIZATION]: Role.LEGALIZER,
        };

        const activeStaffCount = await this.prisma.user.count({
            where: {
                roles: { has: roleMap[stage] },
            },
        });

        return {
            queueLength,
            avgProcessingTime,
            slaViolationCount,
            totalApplications: completedStages.length,
            activeStaffCount,
        };
    }

    /**
     * Normalize a metric value to a 0-100 scale relative to its threshold.
     */
    private normalizeMetric(
        value: number,
        threshold: number,
        max: number,
    ): number {
        if (threshold === 0) return 0;
        const normalized = (value / threshold) * 100;
        return Math.min(max, Math.max(0, normalized));
    }

    /**
     * Get thresholds for a stage (stage-specific or global default).
     */
    private async getThresholds(
        stage: WorkflowStage,
    ): Promise<StageThresholds> {
        // Try to get stage-specific threshold — select only needed fields
        const stageThreshold = await this.prisma.bottleneckThreshold.findUnique({
            where: { stage },
            select: {
                queueLengthThreshold: true,
                processingTimeMultiplier: true,
                slaViolationPercentage: true,
                workloadPerStaff: true,
                bottleneckScoreThreshold: true,
            },
        });

        if (stageThreshold) {
            return {
                queueLengthThreshold: stageThreshold.queueLengthThreshold,
                processingTimeMultiplier:
                    stageThreshold.processingTimeMultiplier,
                slaViolationPercentage: stageThreshold.slaViolationPercentage,
                workloadPerStaff: stageThreshold.workloadPerStaff,
                bottleneckScoreThreshold:
                    stageThreshold.bottleneckScoreThreshold,
            };
        }

        // Fall back to global default
        const globalThreshold = await this.prisma.bottleneckThreshold.findFirst(
            {
                where: { stage: { equals: null } },
                select: {
                    queueLengthThreshold: true,
                    processingTimeMultiplier: true,
                    slaViolationPercentage: true,
                    workloadPerStaff: true,
                    bottleneckScoreThreshold: true,
                },
            },
        );

        if (globalThreshold) {
            return {
                queueLengthThreshold: globalThreshold.queueLengthThreshold,
                processingTimeMultiplier:
                    globalThreshold.processingTimeMultiplier,
                slaViolationPercentage: globalThreshold.slaViolationPercentage,
                workloadPerStaff: globalThreshold.workloadPerStaff,
                bottleneckScoreThreshold:
                    globalThreshold.bottleneckScoreThreshold,
            };
        }

        return {
            queueLengthThreshold: 10,
            processingTimeMultiplier: 1.5,
            slaViolationPercentage: 20.0,
            workloadPerStaff: 5.0,
            bottleneckScoreThreshold: 60,
        };
    }

    /**
     * Create a bottleneck event record when a stage score exceeds the threshold.
     */
    async createBottleneckEvent(
        score: BottleneckScore,
    ): Promise<BottleneckEvent> {
        const bottleneck = await this.prisma.bottleneckEvent.create({
            data: {
                stage: score.stage,
                score: score.score,
                severity: score.severity,
                queueLength: score.queueLength,
                queueWeight: score.queueWeight,
                avgProcessingTime: score.avgProcessingTime,
                processingWeight: score.processingWeight,
                slaViolationRate: score.slaViolationRate,
                slaWeight: score.slaWeight,
                staffWorkload: score.staffWorkload,
                workloadWeight: score.workloadWeight,
                status: BottleneckStatus.ACTIVE,
            },
        });

        this.logger.log(
            `Created bottleneck event ${bottleneck.id} for stage ${score.stage}`,
        );

        try {
            await this.auditLogService.createAuditLog({
                entityType: AuditEntityType.BOTTLENECK,
                entityId: bottleneck.id,
                action: AuditActionType.DETECTED,
                performedBy: undefined, // system-triggered
                changes: {
                    stage: score.stage,
                    score: score.score,
                    severity: score.severity,
                    queueLength: score.queueLength,
                    queueWeight: score.queueWeight,
                    avgProcessingTime: score.avgProcessingTime,
                    processingWeight: score.processingWeight,
                    slaViolationRate: score.slaViolationRate,
                    slaWeight: score.slaWeight,
                    staffWorkload: score.staffWorkload,
                    workloadWeight: score.workloadWeight,
                },
            });
        } catch (error) {
            this.logger.error(
                `Failed to create audit log for bottleneck ${bottleneck.id}:`,
                error,
            );
        }

        return bottleneck;
    }

    /**
     * Check if a bottleneck is resolved by recalculating the current score.
     */
    async checkResolution(bottleneckId: string): Promise<boolean> {
        const bottleneck = await this.prisma.bottleneckEvent.findUnique({
            where: { id: bottleneckId },
            select: {
                id: true,
                stage: true,
                status: true,
                detectedAt: true,
                score: true,
            },
        });

        if (!bottleneck || bottleneck.status !== BottleneckStatus.ACTIVE) {
            return false;
        }

        // Recalculate current score for the stage
        const currentScore = await this.calculateBottleneckScore(
            bottleneck.stage,
        );
        const thresholds = await this.getThresholds(bottleneck.stage);

        // Check if score is below threshold
        if (currentScore.score < thresholds.bottleneckScoreThreshold) {
            const now = new Date();
            const resolutionDuration = Math.floor(
                (now.getTime() - bottleneck.detectedAt.getTime()) / (1000 * 60),
            );

            await this.prisma.bottleneckEvent.update({
                where: { id: bottleneckId },
                data: {
                    status: BottleneckStatus.RESOLVED,
                    resolvedAt: now,
                    resolutionDuration,
                },
            });

            this.logger.log(
                `Bottleneck ${bottleneckId} resolved after ${resolutionDuration} minutes`,
            );

            try {
                await this.auditLogService.createAuditLog({
                    entityType: AuditEntityType.BOTTLENECK,
                    entityId: bottleneckId,
                    action: AuditActionType.RESOLVED,
                    performedBy: undefined, // system-triggered
                    changes: {
                        stage: bottleneck.stage,
                        previousScore: bottleneck.score,
                        currentScore: currentScore.score,
                        resolutionDuration,
                        resolvedAt: now.toISOString(),
                    },
                });
            } catch (error) {
                this.logger.error(
                    `Failed to create audit log for resolution of bottleneck ${bottleneckId}:`,
                    error,
                );
            }

            return true;
        }

        return false;
    }

    /**
     * Get all active bottlenecks
     */
    async getActiveBottlenecks(): Promise<BottleneckEvent[]> {
        return this.prisma.bottleneckEvent.findMany({
            where: { status: BottleneckStatus.ACTIVE },
            orderBy: { detectedAt: 'desc' },
        });
    }

    /**
     * Get bottleneck by ID
     */
    async getBottleneckById(id: string): Promise<BottleneckEvent | null> {
        return this.prisma.bottleneckEvent.findUnique({
            where: { id },
            include: {
                recommendations: true,
                resolutionActions: true,
            },
        });
    }
}
