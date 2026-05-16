import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BottleneckEvent, WorkflowStage, Role } from '@prisma/client';

interface AlertHistory {
    stage: WorkflowStage;
    lastAlertTime: Date;
    eventCount: number;
    highestScore: number;
}

@Injectable()
export class BottleneckAlertService {
    private readonly logger = new Logger(BottleneckAlertService.name);
    private alertHistory: Map<WorkflowStage, AlertHistory> = new Map();

    constructor(private prisma: PrismaService) {}

    async sendBottleneckAlert(bottleneck: BottleneckEvent): Promise<void> {
        const shouldAggregate = await this.shouldAggregate(bottleneck.stage);

        if (shouldAggregate) {
            await this.updateAggregation(bottleneck);
            this.logger.log(
                `Aggregating bottleneck alert for stage ${bottleneck.stage}`,
            );
            return;
        }

        await this.createAndSendAlert(bottleneck);
    }

    async sendResolutionAlert(bottleneck: BottleneckEvent): Promise<void> {
        const admins = await this.getAdminUsers();

        for (const admin of admins) {
            await this.createNotification(
                admin.id,
                'Bottleneck Resolved',
                `Bottleneck at ${bottleneck.stage} stage has been resolved. Duration: ${bottleneck.resolutionDuration} minutes. Score dropped from ${bottleneck.score} to below threshold.`,
                'BOTTLENECK_RESOLVED',
            );
        }

        this.alertHistory.delete(bottleneck.stage);

        this.logger.log(
            `Sent resolution alert for bottleneck ${bottleneck.id}`,
        );
    }

    async sendReminderAlerts(): Promise<void> {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        const persistentBottlenecks = await this.prisma.bottleneckEvent.findMany(
            {
                where: {
                    status: 'ACTIVE',
                    detectedAt: {
                        lte: twoHoursAgo,
                    },
                },
            },
        );

        for (const bottleneck of persistentBottlenecks) {
            await this.sendReminderAlert(bottleneck);
        }

        this.logger.log(
            `Sent ${persistentBottlenecks.length} reminder alerts for persistent bottlenecks`,
        );
    }

    private async shouldAggregate(stage: WorkflowStage): Promise<boolean> {
        const history = this.alertHistory.get(stage);

        if (!history) {
            return false;
        }

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        return history.lastAlertTime > thirtyMinutesAgo;
    }

    private async updateAggregation(bottleneck: BottleneckEvent): Promise<void> {
        const history = this.alertHistory.get(bottleneck.stage);

        if (history) {
            history.eventCount += 1;
            history.highestScore = Math.max(
                history.highestScore,
                bottleneck.score,
            );
        }
    }

    private async createAndSendAlert(bottleneck: BottleneckEvent): Promise<void> {
        const admins = await this.getAdminUsers();

        const message = this.buildAlertMessage(bottleneck);

        for (const admin of admins) {
            await this.createNotification(
                admin.id,
                'Bottleneck Detected',
                message,
                'BOTTLENECK_DETECTED',
            );
        }

        if (bottleneck.severity === 'HIGH') {
            const stageStaff = await this.getStageStaff(bottleneck.stage);

            for (const staff of stageStaff) {
                await this.createNotification(
                    staff.id,
                    'High Severity Bottleneck',
                    message,
                    'BOTTLENECK_DETECTED',
                );
            }
        }

        this.alertHistory.set(bottleneck.stage, {
            stage: bottleneck.stage,
            lastAlertTime: new Date(),
            eventCount: 1,
            highestScore: bottleneck.score,
        });

        this.logger.log(`Sent bottleneck alert for ${bottleneck.stage}`);
    }

    private async sendReminderAlert(bottleneck: BottleneckEvent): Promise<void> {
        const admins = await this.getAdminUsers();

        const durationHours = Math.floor(
            (Date.now() - bottleneck.detectedAt.getTime()) / (1000 * 60 * 60),
        );

        const message = `REMINDER: Bottleneck at ${bottleneck.stage} stage has been active for ${durationHours} hours. Score: ${bottleneck.score}. Please take action.`;

        for (const admin of admins) {
            await this.createNotification(
                admin.id,
                'Bottleneck Reminder',
                message,
                'BOTTLENECK_REMINDER',
            );
        }
    }

