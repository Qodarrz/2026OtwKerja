import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationFiltersDto } from '../dto/integration.dto';
import { WorkflowStage } from '@prisma/client';

@Injectable()
export class IntegrationService {
    constructor(private prisma: PrismaService) { }

    async getApplicationStatus(referenceNumber: string) {
        const app = await this.prisma.permitApplication.findUnique({
            where: { referenceNumber },
            select: {
                referenceNumber: true,
                permitType: true,
                status: true,
                currentStage: true,
                submittedAt: true,
                stageHistory: {
                    orderBy: { transitionedAt: 'asc' },
                    select: { fromStage: true, toStage: true, transitionedAt: true, completedAt: true, slaStatus: true },
                },
            },
        });

        if (!app) throw new NotFoundException(`Application ${referenceNumber} not found`);

        return {
            referenceNumber: app.referenceNumber,
            permitType: app.permitType,
            status: app.status,
            currentStage: app.currentStage,
            submittedAt: app.submittedAt,
            stageHistory: app.stageHistory.map(h => ({
                stage: h.toStage,
                completedAt: h.completedAt,
                slaStatus: h.slaStatus,
            })),
        };
    }

    async listApplications(filters: IntegrationFiltersDto) {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters.status) where.status = filters.status;
        if (filters.permitType) where.permitType = filters.permitType;

        const [data, total] = await Promise.all([
            this.prisma.permitApplication.findMany({
                where,
                skip,
                take: limit,
                orderBy: { submittedAt: 'desc' },
                select: {
                    referenceNumber: true,
                    permitType: true,
                    status: true,
                    currentStage: true,
                    submittedAt: true,
                    updatedAt: true,
                },
            }),
            this.prisma.permitApplication.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getStatsSummary() {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [total, approvedThisMonth, approved, completedStages] = await Promise.all([
            this.prisma.permitApplication.count(),
            this.prisma.permitApplication.count({ where: { status: WorkflowStage.APPROVED, updatedAt: { gte: monthStart } } }),
            this.prisma.permitApplication.count({ where: { status: WorkflowStage.APPROVED } }),
            this.prisma.stageHistory.findMany({
                where: { completedAt: { not: null } },
                select: { durationHours: true },
                take: 1000,
            }),
        ]);

        const totalDuration = completedStages.reduce((sum, s) => sum + (s.durationHours || 0), 0);
        const avgHours = completedStages.length > 0 ? totalDuration / completedStages.length : 0;

        return {
            totalApplications: total,
            approvedThisMonth,
            averageProcessingDays: Math.round((avgHours / 24) * 10) / 10,
            approvalRate: total > 0 ? Math.round((approved / total) * 100 * 10) / 10 : 0,
        };
    }
}
