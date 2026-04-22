import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { PermitService } from './services/permit.service';
import { TaxCalculatorService } from './services/tax-calculator.service';
import { FileService } from './services/file.service';
import { PermitController } from './controllers/permit.controller';
import { DocumentController } from './controllers/document.controller';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [PermitController, DocumentController],
    providers: [PermitService, TaxCalculatorService, FileService],
    exports: [PermitService, TaxCalculatorService, FileService],
})
export class PermitModule { }
