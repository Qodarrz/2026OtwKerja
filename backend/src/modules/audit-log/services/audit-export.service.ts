import { Injectable, BadRequestException } from '@nestjs/common';
import { AuditQueryService } from './audit-query.service';
import { AuditLogFilters } from '../dto/audit-log.dto';

@Injectable()
export class AuditExportService {
    constructor(private queryService: AuditQueryService) { }

    /**
     * Export audit logs to CSV format
     */
    async exportToCSV(filters: AuditLogFilters): Promise<string> {
        // Limit to 10,000 records
        const exportFilters = { ...filters, limit: 10000, page: 1 };
        const result = await this.queryService.queryAuditLogs(exportFilters);

        if (result.total > 10000) {
            throw new BadRequestException(
                'Export exceeds 10,000 record limit. Please apply more filters.',
            );
        }

        // Generate CSV
        const headers = [
            'id',
            'entityType',
            'entityId',
            'action',
            'performedBy',
            'ipAddress',
            'userAgent',
            'createdAt',
            'changes',
        ];

        const rows = result.data.map((log) => [
            log.id,
            log.entityType,
            log.entityId,
            log.action,
            log.performedBy || '',
            log.ipAddress || '',
            log.userAgent || '',
            log.createdAt.toISOString(),
            this.flattenChanges(log.changes),
        ]);

        const csv = [headers, ...rows]
            .map((row) =>
                row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
            )
            .join('\n');

        return csv;
    }

    /**
     * Export audit logs to JSON format
     */
    async exportToJSON(filters: AuditLogFilters): Promise<string> {
        // Limit to 10,000 records
        const exportFilters = { ...filters, limit: 10000, page: 1 };
        const result = await this.queryService.queryAuditLogs(exportFilters);

        if (result.total > 10000) {
            throw new BadRequestException(
                'Export exceeds 10,000 record limit. Please apply more filters.',
            );
        }

        return JSON.stringify(result.data, null, 2);
    }

    /**
     * Flatten changes JSON for CSV export
     */
    private flattenChanges(changes: any): string {
        if (!changes) return '';

        try {
            if (changes.before && changes.after) {
                return `from: ${JSON.stringify(changes.before)}, to: ${JSON.stringify(changes.after)}`;
            }
            return JSON.stringify(changes);
        } catch {
            return '[Invalid JSON]';
        }
    }
}
