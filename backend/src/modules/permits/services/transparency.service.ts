import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, SLAStatus, PermitType } from '@prisma/client';

export interface PublicDashboardMetrics {
    totalApplicationsProcessed: number;
    averageProcessingDays: number;
    onTimePercentage: number;
    currentlyInProcess: number;
    approvalRate: number;
    byPermitType: {
        permitType: PermitType;
        totalProcessed: number;
        averageProcessingDays: number;
        approvalRate: number;
    }[];
}

export interface ApplicationStatusPublic {
    referenceNumber: string;
    permitType: PermitType;
    currentStage: WorkflowStage;
    submittedAt: Date;
    estimatedCompletionDate: Date;
    daysInProcess: number;
    status: 'ON_TRACK' | 'DELAYED' | 'COMPLETED';
}

export interface ProcessTransparency {
    stage: WorkflowStage;
    averageProcessingDays: number;
    slaLimitDays: number;
    onTimePercentage: number;
    currentBacklog: number;
}

@Injectable()
export class TransparencyService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get public dashboard metrics (no authentication required)
     * Shows aggregate statistics for transparency
     */
    async getPublicDashboardMetrics(
        startDate?: Date,
        endDate?: Date,
    ): Promise<PublicDashboardMetrics> {
        const now = new Date();
        const defaultStartDate = startDate || new Date(now.getFullYear(), 0, 1); // Start of year
        const defaultEndDate = endDate || now;

        // Get all applications in date range
        const applications = await this.prisma.permitApplication.findMany({
            where: {
                submittedAt: {
                    gte: defaultStartDate,
                    lte: defaultEndDate,
                },
                status: {
                    in: [WorkflowStage.APPROVED, WorkflowStage.REJECTED],
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

        const totalApplicationsProcessed = applications.length;

        // Calculate average processing time in days
        const totalHours = applications.reduce((sum, app) => {
            const appHours = app.stageHistory.reduce(
                (s, stage) => s + (stage.durationHours || 0),
                0,
            );
            return sum + appHours;
        }, 0);
        const averageProcessingDays =
            totalApplicationsProcessed > 0
                ? Math.round((totalHours / totalApplicationsProcessed / 24) * 10) / 10
                : 0;

        // Calculate on-time percentage
        const allStageHistories = applications.flatMap((app) => app.stageHistory);
        const onTimeCount = allStageHistories.filter(
            (s) => s.slaStatus === SLAStatus.ON_TIME,
        ).length;
        const onTimePercentage =
            allStageHistories.length > 0
                ? Math.round((onTimeCount / allStageHistories.length) * 100 * 10) / 10
                : 0;

        // Currently in process
        const currentlyInProcess = await this.prisma.permitApplication.count({
            where: {
                status: {
                    notIn: [WorkflowStage.APPROVED, WorkflowStage.REJECTED, WorkflowStage.DRAFT],
                },
            },
        });

        // Approval rate
        const approvedCount = applications.filter(
            (app) => app.status === WorkflowStage.APPROVED,
        ).length;
        const approvalRate =
            totalApplicationsProcessed > 0
                ? Math.round((approvedCount / totalApplicationsProcessed) * 100 * 10) / 10
                : 0;

        // Group by permit type
        const permitTypeStats = new Map<
            PermitType,
            { total: number; approved: number; totalHours: number }
        >();

        applications.forEach((app) => {
            const existing = permitTypeStats.get(app.permitType) || {
                total: 0,
                approved: 0,
                totalHours: 0,
            };
            const appHours = app.stageHistory.reduce(
                (sum, s) => sum + (s.durationHours || 0),
                0,
            );
            permitTypeStats.set(app.permitType, {
                total: existing.total + 1,
                approved: existing.approved + (app.status === WorkflowStage.APPROVED ? 1 : 0),
                totalHours: existing.totalHours + appHours,
            });
        });

        const byPermitType = Array.from(permitTypeStats.entries()).map(
            ([permitType, stats]) => ({
                permitType,
                totalProcessed: stats.total,
                averageProcessingDays:
                    stats.total > 0
                        ? Math.round((stats.totalHours / stats.total / 24) * 10) / 10
                        : 0,
                approvalRate:
                    stats.total > 0
                        ? Math.round((stats.approved / stats.total) * 100 * 10) / 10
                        : 0,
            }),
        );

        return {
            totalApplicationsProcessed,
            averageProcessingDays,
            onTimePercentage,
            currentlyInProcess,
            approvalRate,
            byPermitType,
        };
    }

    /**
     * Get public application status by reference number
     * No authentication required - public transparency
     */
    async getApplicationStatusPublic(
        referenceNumber: string,
    ): Promise<ApplicationStatusPublic | null> {
        const application = await this.prisma.permitApplication.findUnique({
            where: { referenceNumber },
            select: {
                referenceNumber: true,
                permitType: true,
                currentStage: true,
                submittedAt: true,
                status: true,
                stageHistory: {
                    where: {
                        completedAt: null, // Current active stage
                    },
                    select: {
                        transitionedAt: true,
                        toStage: true,
                    },
                    orderBy: {
                        transitionedAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        if (!application || !application.submittedAt) {
            return null;
        }

        // Calculate days in process
        const now = new Date();
        const submittedAt = new Date(application.submittedAt);
        const daysInProcess = Math.floor(
            (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Get SLA rules to estimate completion
        const slaRules = await this.prisma.sLARule.findMany();
        const totalSLADays = slaRules.reduce(
            (sum, rule) => sum + rule.maxDurationHours / 24,
            0,
        );

        // Estimate completion date
        const estimatedCompletionDate = new Date(submittedAt);
        estimatedCompletionDate.setDate(
            estimatedCompletionDate.getDate() + Math.ceil(totalSLADays),
        );

        // Determine status
        let status: 'ON_TRACK' | 'DELAYED' | 'COMPLETED';
        if (
            application.status === WorkflowStage.APPROVED ||
            application.status === WorkflowStage.REJECTED
        ) {
            status = 'COMPLETED';
        } else if (daysInProcess > totalSLADays) {
            status = 'DELAYED';
        } else {
            status = 'ON_TRACK';
        }

        return {
            referenceNumber: application.referenceNumber,
            permitType: application.permitType,
            currentStage: application.currentStage,
            submittedAt: application.submittedAt,
            estimatedCompletionDate,
            daysInProcess,
            status,
        };
    }

    /**
     * Get process transparency metrics
     * Shows how each stage performs
     */
    async getProcessTransparency(): Promise<ProcessTransparency[]> {
        const stages = [
            WorkflowStage.DOCUMENT_CHECK,
            WorkflowStage.FIELD_INSPECTION,
            WorkflowStage.LEGALIZATION,
        ];

        const transparencyData: ProcessTransparency[] = [];

        for (const stage of stages) {
            // Get SLA rule
            const slaRule = await this.prisma.sLARule.findUnique({
                where: { stage },
            });

            if (!slaRule) continue;

            // Get completed stages
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
            const averageProcessingDays =
                completedStages.length > 0
                    ? Math.round((totalDuration / completedStages.length / 24) * 10) / 10
                    : 0;

            const onTimeCount = completedStages.filter(
                (s) => s.slaStatus === SLAStatus.ON_TIME,
            ).length;
            const onTimePercentage =
                completedStages.length > 0
                    ? Math.round((onTimeCount / completedStages.length) * 100 * 10) / 10
                    : 0;

            // Current backlog
            const currentBacklog = await this.prisma.permitApplication.count({
                where: { currentStage: stage },
            });

            transparencyData.push({
                stage,
                averageProcessingDays,
                slaLimitDays: Math.round((slaRule.maxDurationHours / 24) * 10) / 10,
                onTimePercentage,
                currentBacklog,
            });
        }

        return transparencyData;
    }
}
