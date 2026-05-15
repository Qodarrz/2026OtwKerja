import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, AuditLog } from '@prisma/client';
import { AuditLogFilters, PaginatedAuditLogs } from '../dto/audit-log.dto';

@Injectable()
export class AuditQueryService {
    constructor(private prisma: PrismaService) { }

    /**
     * Query audit logs with filters and pagination
     */
    async queryAuditLogs(filters: AuditLogFilters): Promise<PaginatedAuditLogs> {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 10, 1000); // Max 1000 per page
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.AuditLogWhereInput = {};

        if (filters.entityType) {
            where.entityType = filters.entityType;
        }

        if (filters.entityId) {
            where.entityId = filters.entityId;
        }

        if (filters.action) {
            where.action = filters.action;
        }

        if (filters.performedBy) {
            where.performedBy = filters.performedBy;
        }

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.createdAt.lte = new Date(filters.endDate);
            }
        }

        // Execute query with pagination
        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get audit log by ID
     */
    async getAuditLogById(id: string): Promise<AuditLog | null> {
        return this.prisma.auditLog.findUnique({
            where: { id },
        });
    }

    /**
     * Query both active and archived audit logs
     */
    async queryAllAuditLogs(
        filters: AuditLogFilters,
    ): Promise<PaginatedAuditLogs> {
        // Query active logs
        const activeLogs = await this.queryAuditLogs(filters);

        // If we need more results, query archive
        if (activeLogs.data.length < (filters.limit || 10)) {
            const archiveFilters = {
                ...filters,
                limit: (filters.limit || 10) - activeLogs.data.length,
            };
            const archivedLogs = await this.queryArchivedAuditLogs(archiveFilters);

            return {
                data: [...activeLogs.data, ...archivedLogs.data],
                total: activeLogs.total + archivedLogs.total,
                page: filters.page || 1,
                limit: filters.limit || 10,
                totalPages: Math.ceil(
                    (activeLogs.total + archivedLogs.total) / (filters.limit || 10),
                ),
            };
        }

        return activeLogs;
    }

    /**
     * Query archived audit logs
     */
    private async queryArchivedAuditLogs(
        filters: AuditLogFilters,
    ): Promise<PaginatedAuditLogs> {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 10, 1000);
        const skip = (page - 1) * limit;

        // Build where clause for archive
        const where: Prisma.AuditLogArchiveWhereInput = {};

        if (filters.entityType) {
            where.entityType = filters.entityType;
        }

        if (filters.entityId) {
            where.entityId = filters.entityId;
        }

        if (filters.action) {
            where.action = filters.action;
        }

        if (filters.performedBy) {
            where.performedBy = filters.performedBy;
        }

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.createdAt.lte = new Date(filters.endDate);
            }
        }

        // Execute query with pagination
        const [data, total] = await Promise.all([
            this.prisma.auditLogArchive.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.auditLogArchive.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
