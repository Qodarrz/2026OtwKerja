import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermitModule } from './permit.module';
import { NotificationModule } from './notification.module';
import { WorkflowService } from './services/workflow.service';
import { SLAService } from './services/sla.service';
import { AnalyticsService } from './services/analytics.service';
import { TransparencyService } from './services/transparency.service';
import { ReportingService } from './services/reporting.service';
import { MonitoringScheduler } from './services/monitoring.scheduler';
import { WorkflowController } from './controllers/workflow.controller';
import { SLAController } from './controllers/sla.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { TransparencyController } from './controllers/transparency.controller';
import { ReportingController } from './controllers/reporting.controller';
import { WorkflowTemplateModule } from '../workflow-template/workflow-template.module';
import { WorkflowTemplateService } from '../workflow-template/services/workflow-template.service';

@Module({
  imports: [PrismaModule, PermitModule, NotificationModule, WorkflowTemplateModule],
  controllers: [
    WorkflowController,
    SLAController,
    AnalyticsController,
    TransparencyController,
    ReportingController,
  ],
  providers: [
    WorkflowService,
    AnalyticsService,
    TransparencyService,
    ReportingService,
    MonitoringScheduler,
  ],
  exports: [
    WorkflowService,
    SLAService,
    AnalyticsService,
    TransparencyService,
    ReportingService,
    WorkflowTemplateService,
  ],
})
export class WorkflowModule {}
