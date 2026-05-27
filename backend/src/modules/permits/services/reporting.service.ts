import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, SLAStatus, PermitType } from '@prisma/client';

export interface TrendAnalysis {
    period: string; // YYYY-MM format
    totalApplications: number;
    approvedCount: number;
    rejectedCount: number;
    averageProcessingDays: number;
    onTimePercentage: number;
}

export interface BottleneckReport {
    stage: WorkflowStage;
    totalProcessed: number;
    averageDurationHours: number;
    overdueCount: number;
    overduePercentage: number;
    bottleneckSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendations: string[];
}

export interface PerformanceComparison {
    currentMonth: {
        totalApplications: number;
        averageProcessingDays: number;
        onTimePercentage: number;
        approvalRate: number;
    };
    previousMonth: {
        totalApplications: number;
        averageProcessingDays: number;
        onTimePercentage: number;
        approvalRate: number;
    };
    changes: {
        applicationsChange: number; // percentage
        processingTimeChange: number; // percentage
        onTimeChange: number; // percentage points
        approvalRateChange: number; // percentage points
    };
}

@Injectable()
export class ReportingService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get trend analysis over time
     * Shows monthly trends for the past N months
     */
    async getTrendAnalysis(months: number = 6): Promise<TrendAnalysis[]> {
        const trends: TrendAnalysis[] = [];
        const now = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const periodDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startDate = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
            const endDate = new Date(
                periodDate.getFullYear(),
                periodDate.getMonth() + 1,
                0,
                23,
                59,
                59,
            );

            const applications = await this.prisma.permitApplication.findMany({
                where: {
                    submittedAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    stageHistory: {
                        where: {
                            completedAt: { not: null },
                        },
                        select: {
                            durationHours: true,
                            slaStatus: true,
                        },
                    },
                },
            });

            const totalApplications = applications.length;
            const approvedCount = applications.filter(
                (app) => app.status === WorkflowStage.APPROVED,
            ).length;
            const rejectedCount = applications.filter(
                (app) => app.status === WorkflowStage.REJECTED,
            ).length;

            const allStageHistories = applications.flatMap((app) => app.stageHistory);
            const totalHours = allStageHistories.reduce(
                (sum, s) => sum + (s.durationHours || 0),
                0,
            );
            const averageProcessingDays =
                allStageHistories.length > 0
                    ? Math.round((totalHours / allStageHistories.length / 24) * 10) / 10
                    : 0;

            const onTimeCount = allStageHistories.filter(
                (s) => s.slaStatus === SLAStatus.ON_TIME,
            ).length;
            const onTimePercentage =
                allStageHistories.length > 0
                    ? Math.round((onTimeCount / allStageHistories.length) * 100 * 10) / 10
                    : 0;

            trends.push({
                period: `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`,
                totalApplications,
                approvedCount,
                rejectedCount,
                averageProcessingDays,
                onTimePercentage,
            });
        }

        return trends;
    }

    /**
     * Get detailed bottleneck report
     * Identifies stages causing delays with severity and recommendations
     */
    async getBottleneckReport(): Promise<BottleneckReport[]> {
        const stages = [
            WorkflowStage.DOCUMENT_CHECK,
            WorkflowStage.FIELD_INSPECTION,
            WorkflowStage.LEGALIZATION,
        ];

        const reports: BottleneckReport[] = [];

        for (const stage of stages) {
            const completedStages = await this.prisma.stageHistory.findMany({
                where: {
                    toStage: stage,
                    completedAt: { not: null },
                },
                select: {
                    durationHours: true,
                    slaStatus: true,
                },
            });

            const totalProcessed = completedStages.length;
            const totalDuration = completedStages.reduce(
                (sum, s) => sum + (s.durationHours || 0),
                0,
            );
            const averageDurationHours =
                totalProcessed > 0 ? totalDuration / totalProcessed : 0;

            const overdueCount = completedStages.filter(
                (s) => s.slaStatus === SLAStatus.OVERDUE,
            ).length;
            const overduePercentage =
                totalProcessed > 0
                    ? Math.round((overdueCount / totalProcessed) * 100 * 10) / 10
                    : 0;

            // Determine severity
            let bottleneckSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
            if (overduePercentage >= 50) {
                bottleneckSeverity = 'CRITICAL';
            } else if (overduePercentage >= 30) {
                bottleneckSeverity = 'HIGH';
            } else if (overduePercentage >= 15) {
                bottleneckSeverity = 'MEDIUM';
            } else {
                bottleneckSeverity = 'LOW';
            }

            // Generate recommendations
            const recommendations: string[] = [];
            if (overduePercentage > 30) {
                recommendations.push('Increase staff allocation for this stage');
                recommendations.push('Review and optimize process workflow');
            }
            if (overduePercentage > 20) {
                recommendations.push('Implement priority queue for urgent applications');
            }
            if (averageDurationHours > 48) {
                recommendations.push('Consider automation opportunities');
            }
            if (recommendations.length === 0) {
                recommendations.push('Performance is within acceptable range');
            }

            reports.push({
                stage,
                totalProcessed,
                averageDurationHours: Math.round(averageDurationHours * 10) / 10,
                overdueCount,
                overduePercentage,
                bottleneckSeverity,
                recommendations,
            });
        }

        // Sort by severity (CRITICAL first)
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return reports.sort(
            (a, b) => severityOrder[a.bottleneckSeverity] - severityOrder[b.bottleneckSeverity],
        );
    }

    /**
     * Get performance comparison between current and previous month
     */
    async getPerformanceComparison(): Promise<PerformanceComparison> {
        const now = new Date();

        // Current month
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
        );

        // Previous month
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const currentMonthData = await this.getMonthData(
            currentMonthStart,
            currentMonthEnd,
        );
        const previousMonthData = await this.getMonthData(
            previousMonthStart,
            previousMonthEnd,
        );

        // Calculate changes
        const applicationsChange =
            previousMonthData.totalApplications > 0
                ? Math.round(
                    ((currentMonthData.totalApplications -
                        previousMonthData.totalApplications) /
                        previousMonthData.totalApplications) *
                    100 *
                    10,
                ) / 10
                : 0;

        const processingTimeChange =
            previousMonthData.averageProcessingDays > 0
                ? Math.round(
                    ((currentMonthData.averageProcessingDays -
                        previousMonthData.averageProcessingDays) /
                        previousMonthData.averageProcessingDays) *
                    100 *
                    10,
                ) / 10
                : 0;

        const onTimeChange =
            Math.round(
                (currentMonthData.onTimePercentage - previousMonthData.onTimePercentage) *
                10,
            ) / 10;

        const approvalRateChange =
            Math.round(
                (currentMonthData.approvalRate - previousMonthData.approvalRate) * 10,
            ) / 10;

        return {
            currentMonth: currentMonthData,
            previousMonth: previousMonthData,
            changes: {
                applicationsChange,
                processingTimeChange,
                onTimeChange,
                approvalRateChange,
            },
        };
    }

    /**
     * Helper method to get month data
     */
    private async getMonthData(startDate: Date, endDate: Date) {
        const applications = await this.prisma.permitApplication.findMany({
            where: {
                submittedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                stageHistory: {
                    where: {
                        completedAt: { not: null },
                    },
                    select: {
                        durationHours: true,
                        slaStatus: true,
                    },
                },
            },
        });

        const totalApplications = applications.length;
        const approvedCount = applications.filter(
            (app) => app.status === WorkflowStage.APPROVED,
        ).length;

        const allStageHistories = applications.flatMap((app) => app.stageHistory);
        const totalHours = allStageHistories.reduce(
            (sum, s) => sum + (s.durationHours || 0),
            0,
        );
        const averageProcessingDays =
            allStageHistories.length > 0
                ? Math.round((totalHours / allStageHistories.length / 24) * 10) / 10
                : 0;

        const onTimeCount = allStageHistories.filter(
            (s) => s.slaStatus === SLAStatus.ON_TIME,
        ).length;
        const onTimePercentage =
            allStageHistories.length > 0
                ? Math.round((onTimeCount / allStageHistories.length) * 100 * 10) / 10
                : 0;

        const approvalRate =
            totalApplications > 0
                ? Math.round((approvedCount / totalApplications) * 100 * 10) / 10
                : 0;

        return {
            totalApplications,
            averageProcessingDays,
            onTimePercentage,
            approvalRate,
        };
    }

    /**
     * Generate executive summary report
     */
    async getExecutiveSummary() {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get current month metrics
        const currentMetrics = await this.getMonthData(monthStart, now);

        // Get bottleneck summary
        const bottlenecks = await this.getBottleneckReport();
        const criticalBottlenecks = bottlenecks.filter(
            (b) => b.bottleneckSeverity === 'CRITICAL' || b.bottleneckSeverity === 'HIGH',
        );

        // Get staff workload
        const activeApplications = await this.prisma.permitApplication.count({
            where: {
                status: {
                    notIn: [WorkflowStage.APPROVED, WorkflowStage.REJECTED],
                },
            },
        });

        const staffCount = await this.prisma.user.count({
            where: {
                roles: {
                    hasSome: ['DOCUMENT_VALIDATOR', 'FIELD_INSPECTOR', 'LEGALIZER'],
                },
            },
        });

        const averageWorkload =
            staffCount > 0 ? Math.round((activeApplications / staffCount) * 10) / 10 : 0;

        return {
            period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            summary: {
                totalApplications: currentMetrics.totalApplications,
                averageProcessingDays: currentMetrics.averageProcessingDays,
                onTimePercentage: currentMetrics.onTimePercentage,
                approvalRate: currentMetrics.approvalRate,
            },
            alerts: {
                criticalBottlenecks: criticalBottlenecks.length,
                activeApplications,
                averageStaffWorkload: averageWorkload,
            },
            topRecommendations: criticalBottlenecks.flatMap((b) => b.recommendations).slice(0, 5),
        };
    }
}
