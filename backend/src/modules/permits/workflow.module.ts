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

import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
<<<<<<< HEAD
  imports: [PrismaModule, PermitModule, NotificationModule, WorkflowTemplateModule],
=======
  imports: [PrismaModule, PermitModule, NotificationModule, AuditLogModule],
>>>>>>> ee59e0a (workflow fix)
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
    AnalyticsService,
    TransparencyService,
    ReportingService,
<<<<<<< HEAD
    WorkflowTemplateService,
=======
    PermitModule,
>>>>>>> ee59e0a (workflow fix)
  ],
})
export class WorkflowModule {}