import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermitModule } from './permit.module';
import { NotificationModule } from './notification.module';
import { WorkflowService } from './services/workflow.service';
import { SLAService } from './services/sla.service';
import { AnalyticsService } from './services/analytics.service';
import { WorkflowController } from './controllers/workflow.controller';
import { SLAController } from './controllers/sla.controller';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [PrismaModule, PermitModule, NotificationModule],
  controllers: [WorkflowController, SLAController, AnalyticsController],
  providers: [WorkflowService, SLAService, AnalyticsService],
  exports: [WorkflowService, SLAService, AnalyticsService],
})
export class WorkflowModule {}
