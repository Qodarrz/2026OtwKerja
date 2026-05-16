import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    BottleneckEvent,
    BottleneckRecommendation,
    RecommendationType,
    RecommendationPriority,
    WorkflowStage,
} from '@prisma/client';

interface RecommendationData {
    type: RecommendationType;
    priority: RecommendationPriority;
    description: string;
    specificMetrics: Record<string, any>;
    estimatedImpact: 'HIGH' | 'MEDIUM' | 'LOW';
}

@Injectable()
export class BottleneckRecommendationService {
    private readonly logger = new Logger(BottleneckRecommendationService.name);

    constructor(private prisma: PrismaService) {}

    async generateRecommendations(
        bottleneck: BottleneckEvent,
    ): Promise<BottleneckRecommendation[]> {
        const recommendations: RecommendationData[] = [];

        const primaryFactor = this.getPrimaryFactor(bottleneck);

        if (primaryFactor === 'queue' || primaryFactor === 'workload') {
            recommendations.push(
                ...this.generateStaffRecommendations(bottleneck),
            );
        }

        if (primaryFactor === 'processing') {
            recommendations.push(
                ...this.generateProcessRecommendations(bottleneck),
            );
        }

        if (primaryFactor === 'sla') {
            recommendations.push(...this.generateSLARecommendations(bottleneck));
        }

        const prioritized = this.prioritizeRecommendations(recommendations);

        const created = await Promise.all(
            prioritized.map((rec) =>
                this.prisma.bottleneckRecommendation.create({
                    data: {
                        bottleneckId: bottleneck.id,
                        type: rec.type,
                        priority: rec.priority,
                        description: rec.description,
                        specificMetrics: rec.specificMetrics,
                        estimatedImpact: rec.estimatedImpact,
                    },
                }),
            ),
        );

        this.logger.log(
            `Generated ${created.length} recommendations for bottleneck ${bottleneck.id}`,
        );

        return created;
    }

    private getPrimaryFactor(bottleneck: BottleneckEvent): string {
        const weights = {
            queue: bottleneck.queueWeight,
            processing: bottleneck.processingWeight,
            sla: bottleneck.slaWeight,
            workload: bottleneck.workloadWeight,
        };

        let maxWeight = 0;
        let primaryFactor = 'queue';

        for (const [factor, weight] of Object.entries(weights)) {
            if (weight > maxWeight) {
                maxWeight = weight;
                primaryFactor = factor;
            }
        }

        return primaryFactor;
    }

    private generateStaffRecommendations(
        bottleneck: BottleneckEvent,
    ): RecommendationData[] {
        const recommendations: RecommendationData[] = [];

        if (bottleneck.queueWeight > 40) {
            const staffToAdd = Math.ceil(bottleneck.queueLength / 10);

            recommendations.push({
                type: RecommendationType.ADD_STAFF,
                priority: RecommendationPriority.HIGH,
                description: `Add ${staffToAdd} staff member${staffToAdd > 1 ? 's' : ''} to ${bottleneck.stage} stage to reduce queue length from ${bottleneck.queueLength} applications`,
                specificMetrics: {
                    staffToAdd,
                    targetStage: bottleneck.stage,
                    currentQueue: bottleneck.queueLength,
                },
                estimatedImpact: 'HIGH',
            });
        }

        if (bottleneck.workloadWeight > 40) {
            const currentWorkload = bottleneck.staffWorkload;
            const targetWorkload = 5;
            const staffNeeded = Math.ceil(
                bottleneck.queueLength / targetWorkload,
            );

            if (currentWorkload > targetWorkload * 1.5) {
                recommendations.push({
                    type: RecommendationType.ADD_STAFF,
                    priority: RecommendationPriority.HIGH,
                    description: `Current workload is ${currentWorkload.toFixed(1)} applications per staff. Add staff to reduce to target of ${targetWorkload} applications per staff`,
                    specificMetrics: {
                        currentWorkload,
                        targetWorkload,
                        staffNeeded,
                        targetStage: bottleneck.stage,
                    },
                    estimatedImpact: 'HIGH',
                });
            } else {
                recommendations.push({
                    type: RecommendationType.REASSIGN_STAFF,
                    priority: RecommendationPriority.MEDIUM,
                    description: `Reassign staff from other stages to ${bottleneck.stage} to balance workload (current: ${currentWorkload.toFixed(1)} apps/staff)`,
                    specificMetrics: {
                        currentWorkload,
                        targetWorkload,
                        targetStage: bottleneck.stage,
                    },
                    estimatedImpact: 'MEDIUM',
                });
            }
        }

        return recommendations;
    }

