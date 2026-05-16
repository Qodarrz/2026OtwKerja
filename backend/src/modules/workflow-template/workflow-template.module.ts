import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { WorkflowTemplateService } from './services/workflow-template.service';
import { WorkflowTemplateController } from './controllers/workflow-template.controller';

@Module({
    imports: [PrismaModule, AuditLogModule],
    controllers: [WorkflowTemplateController],
    providers: [WorkflowTemplateService],
    exports: [WorkflowTemplateService],
})
export class WorkflowTemplateModule {}
