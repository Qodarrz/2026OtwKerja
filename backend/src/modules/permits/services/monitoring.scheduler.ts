import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { NotificationGateway } from '../gateways/notification.gateway';

@Injectable()
export class MonitoringScheduler {
    private readonly logger = new Logger(MonitoringScheduler.name);

    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    /**
     * Push live metrics to all connected ADMIN clients every 30 seconds
     */
    @Cron('*/30 * * * * *')
    async pushLiveMetrics() {
        try {
            const metrics = await this.analyticsService.getLiveMetrics();
            this.notificationGateway.sendToRole(Role.ADMIN, 'metrics_update', metrics);
            this.logger.debug(
                `Live metrics pushed to ADMIN room. Active: ${metrics.activeApplications}, ` +
                `Overdue: ${metrics.overdueCount}, Rate: ${metrics.processingRate}/h`,
            );
        } catch (error) {
            this.logger.error('MonitoringScheduler failed to push live metrics:', error);
        }
    }
}
