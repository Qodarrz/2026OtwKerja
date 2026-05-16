import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    WorkflowStage,
    BottleneckSeverity,
    BottleneckStatus,
    ResolutionActionType,
} from '@prisma/client';

export interface HistoricalFilters {
    startDate?: Date;
    endDate?: Date;
    stage?: WorkflowStage;
    severity?: BottleneckSeverity;
}

export interface HistoricalReport {
    totalBottlenecks: number;
    averageDuration: number;
    mostAffectedStages: StageCount[];
    peakOccurrenceTimes: TimeSlot[];
    severityBreakdown: SeverityCount[];
}

export interface StageCount {
    stage: WorkflowStage;
    count: number;
    percentage: number;
}

export interface TimeSlot {
    hour: number;
    count: number;
}

export interface SeverityCount {
    severity: BottleneckSeverity;
    count: number;
    percentage: number;
}

export interface RecurringPattern {
    stage: WorkflowStage;
    occurrencesPerWeek: number;
    averageScore: number;
    isRecurring: boolean;
}

export interface TrendMetrics {
    currentPeriod: PeriodMetrics;
    previousPeriod: PeriodMetrics;
    percentageChange: number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

export interface PeriodMetrics {
    totalBottlenecks: number;
    averageScore: number;
    averageDuration: number;
}

export interface EffectivenessReport {
    byActionType: Record<string, ActionEffectiveness>;
    byStage: Record<string, StageEffectiveness>;
}

export interface ActionEffectiveness {
    totalActions: number;
    successfulResolutions: number;
    successRate: number;
    avgResolutionTime: number;
}

export interface StageEffectiveness {
    stage: WorkflowStage;
    totalResolutions: number;
    avgResolutionTime: number;
    mostEffectiveAction: ResolutionActionType;
}

@Injectable()
export class BottleneckHistoricalService {
    private readonly logger = new Logger(BottleneckHistoricalService.name);

    constructor(private prisma: PrismaService) {}

