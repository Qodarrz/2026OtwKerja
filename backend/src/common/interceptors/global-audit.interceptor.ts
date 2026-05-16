import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../modules/audit-log/services/audit-log.service';
import {
    AuditEntityType,
    AuditActionType,
} from '../../modules/audit-log/dto/audit-log.dto';

@Injectable()
export class GlobalAuditInterceptor implements NestInterceptor {
    private readonly logger = new Logger(GlobalAuditInterceptor.name);

    constructor(private auditLogService: AuditLogService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method = request.method;

        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            return next.handle();
        }
        const userId = request.user?.userId || request.user?.sub;
        const ipAddress = this.extractIpAddress(request);
        const userAgent = request.headers['user-agent'] || '';
        const path = request.route?.path || request.url;

        // Determine entity type and action from route
        const { entityType, action, entityId } = this.parseRouteInfo(
            path,
            method,
            request,
        );

        // Skip if we can't determine entity type
        if (!entityType || !action || !entityId) {
            return next.handle();
        }

        return next.handle().pipe(
            tap({
                next: (response) => {
                    // Create audit log after successful operation
                    this.createAuditLog({
                        entityType,
                        entityId,
                        action,
                        performedBy: userId,
                        ipAddress,
                        userAgent,
                        changes: this.extractChanges(method, request.body, response),
                    });
                },
                error: (error) => {
                    // Log failed operations too
                    this.createAuditLog({
                        entityType,
                        entityId,
                        action,
                        performedBy: userId,
                        ipAddress,
                        userAgent,
                        changes: {
                            error: error.message,
                            body: request.body,
                        },
                    });
                },
            }),
        );
    }

    /**
     * Extract IP address from request
     */
    private extractIpAddress(request: any): string {
        return (
            request.headers['x-forwarded-for']?.split(',')[0] ||
            request.headers['x-real-ip'] ||
            request.ip ||
            request.connection?.remoteAddress ||
            ''
        );
    }

    /**
     * Parse route information to determine entity type, action, and entity ID
     */
    private parseRouteInfo(
        path: string,
        method: string,
        request: any,
    ): {
        entityType: AuditEntityType | null;
        action: AuditActionType | null;
        entityId: string | null;
    } {
        // Default values
        let entityType: AuditEntityType | null = null;
        let action: AuditActionType | null = null;
        let entityId: string | null = null;

        // Map HTTP methods to audit actions
        const methodActionMap: Record<string, AuditActionType> = {
            POST: AuditActionType.CREATE,
            PUT: AuditActionType.UPDATE,
            PATCH: AuditActionType.UPDATE,
            DELETE: AuditActionType.DELETE,
        };

        action = methodActionMap[method] || null;

        // Parse entity type from path
        if (path.includes('/permits') || path.includes('/applications')) {
            entityType = AuditEntityType.PERMIT_APPLICATION;
            entityId =
                request.params?.id ||
                request.params?.applicationId ||
                request.body?.id ||
                'unknown';
        } else if (path.includes('/users')) {
            entityType = AuditEntityType.USER;
            entityId =
                request.params?.id || request.params?.userId || request.body?.id || 'unknown';
        } else if (path.includes('/documents')) {
            entityType = AuditEntityType.DOCUMENT;
            entityId =
                request.params?.id ||
                request.params?.documentId ||
                request.body?.id ||
                'unknown';
        } else if (path.includes('/sla')) {
            entityType = AuditEntityType.SLA_RULE;
            entityId =
                request.params?.id || request.params?.stage || request.body?.stage || 'unknown';
        } else if (path.includes('/notifications')) {
            entityType = AuditEntityType.NOTIFICATION;
            entityId =
                request.params?.id ||
                request.params?.notificationId ||
                request.body?.id ||
                'unknown';
        }

        // Override action for specific routes
        if (path.includes('/approve')) {
            action = AuditActionType.APPROVE;
        } else if (path.includes('/reject')) {
            action = AuditActionType.REJECT;
        } else if (path.includes('/submit')) {
            action = AuditActionType.SUBMIT;
        } else if (path.includes('/upload')) {
            action = AuditActionType.UPLOAD;
        } else if (path.includes('/download')) {
            action = AuditActionType.DOWNLOAD;
        } else if (path.includes('/login')) {
            action = AuditActionType.LOGIN;
            entityType = AuditEntityType.USER;
            entityId = request.body?.email || request.user?.userId || 'unknown';
        } else if (path.includes('/logout')) {
            action = AuditActionType.LOGOUT;
            entityType = AuditEntityType.USER;
            entityId = request.user?.userId || 'unknown';
        }

        return { entityType, action, entityId };
    }

    /**
     * Extract changes from request and response
     */
    private extractChanges(method: string, body: any, _response: any): any {
        if (method === 'POST') {
            return { after: body };
        } else if (method === 'PUT' || method === 'PATCH') {
            return {
                after: body,
                // Note: before state should be captured by services, not interceptor
            };
        } else if (method === 'DELETE') {
            return { before: body };
        }
        return body;
    }

    /**
     * Create audit log (async, non-blocking)
     */
    private createAuditLog(data: any): void {
        try {
            // Fire and forget - don't await
            this.auditLogService.createAuditLog(data).catch((error) => {
                this.logger.error('Failed to create audit log from interceptor:', error);
            });
        } catch (error) {
            this.logger.error('Error in createAuditLog:', error);
        }
    }
}
