import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermitModule } from './permit.module';
import { NotificationModule } from './notification.module';
import { WorkflowService } from './services/workflow.service';
import { SLAService } from './services/sla.service';
import { AnalyticsService } from './services/analytics.service';
import { TransparencyService } from './services/transparency.service';
import { WorkflowController } from './controllers/workflow.controller';
import { SLAController } from './controllers/sla.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { TransparencyController } from './controllers/transparency.controller';

@Module({
  imports: [PrismaModule, PermitModule, NotificationModule],
  controllers: [
    WorkflowController,
    SLAController,
    AnalyticsController,
    TransparencyController,
  ],
  providers: [
    WorkflowService,
    SLAService,
    AnalyticsService,
    TransparencyService,
  ],
  exports: [WorkflowService, SLAService, AnalyticsService, TransparencyService],
})
export class WorkflowModule {}
