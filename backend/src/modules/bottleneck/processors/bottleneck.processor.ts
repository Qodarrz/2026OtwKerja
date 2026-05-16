import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import { BottleneckDetectionService } from '../services/bottleneck-detection.service';
import { BottleneckRecommendationService } from '../services/bottleneck-recommendation.service';
import { BottleneckAlertService } from '../services/bottleneck-alert.service';

/**
 * Bull queue processor for bottleneck detection background jobs.
 *
 * Jobs handled:
 *  - detect-bottlenecks  (every 5 min)
 *  - check-resolutions   (every 15 min)
 *  - archive-old-events  (daily 02:00)
 *  - send-reminders      (every 2 h)
 */
@Processor('bottleneck-detection')
export class BottleneckProcessor {
    private readonly logger = new Logger(BottleneckProcessor.name);

    /** Optional gateway reference — set by the module after construction */
    private gateway: any;

    constructor(
        private readonly prisma: PrismaService,
        private readonly detectionService: BottleneckDetectionService,
        private readonly recommendationService: BottleneckRecommendationService,
        private readonly alertService: BottleneckAlertService,
    ) {}

    /** Allow the module to wire in the WebSocket gateway without a circular dep */
    setGateway(gateway: any): void {
        this.gateway = gateway;
    }

    /**
     * Main detection job — runs every 5 minutes.
     */
    @Process({ name: 'detect-bottlenecks', concurrency: 1 })
    async handleDetectBottlenecks(job: Job): Promise<void> {
        const startTime = Date.now();
        this.logger.log(`[detect-bottlenecks] Job ${job.id} started`);

        const timeoutWarning = setTimeout(() => {
            this.logger.warn(
                `[detect-bottlenecks] Job ${job.id} has exceeded the 2-minute timeout threshold`,
            );
        }, 120_000);

        try {
            const detectedBottlenecks =
                await this.detectionService.detectBottlenecks();

            for (const bottleneck of detectedBottlenecks) {
                try {
                    await this.recommendationService.generateRecommendations(
                        bottleneck,
                    );
                } catch (err) {
                    this.logger.error(
                        `[detect-bottlenecks] Failed to generate recommendations for ${bottleneck.id}:`,
                        err,
                    );
                }

                try {
                    await this.alertService.sendBottleneckAlert(bottleneck);
                } catch (err) {
                    this.logger.error(
                        `[detect-bottlenecks] Failed to send alert for ${bottleneck.id}:`,
                        err,
                    );
                }

                if (this.gateway) {
                    try {
                        this.gateway.broadcastBottleneckDetected(bottleneck);
                    } catch (err) {
                        this.logger.error(
                            `[detect-bottlenecks] Failed to broadcast bottleneck ${bottleneck.id}:`,
                            err,
                        );
                    }
                }
            }

            const durationMs = Date.now() - startTime;
            this.logger.log(
                `[detect-bottlenecks] Job ${job.id} completed in ${durationMs}ms — ` +
                    `detected ${detectedBottlenecks.length} bottleneck(s)`,
            );
        } catch (error) {
            const durationMs = Date.now() - startTime;
            this.logger.error(
                `[detect-bottlenecks] Job ${job.id} failed after ${durationMs}ms:`,
                error,
            );
            throw error; // Re-throw so Bull applies the retry strategy
        } finally {
            clearTimeout(timeoutWarning);
        }
    }