    async generateReport(
        filters: HistoricalFilters,
    ): Promise<HistoricalReport> {
        const where: any = {};

        if (filters.startDate || filters.endDate) {
            where.detectedAt = {};
            if (filters.startDate) {
                where.detectedAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.detectedAt.lte = filters.endDate;
            }
        }

        if (filters.stage) {
            where.stage = filters.stage;
        }

        if (filters.severity) {
            where.severity = filters.severity;
        }

        const [bottlenecks, archivedBottlenecks] = await Promise.all([
            this.prisma.bottleneckEvent.findMany({ where }),
            this.prisma.bottleneckEventArchive.findMany({ where }),
        ]);

        const allBottlenecks = [...bottlenecks, ...archivedBottlenecks];

        const totalBottlenecks = allBottlenecks.length;

        const resolvedBottlenecks = allBottlenecks.filter(
            (b) => b.resolutionDuration !== null,
        );
        const averageDuration =
            resolvedBottlenecks.length > 0
                ? resolvedBottlenecks.reduce(
                      (sum, b) => sum + (b.resolutionDuration || 0),
                      0,
                  ) / resolvedBottlenecks.length
                : 0;

        const stageGroups = this.groupByStage(allBottlenecks);
        const mostAffectedStages = Object.entries(stageGroups)
            .map(([stage, count]) => ({
                stage: stage as WorkflowStage,
                count,
                percentage: (count / totalBottlenecks) * 100,
            }))
            .sort((a, b) => b.count - a.count);

        const peakOccurrenceTimes = this.calculatePeakTimes(allBottlenecks);

        const severityGroups = this.groupBySeverity(allBottlenecks);
        const severityBreakdown = Object.entries(severityGroups)
            .map(([severity, count]) => ({
                severity: severity as BottleneckSeverity,
                count,
                percentage: (count / totalBottlenecks) * 100,
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalBottlenecks,
            averageDuration: Math.round(averageDuration),
            mostAffectedStages,
            peakOccurrenceTimes,
            severityBreakdown,
        };
    }

    async identifyRecurringBottlenecks(): Promise<RecurringPattern[]> {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const recentBottlenecks = await this.prisma.bottleneckEvent.findMany({
            where: {
                detectedAt: {
                    gte: oneWeekAgo,
                },
            },
        });

        const stageGroups = this.groupByStage(recentBottlenecks);

        const patterns: RecurringPattern[] = [];

        for (const [stage, count] of Object.entries(stageGroups)) {
            const stageBottlenecks = recentBottlenecks.filter(
                (b) => b.stage === stage,
            );
            const averageScore =
                stageBottlenecks.reduce((sum, b) => sum + b.score, 0) /
                stageBottlenecks.length;

            patterns.push({
                stage: stage as WorkflowStage,
                occurrencesPerWeek: count,
                averageScore: Math.round(averageScore),
                isRecurring: count > 3,
            });
        }

        return patterns.sort((a, b) => b.occurrencesPerWeek - a.occurrencesPerWeek);
    }

    async calculateTrends(periodDays: number): Promise<TrendMetrics> {
        const now = new Date();
        const currentPeriodStart = new Date(
            now.getTime() - periodDays * 24 * 60 * 60 * 1000,
        );
        const previousPeriodStart = new Date(
            currentPeriodStart.getTime() - periodDays * 24 * 60 * 60 * 1000,
        );

        const [currentBottlenecks, previousBottlenecks] = await Promise.all([
            this.prisma.bottleneckEvent.findMany({
                where: {
                    detectedAt: {
                        gte: currentPeriodStart,
                        lte: now,
                    },
                },
            }),
            this.prisma.bottleneckEvent.findMany({
                where: {
                    detectedAt: {
                        gte: previousPeriodStart,
                        lt: currentPeriodStart,
                    },
                },
            }),
        ]);

        const currentPeriod = this.calculatePeriodMetrics(currentBottlenecks);
        const previousPeriod = this.calculatePeriodMetrics(previousBottlenecks);

        const percentageChange =
            previousPeriod.totalBottlenecks > 0
                ? ((currentPeriod.totalBottlenecks -
                      previousPeriod.totalBottlenecks) /
                      previousPeriod.totalBottlenecks) *
                  100
                : 0;

        let trend: 'INCREASING' | 'DECREASING' | 'STABLE';
        if (Math.abs(percentageChange) < 5) {
            trend = 'STABLE';
        } else if (percentageChange > 0) {
            trend = 'INCREASING';
        } else {
            trend = 'DECREASING';
        }

        return {
            currentPeriod,
            previousPeriod,
            percentageChange: Math.round(percentageChange * 10) / 10,
            trend,
        };
    }

    async getResolutionEffectiveness(): Promise<EffectivenessReport> {
        const resolutions = await this.prisma.bottleneckResolution.findMany({
            include: {
                bottleneck: true,
            },
        });

        const byActionType: Record<string, ActionEffectiveness> = {};
        const byStage: Record<string, any> = {};

        for (const resolution of resolutions) {
            const actionType = resolution.actionType;
            const stage = resolution.bottleneck.stage;

            if (!byActionType[actionType]) {
                byActionType[actionType] = {
                    totalActions: 0,
                    successfulResolutions: 0,
                    successRate: 0,
                    avgResolutionTime: 0,
                };
            }

            byActionType[actionType].totalActions += 1;

            if (resolution.wasEffective === true) {
                byActionType[actionType].successfulResolutions += 1;
            }

            if (resolution.bottleneck.resolutionDuration) {
                byActionType[actionType].avgResolutionTime +=
                    resolution.bottleneck.resolutionDuration;
            }

            if (!byStage[stage]) {
                byStage[stage] = {
                    stage,
                    totalResolutions: 0,
                    totalDuration: 0,
                    actionCounts: {} as Record<string, number>,
                };
            }

            byStage[stage].totalResolutions += 1;
            if (resolution.bottleneck.resolutionDuration) {
                byStage[stage].totalDuration +=
                    resolution.bottleneck.resolutionDuration;
            }

            if (!byStage[stage].actionCounts[actionType]) {
                byStage[stage].actionCounts[actionType] = 0;
            }
            byStage[stage].actionCounts[actionType] += 1;
        }

        for (const actionType in byActionType) {
            const data = byActionType[actionType];
            data.successRate =
                data.totalActions > 0
                    ? (data.successfulResolutions / data.totalActions) * 100
                    : 0;
            data.avgResolutionTime =
                data.totalActions > 0
                    ? Math.round(data.avgResolutionTime / data.totalActions)
                    : 0;
        }

        const stageEffectiveness: Record<string, StageEffectiveness> = {};
        for (const stage in byStage) {
            const data = byStage[stage];
            const mostEffectiveAction = Object.entries(data.actionCounts).sort(
                ([, a], [, b]) => (b as number) - (a as number),
            )[0]?.[0] as ResolutionActionType;

            stageEffectiveness[stage] = {
                stage: stage as WorkflowStage,
                totalResolutions: data.totalResolutions,
                avgResolutionTime:
                    data.totalResolutions > 0
                        ? Math.round(data.totalDuration / data.totalResolutions)
                        : 0,
                mostEffectiveAction,
            };
        }

        return {
            byActionType,
            byStage: stageEffectiveness,
        };
    }

    async exportReport(
        format: 'CSV' | 'JSON',
        filters: HistoricalFilters,
    ): Promise<Buffer> {
        const report = await this.generateReport(filters);

        if (format === 'JSON') {
            return Buffer.from(JSON.stringify(report, null, 2));
        }

        const csv = this.convertToCSV(report);
        return Buffer.from(csv);
    }

    private groupByStage(bottlenecks: any[]): Record<string, number> {
        const groups: Record<string, number> = {};

        for (const bottleneck of bottlenecks) {
            const stage = bottleneck.stage;
            groups[stage] = (groups[stage] || 0) + 1;
        }

        return groups;
    }

    private groupBySeverity(bottlenecks: any[]): Record<string, number> {
        const groups: Record<string, number> = {};

        for (const bottleneck of bottlenecks) {
            const severity = bottleneck.severity;
            groups[severity] = (groups[severity] || 0) + 1;
        }

        return groups;
    }

    private calculatePeakTimes(bottlenecks: any[]): TimeSlot[] {
        const hourCounts: Record<number, number> = {};

        for (const bottleneck of bottlenecks) {
            const hour = new Date(bottleneck.detectedAt).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }

        return Object.entries(hourCounts)
            .map(([hour, count]) => ({
                hour: parseInt(hour),
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    private calculatePeriodMetrics(bottlenecks: any[]): PeriodMetrics {
        const totalBottlenecks = bottlenecks.length;

        const averageScore =
            totalBottlenecks > 0
                ? bottlenecks.reduce((sum, b) => sum + b.score, 0) /
                  totalBottlenecks
                : 0;

        const resolvedBottlenecks = bottlenecks.filter(
            (b) => b.resolutionDuration !== null,
        );
        const averageDuration =
            resolvedBottlenecks.length > 0
                ? resolvedBottlenecks.reduce(
                      (sum, b) => sum + (b.resolutionDuration || 0),
                      0,
                  ) / resolvedBottlenecks.length
                : 0;

        return {
            totalBottlenecks,
            averageScore: Math.round(averageScore),
            averageDuration: Math.round(averageDuration),
        };
    }

    private convertToCSV(report: HistoricalReport): string {
        const lines: string[] = [];

        lines.push('Bottleneck Historical Report');
        lines.push('');
        lines.push(`Total Bottlenecks,${report.totalBottlenecks}`);
        lines.push(`Average Duration (minutes),${report.averageDuration}`);
        lines.push('');

        lines.push('Most Affected Stages');
        lines.push('Stage,Count,Percentage');
        for (const stage of report.mostAffectedStages) {
            lines.push(
                `${stage.stage},${stage.count},${stage.percentage.toFixed(1)}%`,
            );
        }
        lines.push('');

        lines.push('Peak Occurrence Times');
        lines.push('Hour,Count');
        for (const slot of report.peakOccurrenceTimes) {
            lines.push(`${slot.hour}:00,${slot.count}`);
        }
        lines.push('');

        lines.push('Severity Breakdown');
        lines.push('Severity,Count,Percentage');
        for (const severity of report.severityBreakdown) {
            lines.push(
                `${severity.severity},${severity.count},${severity.percentage.toFixed(1)}%`,
            );
        }

        return lines.join('\n');
    }
}
