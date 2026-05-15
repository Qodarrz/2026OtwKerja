import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsIP, MaxLength } from 'class-validator';

/**
 * Entity types that can be audited
 */
export enum AuditEntityType {
    PERMIT_APPLICATION = 'PermitApplication',
    USER = 'User',
    DOCUMENT = 'Document',
    SLA_RULE = 'SLARule',
    NOTIFICATION = 'Notification',
}

/**
 * Action types for audit logging
 */
export enum AuditActionType {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    SUBMIT = 'SUBMIT',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    UPLOAD = 'UPLOAD',
    DOWNLOAD = 'DOWNLOAD',
}

/**
 * Change diff structure for UPDATE actions
 */
export interface ChangeDiff {
    before?: any;
    after?: any;
    metadata?: {
        reason?: string;
        notes?: string;
        [key: string]: any;
    };
}

/**
 * DTO for creating audit log entries
 */
export class CreateAuditLogDto {
    @IsEnum(AuditEntityType)
    @IsNotEmpty()
    entityType: AuditEntityType;

    @IsUUID()
    @IsNotEmpty()
    entityId: string;

    @IsEnum(AuditActionType)
    @IsNotEmpty()
    action: AuditActionType;

    @IsOptional()
    changes?: ChangeDiff | any;

    @IsOptional()
    @IsUUID()
    performedBy?: string;

    @IsOptional()
    @IsString()
    @MaxLength(45)
    ipAddress?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    userAgent?: string;
}

/**
 * Filters for querying audit logs
 */
export interface AuditLogFilters {
    entityType?: string;
    entityId?: string;
    action?: string;
    performedBy?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

/**
 * Paginated audit log response
 */
export interface PaginatedAuditLogs {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