    @Process({ name: 'check-resolutions', concurrency: 1 })
    async handleCheckResolutions(job: Job): Promise<void> {
        const startTime = Date.now();
        this.logger.log(`[check-resolutions] Job ${job.id} started`);

        try {
            const activeBottlenecks =
                await this.detectionService.getActiveBottlenecks();

            let resolvedCount = 0;

            for (const bottleneck of activeBottlenecks) {
                try {
                    const wasResolved =
                        await this.detectionService.checkResolution(
                            bottleneck.id,
                        );

                    if (wasResolved) {
                        resolvedCount++;

                        // Fetch the updated record so resolvedAt / resolutionDuration are populated
                        const updatedBottleneck =
                            await this.detectionService.getBottleneckById(
                                bottleneck.id,
                            );

                        if (updatedBottleneck) {
                            try {
                                await this.alertService.sendResolutionAlert(
                                    updatedBottleneck,
                                );
                            } catch (err) {
                                this.logger.error(
                                    `[check-resolutions] Failed to send resolution alert for ${bottleneck.id}:`,
                                    err,
                                );
                            }

                            // Broadcast resolution to WebSocket clients
                            if (this.gateway) {
                                try {
                                    this.gateway.broadcastBottleneckResolved(
                                        updatedBottleneck,
                                    );
                                } catch (err) {
                                    this.logger.error(
                                        `[check-resolutions] Failed to broadcast resolution for ${bottleneck.id}:`,
                                        err,
                                    );
                                }
                            }
                        }

                        try {
                            await this.alertService.checkRecurringIssue(
                                bottleneck.stage,
                                bottleneck.id,
                            );
                        } catch (err) {
                            this.logger.error(
                                `[check-resolutions] Failed to evaluate effectiveness for ${bottleneck.id}:`,
                                err,
                            );
                        }
                    }
                } catch (err) {
                    this.logger.error(
                        `[check-resolutions] Error processing bottleneck ${bottleneck.id}:`,
                        err,
                    );
                }
            }

            const durationMs = Date.now() - startTime;
            this.logger.log(
                `[check-resolutions] Job ${job.id} completed in ${durationMs}ms — ` +
                    `checked ${activeBottlenecks.length} active bottleneck(s), resolved ${resolvedCount}`,
            );
        } catch (error) {
            const durationMs = Date.now() - startTime;
            this.logger.error(
                `[check-resolutions] Job ${job.id} failed after ${durationMs}ms:`,
                error,
            );
            throw error;
        }
    }

    @Process({ name: 'archive-old-events', concurrency: 1 })
    async handleArchiveOldEvents(job: Job): Promise<void> {
        const startTime = Date.now();
        this.logger.log(`[archive-old-events] Job ${job.id} started`);

        try {
            const archivalDays = parseInt(
                process.env.BOTTLENECK_ARCHIVAL_DAYS || '90',
                10,
            );
            const cutoffDate = new Date(
                Date.now() - archivalDays * 24 * 60 * 60 * 1000,
            );

            this.logger.log(
                `[archive-old-events] Archiving events older than ${archivalDays} days (before ${cutoffDate.toISOString()})`,
            );

            const eventsToArchive =
                await this.prisma.bottleneckEvent.findMany({
                    where: {
                        detectedAt: { lt: cutoffDate },
                    },
                    include: {
                        recommendations: false,
                        resolutionActions: false,
                    },
                });

            if (eventsToArchive.length === 0) {
                this.logger.log(
                    `[archive-old-events] No events to archive. Job ${job.id} completed.`,
                );
                return;
            }

            const archiveData = eventsToArchive.map((event) => ({
                id: event.id,
                stage: event.stage,
                score: event.score,
                severity: event.severity,
                queueLength: event.queueLength,
                queueWeight: event.queueWeight,
                avgProcessingTime: event.avgProcessingTime,
                processingWeight: event.processingWeight,
                slaViolationRate: event.slaViolationRate,
                slaWeight: event.slaWeight,
                staffWorkload: event.staffWorkload,
                workloadWeight: event.workloadWeight,
                status: event.status,
                detectedAt: event.detectedAt,
                resolvedAt: event.resolvedAt,
                resolutionDuration: event.resolutionDuration,
            }));

            await this.prisma.bottleneckEventArchive.createMany(
                {
                    data: archiveData,
                    skipDuplicates: true,
                },
            );

            const eventIds = eventsToArchive.map((e) => e.id);
            const deleteResult =
                await this.prisma.bottleneckEvent.deleteMany({
                    where: { id: { in: eventIds } },
                });

            const durationMs = Date.now() - startTime;
            this.logger.log(
                `[archive-old-events] Job ${job.id} completed in ${durationMs}ms — ` +
                    `archived ${archiveData.length} event(s), deleted ${deleteResult.count} record(s)`,
            );
        } catch (error) {
            const durationMs = Date.now() - startTime;
            this.logger.error(
                `[archive-old-events] Job ${job.id} failed after ${durationMs}ms:`,
                error,
            );
            throw error;
        }
    }

    @Process({ name: 'send-reminders', concurrency: 1 })
    async handleSendReminders(job: Job): Promise<void> {
        const startTime = Date.now();
        this.logger.log(`[send-reminders] Job ${job.id} started`);

        try {
            await this.alertService.sendReminderAlerts();

            const durationMs = Date.now() - startTime;
            this.logger.log(
                `[send-reminders] Job ${job.id} completed in ${durationMs}ms`,
            );
        } catch (error) {
            const durationMs = Date.now() - startTime;
            this.logger.error(
                `[send-reminders] Job ${job.id} failed after ${durationMs}ms:`,
                error,
            );
            throw error;
        }
    }
}
