import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateAuditLogDto,
    AuditEntityType,
    AuditActionType,
    ChangeDiff,
} from '../dto/audit-log.dto';

@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Create audit log entry
     * Queues for async processing, falls back to sync if queue unavailable
     */
    async createAuditLog(dto: CreateAuditLogDto): Promise<void> {
        try {
            // Validate input
            this.validateAuditLogData(dto);

            // Sanitize sensitive fields
            const sanitized = this.sanitizeSensitiveFields(dto);

            // For now, create synchronously (queue will be added in Task 7)
            await this.createAuditLogSync(sanitized);
        } catch (error) {
            // Log error but don't throw (fail-safe)
            this.logger.error('Failed to create audit log:', error);
        }
    }

    /**
     * Create audit log synchronously
     */
    private async createAuditLogSync(dto: CreateAuditLogDto): Promise<void> {
        try {
            await this.prisma.auditLog.create({
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
        } catch (error) {
            // Log error but don't throw (fail-safe)
            this.logger.error('Failed to create audit log in database:', error);
        }
    }

    /**
     * Validate audit log data
     */
    private validateAuditLogData(dto: CreateAuditLogDto): void {
        // Validate entity type
        if (!Object.values(AuditEntityType).includes(dto.entityType as any)) {
            throw new BadRequestException(`Invalid entity type: ${dto.entityType}`);
        }

        // Validate action
        if (!Object.values(AuditActionType).includes(dto.action as any)) {
            throw new BadRequestException(`Invalid action: ${dto.action}`);
        }

        // Validate UUID format
        if (!this.isValidUUID(dto.entityId)) {
            throw new BadRequestException(`Invalid entity ID format: ${dto.entityId}`);
        }

        if (dto.performedBy && !this.isValidUUID(dto.performedBy)) {
            throw new BadRequestException(
                `Invalid performedBy format: ${dto.performedBy}`,
            );
        }

        // Validate IP address
        if (dto.ipAddress && !this.isValidIP(dto.ipAddress)) {
            throw new BadRequestException(`Invalid IP address: ${dto.ipAddress}`);
        }

        // Validate changes size (max 10 MB)
        if (dto.changes) {
            const size = JSON.stringify(dto.changes).length;
            const maxSize = 10 * 1024 * 1024; // 10 MB
            if (size > maxSize) {
                throw new BadRequestException('Changes field exceeds 10 MB limit');
            }
        }
    }

    /**
     * Sanitize sensitive fields from changes
     */
    private sanitizeSensitiveFields(dto: CreateAuditLogDto): CreateAuditLogDto {
        if (!dto.changes) return dto;

        const sensitiveFields = [
            'password',
            'token',
            'secret',
            'apiKey',
            'accessToken',
            'refreshToken',
            'otp_code',
        ];
        const sanitized = { ...dto };

        const sanitizeObject = (obj: any): any => {
            if (typeof obj !== 'object' || obj === null) return obj;

            const result: any = Array.isArray(obj) ? [] : {};
            for (const key in obj) {
                if (
                    sensitiveFields.some((field) =>
                        key.toLowerCase().includes(field.toLowerCase()),
                    )
                ) {
                    result[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object') {
                    result[key] = sanitizeObject(obj[key]);
                } else {
                    result[key] = obj[key];
                }
            }
            return result;
        };

        sanitized.changes = sanitizeObject(dto.changes);
        return sanitized;
    }

    /**
     * Create change diff for UPDATE actions
     */
    createChangeDiff(before: any, after: any, metadata?: any): ChangeDiff {
        return {
            before,
            after,
            metadata,
        };
    }

    /**
     * Validate UUID format
     */
    private isValidUUID(uuid: string): boolean {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    /**
     * Validate IP address (IPv4 and IPv6)
     */
    private isValidIP(ip: string): boolean {
        // IPv4 regex
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        // IPv6 regex (simplified)
        const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
        // IPv6 compressed format
        const ipv6CompressedRegex = /^(([0-9a-f]{1,4}:)*)?::([0-9a-f]{1,4}:)*[0-9a-f]{1,4}$/i;

        if (ipv4Regex.test(ip)) {
            // Additional validation for IPv4 octets (0-255)
            const octets = ip.split('.');
            return octets.every((octet) => {
                const num = parseInt(octet, 10);
                return num >= 0 && num <= 255;
            });
        }

        return ipv6Regex.test(ip) || ipv6CompressedRegex.test(ip);
    }
}
