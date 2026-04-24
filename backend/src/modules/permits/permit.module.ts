import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { PermitService } from './services/permit.service';
import { TaxCalculatorService } from './services/tax-calculator.service';
import { FileService } from './services/file.service';
import { SLAService } from './services/sla.service';
import { SLAScheduler } from './services/sla.scheduler';
import { NotificationModule } from './notification.module';
import { PermitController } from './controllers/permit.controller';
import { DocumentController } from './controllers/document.controller';

@Module({
    imports: [PrismaModule, UsersModule, NotificationModule],
    controllers: [PermitController, DocumentController],
    providers: [PermitService, TaxCalculatorService, FileService, SLAService, SLAScheduler],
    exports: [PermitService, TaxCalculatorService, FileService, SLAService],
})
export class PermitModule {}
