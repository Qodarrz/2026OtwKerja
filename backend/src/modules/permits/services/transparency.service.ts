import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, SLAStatus, PermitType } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

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
    constructor(
        private prisma: PrismaService,
        private analyticsService: AnalyticsService,
    ) { }

    /**
     * Get public dashboard metrics
     */
    async getPublicDashboardMetrics(
        startDate?: Date,
        endDate?: Date,
    ): Promise<PublicDashboardMetrics> {
        const now = new Date();
        const start = startDate || new Date(now.getFullYear(), 0, 1);
        const end = endDate || now;

        const applications = await this.prisma.permitApplication.findMany({
            where: {
                submittedAt: { gte: start, lte: end },
                status: { in: [WorkflowStage.APPROVED, WorkflowStage.REJECTED] },
            },
            include: {
                stageHistory: {
                    where: { completedAt: { not: null } },
                },
            },
        });

        const allStages = applications.flatMap(app => app.stageHistory);
        const metrics = this.analyticsService.calculateMetricsFromStages(allStages);

        const approvedCount = applications.filter(app => app.status === WorkflowStage.APPROVED).length;
        const currentlyInProcess = await this.prisma.permitApplication.count({
            where: {
                status: { notIn: [WorkflowStage.APPROVED, WorkflowStage.REJECTED] },
            },
        });

        // Group by permit type
        const byPermitType = Array.from(
            applications.reduce((acc, app) => {
                const existing = acc.get(app.permitType) || { total: 0, approved: 0, stages: [] };
                acc.set(app.permitType, {
                    total: existing.total + 1,
                    approved: existing.approved + (app.status === WorkflowStage.APPROVED ? 1 : 0),
                    stages: [...existing.stages, ...app.stageHistory]
                });
                return acc;
            }, new Map<PermitType, any>()).entries()
        ).map(([type, stats]) => {
            const typeMetrics = this.analyticsService.calculateMetricsFromStages(stats.stages);
            return {
                permitType: type,
                totalProcessed: stats.total,
                averageProcessingDays: Math.round((typeMetrics.averageDurationHours / 24) * 10) / 10,
                approvalRate: Math.round((stats.approved / stats.total) * 100 * 10) / 10
            };
        });

        return {
            totalApplicationsProcessed: applications.length,
            averageProcessingDays: Math.round((metrics.averageDurationHours / 24) * 10) / 10,
            onTimePercentage: Math.round(metrics.onTimePercentage * 10) / 10,
            currentlyInProcess,
            approvalRate: applications.length > 0 ? Math.round((approvedCount / applications.length) * 100 * 10) / 10 : 0,
            byPermitType,
        };
    }

    /**
     * Get public application status
     */
    async getApplicationStatusPublic(referenceNumber: string): Promise<ApplicationStatusPublic | null> {
        const application = await this.prisma.permitApplication.findUnique({
            where: { referenceNumber },
        });

        if (!application || !application.submittedAt) return null;

        const now = new Date();
        const submittedAt = new Date(application.submittedAt);
        const daysInProcess = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));

        const slaRules = await this.prisma.sLARule.findMany();
        const totalSLADays = slaRules.reduce((sum, rule) => sum + rule.maxDurationHours / 24, 0);

        const estimatedCompletionDate = new Date(submittedAt);
        estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + Math.ceil(totalSLADays));

        let status: 'ON_TRACK' | 'DELAYED' | 'COMPLETED';
        if (([WorkflowStage.APPROVED, WorkflowStage.REJECTED] as WorkflowStage[]).includes(application.status)) {
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
     */
    async getProcessTransparency(): Promise<ProcessTransparency[]> {
        const stages = [WorkflowStage.DOCUMENT_CHECK, WorkflowStage.FIELD_INSPECTION, WorkflowStage.LEGALIZATION];
        const [slaRules, completedStages, backlogs] = await Promise.all([
            this.prisma.sLARule.findMany({ where: { stage: { in: stages } } }),
            this.prisma.stageHistory.findMany({ 
                where: { toStage: { in: stages }, completedAt: { not: null } } 
            }),
            this.prisma.permitApplication.groupBy({
                by: ['currentStage'],
                where: { currentStage: { in: stages } },
                _count: true
            })
        ]);

        const slaRuleMap = new Map(slaRules.map(r => [r.stage, r]));
        const backlogMap = new Map(backlogs.map(b => [b.currentStage, b._count]));

        return stages.map(stage => {
            const stageHistory = completedStages.filter(s => s.toStage === stage);
            const metrics = this.analyticsService.calculateMetricsFromStages(stageHistory);
            const slaRule = slaRuleMap.get(stage);

            return {
                stage,
                averageProcessingDays: Math.round((metrics.averageDurationHours / 24) * 10) / 10,
                slaLimitDays: slaRule ? Math.round((slaRule.maxDurationHours / 24) * 10) / 10 : 0,
                onTimePercentage: Math.round(metrics.onTimePercentage * 10) / 10,
                currentBacklog: backlogMap.get(stage) || 0
            };
        });
    }
}
