import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CreateAuditLogDto } from '../dto/audit-log.dto';

@Processor('audit-logs')
export class AuditLogProcessor {
    private readonly logger = new Logger(AuditLogProcessor.name);
    private gateway: any; // Will be set by module

    constructor(private prisma: PrismaService) { }

    /**
     * Set gateway reference
     */
    setGateway(gateway: any) {
        this.gateway = gateway;
    }

    @Process('create-audit-log')
    async handleCreateAuditLog(job: Job<CreateAuditLogDto>) {
        this.logger.debug(`Processing audit log job ${job.id}`);

        try {
            const dto = job.data;

            const auditLog = await this.prisma.auditLog.create({
                data: {
                    entityType: dto.entityType,
                    entityId: dto.entityId,
                    action: dto.action,
                    changes: dto.changes as any,
                    performedBy: dto.performedBy,
                    ipAddress: dto.ipAddress,
                    userAgent: dto.userAgent,
                },
            });

            // Broadcast to WebSocket clients if gateway is available
            if (this.gateway) {
                try {
                    this.gateway.broadcastNewAuditLog(auditLog);
                } catch (error) {
                    this.logger.error('Failed to broadcast audit log:', error);
                    // Don't throw - broadcasting failure shouldn't fail the job
                }
            }

            this.logger.debug(`Successfully created audit log for job ${job.id}`);
        } catch (error) {
            this.logger.error(
                `Failed to create audit log for job ${job.id}:`,
                error,
            );
            throw error; // Re-throw to trigger retry
        }
    }
}
