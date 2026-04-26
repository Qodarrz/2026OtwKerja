import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SLAService } from './sla.service';

@Injectable()
export class SLAScheduler {
  private readonly logger = new Logger(SLAScheduler.name);

  constructor(private readonly slaService: SLAService) {}

  /**
   * Run SLA status updates every hour
   * This handles automated warnings and escalations
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    try {
      this.logger.debug('Running automated SLA status check...');
      const result = await this.slaService.updateActiveSLAStatuses();
      this.logger.log(`SLA check completed. Updated ${result.updatedCount} applications.`);
    } catch (error) {
      this.logger.error('SLA Scheduler failed unexpectely:', error);
    }
  }

  /**
   * Run a quick check every 5 minutes for urgent warnings (optional)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleQuickCheck() {
    // Optional: add more frequent checks for high-priority permits
  }
}
