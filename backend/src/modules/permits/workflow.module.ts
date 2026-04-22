import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermitModule } from './permit.module';
import { NotificationModule } from './notification.module';
import { WorkflowService } from './services/workflow.service';
import { SLAService } from './services/sla.service';
import { WorkflowController } from './controllers/workflow.controller';
import { SLAController } from './controllers/sla.controller';

@Module({
  imports: [PrismaModule, PermitModule, NotificationModule],
  controllers: [WorkflowController, SLAController],
  providers: [WorkflowService, SLAService],
  exports: [WorkflowService, SLAService],
})
export class WorkflowModule {}
