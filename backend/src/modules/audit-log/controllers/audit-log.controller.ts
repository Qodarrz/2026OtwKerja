import {
    Controller,
    Get,
    Query,
    Param,
    UseGuards,
    Res,
    HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AuditQueryService } from '../services/audit-query.service';
import { AuditExportService } from '../services/audit-export.service';
import type { AuditLogFilters } from '../dto/audit-log.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AuditLogController {
    constructor(
        private auditQueryService: AuditQueryService,
        private auditExportService: AuditExportService,
    ) {}

    /**
     * Query audit logs with filters and pagination
     * GET /audit-logs?entityType=PermitApplication&page=1&limit=50
     */
    @Get()
    async queryAuditLogs(@Query() filters: AuditLogFilters) {
        return this.auditQueryService.queryAuditLogs(filters);
    }

    /**
     * Get single audit log by ID
     * GET /audit-logs/:id
     */
    @Get(':id')
    async getAuditLogById(@Param('id') id: string) {
        return this.auditQueryService.getAuditLogById(id);
    }

    /**
     * Export audit logs to CSV
     * GET /audit-logs/export/csv?entityType=User&startDate=2026-01-01
     */
    @Get('export/csv')
    async exportToCSV(@Query() filters: AuditLogFilters, @Res() res: Response) {
        const csv = await this.auditExportService.exportToCSV(filters);

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="audit-logs-${Date.now()}.csv"`,
        );

        res.status(HttpStatus.OK).send(csv);
    }

    /**
     * Export audit logs to JSON
     * GET /audit-logs/export/json?entityType=User&startDate=2026-01-01
     */
    @Get('export/json')
    async exportToJSON(
        @Query() filters: AuditLogFilters,
        @Res() res: Response,
    ) {
        const json = await this.auditExportService.exportToJSON(filters);

        // Set headers for JSON download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="audit-logs-${Date.now()}.json"`,
        );

        res.status(HttpStatus.OK).send(json);
    }
}
