import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { PermitService } from './services/permit.service';
import { TaxCalculatorService } from './services/tax-calculator.service';
import { FileService } from './services/file.service';
import { SLAService } from './services/sla.service';
import { SLAScheduler } from './services/sla.scheduler';
import { ReportExportService } from './services/report-export.service';
import { NotificationModule } from './notification.module';
import { PermitController } from './controllers/permit.controller';
import { DocumentController } from './controllers/document.controller';
import { ExportController } from './controllers/export.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
    imports: [PrismaModule, UsersModule, NotificationModule, AuditLogModule],
    controllers: [PermitController, DocumentController, ExportController],
    providers: [
        PermitService,
        TaxCalculatorService,
        FileService,
        SLAService,
        SLAScheduler,
        ReportExportService,
    ],
    exports: [PermitService, TaxCalculatorService, FileService, SLAService],
})
export class PermitModule {}
