import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, Role, SLAStatus } from '@prisma/client';

export interface DashboardMetrics {
    activeApplications: number;
    averageProcessingTimeHours: number;
    overdueCount: number;
    onTimePercentage: number;
    totalProcessedToday: number;
    totalProcessedThisMonth: number;
    byStage: {
        stage: WorkflowStage;
        count: number;
        averageDurationHours: number;
    }[];
    byPermitType: {
        permitType: string;
        count: number;
        averageDurationHours: number;
    }[];
    impactScore: number;
    efficiency: number;
    slaCompliance: number;
}

export interface StaffPerformance {
    staffId: string;
    staffName: string;
    staffEmail: string;
    roles: Role[];
    totalProcessed: number;
    overdueCount: number;
    onTimeCount: number;
    averageDurationHours: number;
    onTimePercentage: number;
}

export interface StageBottleneck {
    stage: WorkflowStage;
    averageDurationHours: number;
    maxDurationHours: number;
    overdueCount: number;
    warningCount: number;
    activeCount: number;
    staffCount: number;
    utilizationPercentage: number;
    recommendedAction: string;
}

@Injectable()
export class AnalyticsService {
    constructor(
        private prisma: PrismaService,
    ) { }

    /**
     * Get comprehensive dashboard metrics
     */
    async getDashboardMetrics(
        startDate?: Date,
        endDate?: Date,
    ): Promise<DashboardMetrics> {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Active applications (not APPROVED or REJECTED)
        const activeApplications = await this.prisma.permitApplication.count({
            where: {
                status: {
                    notIn: [WorkflowStage.APPROVED, WorkflowStage.REJECTED, WorkflowStage.DRAFT],
                },
            },
        });

        // Get completed stage histories for average processing time
        const completedStages = await this.prisma.stageHistory.findMany({
            where: {
                completedAt: { not: null },
                ...(startDate && { transitionedAt: { gte: startDate } }),
                ...(endDate && { transitionedAt: { lte: endDate } }),
            },
            select: {
                durationHours: true,
                slaStatus: true,
                toStage: true,
                application: {
                    select: {
                        permitType: true,
                    },
                },
            },
        });

        // Calculate average processing time
        const totalDuration = completedStages.reduce(
            (sum, stage) => sum + (stage.durationHours || 0),
            0,
        );
        const averageProcessingTimeHours =
            completedStages.length > 0 ? totalDuration / completedStages.length : 0;

        // Count overdue
        const overdueCount = completedStages.filter(
            (s) => s.slaStatus === SLAStatus.OVERDUE,
        ).length;

        // Calculate on-time percentage
        const onTimeCount = completedStages.filter(
            (s) => s.slaStatus === SLAStatus.ON_TIME,
        ).length;
        const onTimePercentage =
            completedStages.length > 0
                ? (onTimeCount / completedStages.length) * 100
                : 0;

        // Total processed today
        const totalProcessedToday = await this.prisma.permitApplication.count({
            where: {
                status: WorkflowStage.APPROVED,
                updatedAt: { gte: todayStart },
            },
        });

        // Total processed this month
        const totalProcessedThisMonth = await this.prisma.permitApplication.count({
            where: {
                status: WorkflowStage.APPROVED,
                updatedAt: { gte: monthStart },
            },
        });

        // Group by stage
        const byStageMap = new Map<WorkflowStage, { count: number; totalDuration: number }>();
        completedStages.forEach((stage) => {
            const existing = byStageMap.get(stage.toStage) || { count: 0, totalDuration: 0 };
            byStageMap.set(stage.toStage, {
                count: existing.count + 1,
                totalDuration: existing.totalDuration + (stage.durationHours || 0),
            });
        });

        const byStage = Array.from(byStageMap.entries()).map(([stage, data]) => ({
            stage,
            count: data.count,
            averageDurationHours: data.count > 0 ? data.totalDuration / data.count : 0,
        }));

        // Group by permit type
        const byPermitTypeMap = new Map<string, { count: number; totalDuration: number }>();
        completedStages.forEach((stage) => {
            const permitType = stage.application.permitType;
            const existing = byPermitTypeMap.get(permitType) || { count: 0, totalDuration: 0 };
            byPermitTypeMap.set(permitType, {
                count: existing.count + 1,
                totalDuration: existing.totalDuration + (stage.durationHours || 0),
            });
        });

        const byPermitType = Array.from(byPermitTypeMap.entries()).map(([permitType, data]) => ({
            permitType,
            count: data.count,
            averageDurationHours: data.count > 0 ? data.totalDuration / data.count : 0,
        }));

        // Calculate Composite Impact Score (I = 0.4E + 0.3S + 0.2B + 0.1(1-Vn))
        // E: Efficiency (Based on target average duration)
        const targetAvgHours = 24; 
        const efficiency = Math.max(0, 1 - (averageProcessingTimeHours / (targetAvgHours * 2)));
        
        // S: SLA Compliance
        const slaCompliance = onTimePercentage / 100;

        // B: Bottleneck Reduction (Calculated separately, but we can estimate)
        const bottlenecks = await this.getStageBottlenecks();
        const bottleneckScore = bottlenecks.length > 0 ? 
            Math.max(0, 1 - (bottlenecks.filter(b => b.overdueCount > 0).length / bottlenecks.length)) : 1;

        // Vn: Variance (normalized)
        const variance = completedStages.length > 1 ? 
            completedStages.reduce((sum, s) => sum + Math.pow((s.durationHours || 0) - averageProcessingTimeHours, 2), 0) / completedStages.length : 0;
        const normalizedVariance = Math.min(1, variance / 100);

        const compositeImpactScore = (0.4 * efficiency) + (0.3 * slaCompliance) + (0.2 * bottleneckScore) + (0.1 * (1 - normalizedVariance));

        return {
            activeApplications,
            averageProcessingTimeHours: Math.round(averageProcessingTimeHours * 10) / 10,
            overdueCount,
            onTimePercentage: Math.round(onTimePercentage * 10) / 10,
            totalProcessedToday,
            totalProcessedThisMonth,
            byStage,
            byPermitType,
            impactScore: Math.round(compositeImpactScore * 100),
            efficiency: Math.round(efficiency * 100),
            slaCompliance: Math.round(slaCompliance * 100),
        };
    }

