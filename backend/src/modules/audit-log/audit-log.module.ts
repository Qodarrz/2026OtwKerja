import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditLogService } from './services/audit-log.service';
import { AuditQueryService } from './services/audit-query.service';
import { AuditExportService } from './services/audit-export.service';
import { AuditLogProcessor } from './processors/audit-log.processor';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditLogGateway } from './gateways/audit-log.gateway';

@Global()
@Module({
    imports: [
        BullModule.registerQueue({
            name: 'audit-logs',
        }),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
        PrismaModule,
    ],
    controllers: [AuditLogController],
    providers: [
        AuditLogService,
        AuditQueryService,
        AuditExportService,
        AuditLogProcessor,
        AuditLogGateway,
    ],
    exports: [AuditLogService],
})
export class AuditLogModule {
    constructor(
        private auditLogGateway: AuditLogGateway,
        private auditLogProcessor: AuditLogProcessor,
    ) {
        // Connect gateway to processor for broadcasting
        this.auditLogProcessor.setGateway(this.auditLogGateway);
    }
}