    private generateProcessRecommendations(
        bottleneck: BottleneckEvent,
    ): RecommendationData[] {
        const recommendations: RecommendationData[] = [];

        if (bottleneck.processingWeight > 40) {
            recommendations.push({
                type: RecommendationType.OPTIMIZE_PROCESS,
                priority: RecommendationPriority.HIGH,
                description: `Review and optimize ${bottleneck.stage} process. Current average processing time is ${bottleneck.avgProcessingTime.toFixed(1)} hours, which exceeds expected duration`,
                specificMetrics: {
                    currentProcessingTime: bottleneck.avgProcessingTime,
                    targetStage: bottleneck.stage,
                },
                estimatedImpact: 'HIGH',
            });

            const slaRule = this.getSLADurationForStage(bottleneck.stage);
            const suggestedDuration = Math.ceil(
                bottleneck.avgProcessingTime * 1.2,
            );

            recommendations.push({
                type: RecommendationType.ADJUST_SLA,
                priority: RecommendationPriority.MEDIUM,
                description: `Consider adjusting SLA duration for ${bottleneck.stage} from ${slaRule} hours to ${suggestedDuration} hours to match actual processing time`,
                specificMetrics: {
                    currentSLA: slaRule,
                    suggestedSLA: suggestedDuration,
                    currentProcessingTime: bottleneck.avgProcessingTime,
                    targetStage: bottleneck.stage,
                },
                estimatedImpact: 'MEDIUM',
            });
        }

        return recommendations;
    }

    private generateSLARecommendations(
        bottleneck: BottleneckEvent,
    ): RecommendationData[] {
        const recommendations: RecommendationData[] = [];

        if (bottleneck.slaWeight > 40) {
            const slaRule = this.getSLADurationForStage(bottleneck.stage);
            const suggestedDuration = Math.ceil(slaRule * 1.3);

            recommendations.push({
                type: RecommendationType.ADJUST_SLA,
                priority: RecommendationPriority.HIGH,
                description: `SLA violation rate is ${bottleneck.slaViolationRate.toFixed(1)}%. Consider extending SLA duration from ${slaRule} hours to ${suggestedDuration} hours`,
                specificMetrics: {
                    currentSLA: slaRule,
                    suggestedSLA: suggestedDuration,
                    violationRate: bottleneck.slaViolationRate,
                    targetStage: bottleneck.stage,
                },
                estimatedImpact: 'HIGH',
            });

            const staffToAdd = Math.ceil(bottleneck.queueLength / 15);
            recommendations.push({
                type: RecommendationType.ADD_STAFF,
                priority: RecommendationPriority.HIGH,
                description: `Add ${staffToAdd} staff member${staffToAdd > 1 ? 's' : ''} to reduce SLA violations at ${bottleneck.stage} stage`,
                specificMetrics: {
                    staffToAdd,
                    targetStage: bottleneck.stage,
                    violationRate: bottleneck.slaViolationRate,
                },
                estimatedImpact: 'HIGH',
            });
        }

        return recommendations;
    }

    private prioritizeRecommendations(
        recommendations: RecommendationData[],
    ): RecommendationData[] {
        const priorityOrder = {
            [RecommendationPriority.HIGH]: 3,
            [RecommendationPriority.MEDIUM]: 2,
            [RecommendationPriority.LOW]: 1,
        };

        const impactOrder = {
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1,
        };

        return recommendations.sort((a, b) => {
            const priorityDiff =
                priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;

            return impactOrder[b.estimatedImpact] - impactOrder[a.estimatedImpact];
        });
    }

    private getSLADurationForStage(stage: WorkflowStage): number {
        const defaultDurations = {
            [WorkflowStage.DOCUMENT_CHECK]: 24,
            [WorkflowStage.FIELD_INSPECTION]: 48,
            [WorkflowStage.LEGALIZATION]: 72,
        };

        return defaultDurations[stage] || 24;
    }

    async getRecommendationsForBottleneck(
        bottleneckId: string,
    ): Promise<BottleneckRecommendation[]> {
        return this.prisma.bottleneckRecommendation.findMany({
            where: { bottleneckId },
            orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        });
    }

    async getRecommendationById(
        id: string,
    ): Promise<BottleneckRecommendation | null> {
        return this.prisma.bottleneckRecommendation.findUnique({
            where: { id },
        });
    }
}