    private buildAlertMessage(bottleneck: BottleneckEvent): string {
        const factors: string[] = [];

        if (bottleneck.queueWeight > 30) {
            factors.push(
                `Queue: ${bottleneck.queueLength} applications (${bottleneck.queueWeight.toFixed(1)}%)`,
            );
        }

        if (bottleneck.processingWeight > 30) {
            factors.push(
                `Processing Time: ${bottleneck.avgProcessingTime.toFixed(1)} hours (${bottleneck.processingWeight.toFixed(1)}%)`,
            );
        }

        if (bottleneck.slaWeight > 30) {
            factors.push(
                `SLA Violations: ${bottleneck.slaViolationRate.toFixed(1)}% (${bottleneck.slaWeight.toFixed(1)}%)`,
            );
        }

        if (bottleneck.workloadWeight > 30) {
            factors.push(
                `Staff Workload: ${bottleneck.staffWorkload.toFixed(1)} apps/staff (${bottleneck.workloadWeight.toFixed(1)}%)`,
            );
        }

        return `Bottleneck detected at ${bottleneck.stage} stage. Severity: ${bottleneck.severity}. Score: ${bottleneck.score}/100. Contributing factors: ${factors.join(', ')}. Detected at: ${bottleneck.detectedAt.toISOString()}.`;
    }

    private async createNotification(
        userId: string,
        title: string,
        message: string,
        type: string,
    ): Promise<void> {
        try {
            await this.prisma.notification.create({
                data: {
                    userId,
                    type: type as any,
                    title,
                    message,
                },
            });
        } catch (error) {
            this.logger.error(
                `Failed to create notification for user ${userId}:`,
                error,
            );
        }
    }

    private async getAdminUsers() {
        return this.prisma.user.findMany({
            where: {
                roles: {
                    has: Role.ADMIN,
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
    }

    private async getStageStaff(stage: WorkflowStage) {
        const roleMap = {
            [WorkflowStage.DOCUMENT_CHECK]: Role.DOCUMENT_VALIDATOR,
            [WorkflowStage.FIELD_INSPECTION]: Role.FIELD_INSPECTOR,
            [WorkflowStage.LEGALIZATION]: Role.LEGALIZER,
        };

        const role = roleMap[stage];

        return this.prisma.user.findMany({
            where: {
                roles: {
                    has: role,
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
    }

    async createAggregatedAlert(stage: WorkflowStage): Promise<void> {
        const history = this.alertHistory.get(stage);

        if (!history || history.eventCount <= 1) {
            return;
        }

        const admins = await this.getAdminUsers();

        const now = new Date();
        const durationMinutes = Math.floor(
            (now.getTime() - history.lastAlertTime.getTime()) / (1000 * 60),
        );

        const message = `Multiple bottlenecks detected at ${stage} stage. Count: ${history.eventCount} events in ${durationMinutes} minutes. Highest score: ${history.highestScore}/100. Time range: ${history.lastAlertTime.toISOString()} to ${now.toISOString()}.`;

        for (const admin of admins) {
            await this.createNotification(
                admin.id,
                'Aggregated Bottleneck Alert',
                message,
                'BOTTLENECK_AGGREGATED',
            );
        }

        this.alertHistory.delete(stage);

        this.logger.log(`Sent aggregated alert for stage ${stage}`);
    }

    async checkRecurringIssue(
        stage: WorkflowStage,
        currentBottleneckId: string,
    ): Promise<boolean> {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const recentResolved = await this.prisma.bottleneckEvent.findFirst({
            where: {
                stage,
                status: 'RESOLVED',
                resolvedAt: {
                    gte: oneHourAgo,
                },
                id: {
                    not: currentBottleneckId,
                },
            },
        });

        if (recentResolved) {
            const admins = await this.getAdminUsers();

            const message = `RECURRING ISSUE: Bottleneck at ${stage} stage has recurred within 1 hour of resolution. Previous bottleneck resolved at ${recentResolved.resolvedAt?.toISOString()}. This indicates a systemic issue requiring immediate attention.`;

            for (const admin of admins) {
                await this.createNotification(
                    admin.id,
                    'Recurring Bottleneck Issue',
                    message,
                    'BOTTLENECK_RECURRING',
                );
            }

            this.logger.warn(`Recurring bottleneck detected at stage ${stage}`);

            return true;
        }

        return false;
    }
}
