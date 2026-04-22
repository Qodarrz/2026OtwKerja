import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, SLAStatus } from '@prisma/client';

export interface SLACheckResult {
    status: SLAStatus;
    durationHours: number;
    maxDurationHours: number;
    remainingHours: number;
    percentageUsed: number;
}

export interface SLAStatistics {
    totalApplications: number;
    onTimeCount: number;
    warningCount: number;
    overdueCount: number;
    onTimePercentage: number;
    overduePercentage: number;
    averageDurationHours: number;
}

@Injectable()
export class SLAService {
    constructor(private prisma: PrismaService) { }

    /**
     * Check SLA compliance for a specific stage
     */
    async checkSLACompliance(
        startTime: Date,
        stage: WorkflowStage,
    ): Promise<SLACheckResult> {
        // Get SLA rule for this stage
        const slaRule = await this.prisma.sLARule.findUnique({
            where: { stage },
        });

        if (!slaRule) {
            throw new Error(`No SLA rule found for stage: ${stage}`);
        }

        // Calculate duration in hours
        const now = new Date();
        const durationMs = now.getTime() - startTime.getTime();
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));

        // Calculate remaining hours
        const remainingHours = Math.max(
            0,
            slaRule.maxDurationHours - durationHours,
        );

        // Calculate percentage used
        const percentageUsed = (durationHours / slaRule.maxDurationHours) * 100;

        // Determine SLA status
        let status: SLAStatus;
        if (durationHours >= slaRule.maxDurationHours) {
            status = SLAStatus.OVERDUE;
        } else if (
            durationHours >=
            slaRule.maxDurationHours * slaRule.warningThreshold
        ) {
            status = SLAStatus.WARNING;
        } else {
            status = SLAStatus.ON_TIME;
        }

        return {
            status,
            durationHours,
            maxDurationHours: slaRule.maxDurationHours,
            remainingHours,
            percentageUsed: Math.round(percentageUsed * 10) / 10, // Round to 1 decimal
        };
    }

    /**
     * Calculate duration between two timestamps
     */
    calculateDuration(startTime: Date, endTime: Date): number {
        const durationMs = endTime.getTime() - startTime.getTime();
        return Math.floor(durationMs / (1000 * 60 * 60)); // Convert to hours
    }

    /**
     * Get all overdue applications
     */
    async getOverdueApplications(stage?: WorkflowStage) {
        const where: any = {
            slaStatus: SLAStatus.OVERDUE,
            completedAt: null, // Still in progress
        };

        if (stage) {
            where.toStage = stage;
        }

        const overdueStages = await this.prisma.stageHistory.findMany({
            where,
            include: {
                application: {
                    include: {
                        applicant: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                transitionedAt: 'asc', // Oldest first
            },
        });

        return overdueStages.map((stage) => stage.application);
    }

    /**
     * Get applications with SLA warnings
     */
    async getWarningApplications(stage?: WorkflowStage) {
        const where: any = {
            slaStatus: SLAStatus.WARNING,
            completedAt: null, // Still in progress
        };

        if (stage) {
            where.toStage = stage;
        }

        const warningStages = await this.prisma.stageHistory.findMany({
            where,
            include: {
                application: {
                    include: {
                        applicant: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                transitionedAt: 'asc',
            },
        });

        return warningStages.map((stage) => stage.application);
    }

    /**
     * Get SLA statistics for a specific stage or all stages
     */
    async getSLAStatistics(
        stage?: WorkflowStage,
        startDate?: Date,
        endDate?: Date,
    ): Promise<SLAStatistics> {
        const where: any = {
            completedAt: { not: null }, // Only completed stages
        };

        if (stage) {
            where.toStage = stage;
        }

        if (startDate || endDate) {
            where.transitionedAt = {};
            if (startDate) where.transitionedAt.gte = startDate;
            if (endDate) where.transitionedAt.lte = endDate;
        }

        const stages = await this.prisma.stageHistory.findMany({
            where,
            select: {
                slaStatus: true,
                durationHours: true,
            },
        });

        const totalApplications = stages.length;
        const onTimeCount = stages.filter(
            (s) => s.slaStatus === SLAStatus.ON_TIME,
        ).length;
        const warningCount = stages.filter(
            (s) => s.slaStatus === SLAStatus.WARNING,
        ).length;
        const overdueCount = stages.filter(
            (s) => s.slaStatus === SLAStatus.OVERDUE,
        ).length;

        const totalDuration = stages.reduce(
            (sum, s) => sum + (s.durationHours || 0),
            0,
        );
        const averageDurationHours =
            totalApplications > 0 ? totalDuration / totalApplications : 0;

        return {
            totalApplications,
            onTimeCount,
            warningCount,
            overdueCount,
            onTimePercentage:
                totalApplications > 0
                    ? Math.round((onTimeCount / totalApplications) * 100 * 10) / 10
                    : 0,
            overduePercentage:
                totalApplications > 0
                    ? Math.round((overdueCount / totalApplications) * 100 * 10) / 10
                    : 0,
            averageDurationHours: Math.round(averageDurationHours * 10) / 10,
        };
    }

    /**
     * Get SLA rules for all stages
     */
    async getAllSLARules() {
        return this.prisma.sLARule.findMany({
            orderBy: {
                stage: 'asc',
            },
        });
    }

    /**
     * Update SLA rule for a stage
     */
    async updateSLARule(
        stage: WorkflowStage,
        maxDurationHours: number,
        warningThreshold?: number,
    ) {
        return this.prisma.sLARule.update({
            where: { stage },
            data: {
                maxDurationHours,
                ...(warningThreshold !== undefined && { warningThreshold }),
            },
        });
    }

    /**
     * Check and update SLA status for all active stages
     * This should be run periodically (e.g., every hour via cron job)
     */
    async updateActiveSLAStatuses() {
        // Get all active stage histories (not completed)
        const activeStages = await this.prisma.stageHistory.findMany({
            where: {
                completedAt: null,
                toStage: {
                    in: [
                        WorkflowStage.DOCUMENT_CHECK,
                        WorkflowStage.FIELD_INSPECTION,
                        WorkflowStage.LEGALIZATION,
                    ],
                },
            },
        });

        let updatedCount = 0;

        for (const stageHistory of activeStages) {
            try {
                const slaCheck = await this.checkSLACompliance(
                    stageHistory.transitionedAt,
                    stageHistory.toStage,
                );

                // Update if status changed
                if (stageHistory.slaStatus !== slaCheck.status) {
                    await this.prisma.stageHistory.update({
                        where: { id: stageHistory.id },
                        data: {
                            slaStatus: slaCheck.status,
                            durationHours: slaCheck.durationHours,
                        },
                    });
                    updatedCount++;
                }
            } catch (error) {
                console.error(
                    `Error updating SLA status for stage ${stageHistory.id}:`,
                    error,
                );
            }
        }

        return { updatedCount, totalChecked: activeStages.length };
    }
}