    /**
     * Get staff performance metrics
     */
    async getStaffPerformance(
        startDate?: Date,
        endDate?: Date,
    ): Promise<StaffPerformance[]> {
        // Get all staff members (users with staff roles)
        const staffMembers = await this.prisma.user.findMany({
            where: {
                roles: {
                    hasSome: [
                        Role.DOCUMENT_VALIDATOR,
                        Role.FIELD_INSPECTOR,
                        Role.LEGALIZER,
                        Role.ADMIN,
                    ],
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                roles: true,
            },
        });

        const performanceData: StaffPerformance[] = [];

        for (const staff of staffMembers) {
            // Get validation actions by this staff member
            const actions = await this.prisma.validationAction.findMany({
                where: {
                    performedById: staff.id,
                    actionType: { in: ['APPROVE', 'REJECT'] },
                    ...(startDate && { performedAt: { gte: startDate } }),
                    ...(endDate && { performedAt: { lte: endDate } }),
                },
                include: {
                    application: {
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
                    },
                },
            });

            const totalProcessed = actions.length;

            // Calculate metrics from stage histories
            const allStageHistories = actions.flatMap(
                (action) => action.application.stageHistory,
            );

            const overdueCount = allStageHistories.filter(
                (s) => s.slaStatus === SLAStatus.OVERDUE,
            ).length;

            const onTimeCount = allStageHistories.filter(
                (s) => s.slaStatus === SLAStatus.ON_TIME,
            ).length;

            const totalDuration = allStageHistories.reduce(
                (sum, s) => sum + (s.durationHours || 0),
                0,
            );

            const averageDurationHours =
                allStageHistories.length > 0
                    ? totalDuration / allStageHistories.length
                    : 0;

            const onTimePercentage =
                totalProcessed > 0 ? (onTimeCount / totalProcessed) * 100 : 0;

            performanceData.push({
                staffId: staff.id,
                staffName: staff.name || 'Unknown',
                staffEmail: staff.email,
                roles: staff.roles,
                totalProcessed,
                overdueCount,
                onTimeCount,
                averageDurationHours: Math.round(averageDurationHours * 10) / 10,
                onTimePercentage: Math.round(onTimePercentage * 10) / 10,
            });
        }

        // Sort by total processed (descending)
        return performanceData.sort((a, b) => b.totalProcessed - a.totalProcessed);
    }

    /**
     * Identify stage bottlenecks
     */
    async getStageBottlenecks(): Promise<StageBottleneck[]> {
        const stages = [
            WorkflowStage.DOCUMENT_CHECK,
            WorkflowStage.FIELD_INSPECTION,
            WorkflowStage.LEGALIZATION,
        ];

        const bottlenecks: StageBottleneck[] = [];

        for (const stage of stages) {
            // Get SLA rule for this stage
            const slaRule = await this.prisma.sLARule.findUnique({
                where: { stage },
            });

            if (!slaRule) continue;

            // Get active applications at this stage
            const activeCount = await this.prisma.permitApplication.count({
                where: { currentStage: stage },
            });

            // Get completed stage histories
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

            const totalDuration = completedStages.reduce(
                (sum, s) => sum + (s.durationHours || 0),
                0,
            );
            const averageDurationHours =
                completedStages.length > 0 ? totalDuration / completedStages.length : 0;

            const overdueCount = completedStages.filter(
                (s) => s.slaStatus === SLAStatus.OVERDUE,
            ).length;

            const warningCount = completedStages.filter(
                (s) => s.slaStatus === SLAStatus.WARNING,
            ).length;

            // Count staff members who can handle this stage
            const roleMap = {
                [WorkflowStage.DOCUMENT_CHECK]: Role.DOCUMENT_VALIDATOR,
                [WorkflowStage.FIELD_INSPECTION]: Role.FIELD_INSPECTOR,
                [WorkflowStage.LEGALIZATION]: Role.LEGALIZER,
            };

            const staffCount = await this.prisma.user.count({
                where: {
                    roles: { has: roleMap[stage] },
                },
            });

            // Calculate utilization (active apps per staff member)
            const utilizationPercentage =
                staffCount > 0 ? (activeCount / staffCount) * 100 : 0;

            // Determine recommended action
            let recommendedAction = 'No action needed';
            if (overdueCount > 5 && staffCount < 3) {
                recommendedAction = 'Increase staff allocation - high overdue rate';
            } else if (averageDurationHours > slaRule.maxDurationHours * 0.9) {
                recommendedAction = 'Review process efficiency - approaching SLA limit';
            } else if (utilizationPercentage > 150) {
                recommendedAction = 'High workload - consider adding staff';
            } else if (warningCount > overdueCount && warningCount > 3) {
                recommendedAction = 'Monitor closely - many applications at warning threshold';
            }

            bottlenecks.push({
                stage,
                averageDurationHours: Math.round(averageDurationHours * 10) / 10,
                maxDurationHours: slaRule.maxDurationHours,
                overdueCount,
                warningCount,
                activeCount,
                staffCount,
                utilizationPercentage: Math.round(utilizationPercentage * 10) / 10,
                recommendedAction,
            });
        }

        // Sort by overdue count (descending) - most critical first
        return bottlenecks.sort((a, b) => b.overdueCount - a.overdueCount);
    }

    /**
     * Get monthly report data
     */
    async getMonthlyReport(year: number, month: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

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

        // Calculate average duration from stage histories
        const allStageHistories = applications.flatMap((app) => app.stageHistory);
        const totalDuration = allStageHistories.reduce(
            (sum, s) => sum + (s.durationHours || 0),
            0,
        );
        const averageDuration =
            allStageHistories.length > 0 ? totalDuration / allStageHistories.length : 0;

        const overdueCount = allStageHistories.filter(
            (s) => s.slaStatus === SLAStatus.OVERDUE,
        ).length;
        const overduePercentage =
            allStageHistories.length > 0
                ? (overdueCount / allStageHistories.length) * 100
                : 0;

        // Group by permit type
        const byPermitType = applications.reduce((acc, app) => {
            const type = app.permitType;
            if (!acc[type]) {
                acc[type] = { count: 0, totalDuration: 0 };
            }
            acc[type].count++;
            const appDuration = app.stageHistory.reduce(
                (sum, s) => sum + (s.durationHours || 0),
                0,
            );
            acc[type].totalDuration += appDuration;
            return acc;
        }, {} as Record<string, { count: number; totalDuration: number }>);

        const byPermitTypeArray = Object.entries(byPermitType).map(([permitType, data]) => ({
            permitType,
            count: data.count,
            averageDuration: data.count > 0 ? data.totalDuration / data.count : 0,
        }));

        return {
            month: `${year}-${String(month).padStart(2, '0')}`,
            totalApplications,
            approvedCount,
            rejectedCount,
            averageDuration: Math.round(averageDuration * 10) / 10,
            overduePercentage: Math.round(overduePercentage * 10) / 10,
            byPermitType: byPermitTypeArray,
        };
    }
    /**
     * Get dashboard metrics for a specific user
     */
    async getUserDashboardMetrics(userId: string) {
        const applications = await this.prisma.permitApplication.findMany({
            where: { applicantId: userId },
            select: {
                status: true,
                totalCost: true,
                referenceNumber: true,
            },
        });

        const activeCount = applications.filter(a => 
            !([WorkflowStage.APPROVED, WorkflowStage.REJECTED, WorkflowStage.DRAFT] as WorkflowStage[]).includes(a.status)
        ).length;

        const approvedCount = applications.filter(a => a.status === WorkflowStage.APPROVED).length;
        
        const waitingCount = applications.filter(a => 
            ([WorkflowStage.DOCUMENT_CHECK, WorkflowStage.FIELD_INSPECTION, WorkflowStage.LEGALIZATION] as WorkflowStage[]).includes(a.status)
        ).length;

        const draftCount = applications.filter(a => a.status === WorkflowStage.DRAFT).length;

        const totalCost = applications.reduce((acc, app) => acc + (app.totalCost || 0), 0);

        return {
            activeCount,
            approvedCount,
            waitingCount,
            draftCount,
            totalCost,
        };
    }

    /**
     * Get recent audit logs
     */
    async getRecentAuditLogs(limit: number = 10) {
        return this.prisma.auditLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get time-series metrics bucketed by hour or day
     * Groups by day when periodDays > 7, by hour when periodDays <= 7
     */
    async getTimeSeriesMetrics(
        intervalHours: number,
        periodDays: number,
    ): Promise<
        {
            timestamp: Date;
            submitted: number;
            approved: number;
            rejected: number;
            avgProcessingHours: number;
        }[]
    > {
        const now = new Date();
        const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

        // Determine bucket size: day if periodDays > 7, hour otherwise
        const bucketMs = periodDays > 7
            ? 24 * 60 * 60 * 1000
            : intervalHours * 60 * 60 * 1000;

        // Fetch all applications submitted within the period
        const applications = await this.prisma.permitApplication.findMany({
            where: {
                submittedAt: { gte: periodStart, lte: now },
            },
            select: {
                submittedAt: true,
                status: true,
                updatedAt: true,
                stageHistory: {
                    where: { completedAt: { not: null } },
                    select: { durationHours: true },
                },
            },
        });

        // Build bucket map
        const buckets = new Map<
            number,
            { submitted: number; approved: number; rejected: number; totalHours: number; stageCount: number }
        >();

        // Pre-populate all buckets in the range
        let cursor = new Date(periodStart);
        while (cursor <= now) {
            const key = Math.floor(cursor.getTime() / bucketMs) * bucketMs;
            if (!buckets.has(key)) {
                buckets.set(key, { submitted: 0, approved: 0, rejected: 0, totalHours: 0, stageCount: 0 });
            }
            cursor = new Date(cursor.getTime() + bucketMs);
        }

        // Distribute applications into buckets
        for (const app of applications) {
            if (!app.submittedAt) continue;
            const key = Math.floor(app.submittedAt.getTime() / bucketMs) * bucketMs;
            const bucket = buckets.get(key) ?? { submitted: 0, approved: 0, rejected: 0, totalHours: 0, stageCount: 0 };

            bucket.submitted++;

            if (app.status === WorkflowStage.APPROVED) {
                bucket.approved++;
            } else if (app.status === WorkflowStage.REJECTED) {
                bucket.rejected++;
            }

            for (const sh of app.stageHistory) {
                bucket.totalHours += sh.durationHours ?? 0;
                bucket.stageCount++;
            }

            buckets.set(key, bucket);
        }

        // Convert to sorted array
        return Array.from(buckets.entries())
            .sort(([a], [b]) => a - b)
            .map(([ts, data]) => ({
                timestamp: new Date(ts),
                submitted: data.submitted,
                approved: data.approved,
                rejected: data.rejected,
                avgProcessingHours:
                    data.stageCount > 0
                        ? Math.round((data.totalHours / data.stageCount) * 10) / 10
                        : 0,
            }));
    }

    /**
     * Get system health metrics including DB latency, queue counts, throughput, and uptime
     */
    async getSystemHealthMetrics(): Promise<{
        database: { status: string; queryTimeMs: number };
        queues: {
            pendingApplications: number;
            overdueApplications: number;
            warningApplications: number;
        };
        throughput: { last1h: number; last24h: number; last7d: number };
        uptime: number;
    }> {
        const now = new Date();

        // Measure DB query time with a simple count query
        const dbStart = Date.now();
        let dbStatus = 'healthy';
        let queryTimeMs = 0;
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            queryTimeMs = Date.now() - dbStart;
        } catch {
            dbStatus = 'unhealthy';
            queryTimeMs = -1;
        }

        // Queue counts
        const pendingApplications = await this.prisma.permitApplication.count({
            where: {
                status: {
                    notIn: [WorkflowStage.APPROVED, WorkflowStage.REJECTED, WorkflowStage.DRAFT],
                },
            },
        });

        const overdueApplications = await this.prisma.stageHistory.count({
            where: {
                completedAt: null,
                slaStatus: SLAStatus.OVERDUE,
            },
        });

        const warningApplications = await this.prisma.stageHistory.count({
            where: {
                completedAt: null,
                slaStatus: SLAStatus.WARNING,
            },
        });

        // Throughput: approved applications in each window
        const last1hStart = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        const last24hStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7dStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [last1h, last24h, last7d] = await Promise.all([
            this.prisma.permitApplication.count({
                where: { status: WorkflowStage.APPROVED, updatedAt: { gte: last1hStart } },
            }),
            this.prisma.permitApplication.count({
                where: { status: WorkflowStage.APPROVED, updatedAt: { gte: last24hStart } },
            }),
            this.prisma.permitApplication.count({
                where: { status: WorkflowStage.APPROVED, updatedAt: { gte: last7dStart } },
            }),
        ]);

        return {
            database: { status: dbStatus, queryTimeMs },
            queues: { pendingApplications, overdueApplications, warningApplications },
            throughput: { last1h, last24h, last7d },
            uptime: Math.floor(process.uptime()),
        };
    }

    /**
     * Get a live metrics snapshot suitable for real-time push
     */
    async getLiveMetrics(): Promise<{
        timestamp: Date;
        activeApplications: number;
        overdueCount: number;
        warningCount: number;
        processingRate: number;
        stageLoad: { stage: WorkflowStage; count: number; slaStatus: SLAStatus | null }[];
    }> {
        const now = new Date();
        const last1hStart = new Date(now.getTime() - 60 * 60 * 1000);

        const activeApplications = await this.prisma.permitApplication.count({
            where: {
                status: {
                    notIn: [WorkflowStage.APPROVED, WorkflowStage.REJECTED, WorkflowStage.DRAFT],
                },
            },
        });

        const overdueCount = await this.prisma.stageHistory.count({
            where: { completedAt: null, slaStatus: SLAStatus.OVERDUE },
        });

        const warningCount = await this.prisma.stageHistory.count({
            where: { completedAt: null, slaStatus: SLAStatus.WARNING },
        });

        // Processing rate: approved in the last hour
        const processingRate = await this.prisma.permitApplication.count({
            where: { status: WorkflowStage.APPROVED, updatedAt: { gte: last1hStart } },
        });

        // Stage load: count per active stage with dominant SLA status
        const activeStages = [
            WorkflowStage.DOCUMENT_CHECK,
            WorkflowStage.FIELD_INSPECTION,
            WorkflowStage.LEGALIZATION,
        ];

        const stageLoad = await Promise.all(
            activeStages.map(async (stage) => {
                const count = await this.prisma.permitApplication.count({
                    where: { currentStage: stage },
                });

                // Find dominant SLA status among open stage histories for this stage
                const slaGroups = await this.prisma.stageHistory.groupBy({
                    by: ['slaStatus'],
                    where: {
                        toStage: stage,
                        completedAt: null,
                        slaStatus: { not: null },
                    },
                    _count: { slaStatus: true },
                    orderBy: { _count: { slaStatus: 'desc' } },
                    take: 1,
                });

                const dominantSla =
                    slaGroups.length > 0 ? slaGroups[0].slaStatus : null;

                return { stage, count, slaStatus: dominantSla };
            }),
        );

        return {
            timestamp: now,
            activeApplications,
            overdueCount,
            warningCount,
            processingRate,
            stageLoad,
        };
    }
}
