import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuditQueryService } from '../services/audit-query.service';
import type { AuditLogFilters } from '../dto/audit-log.dto';

interface ClientSubscription {
    filters?: AuditLogFilters;
}

@WebSocketGateway({
    namespace: '/audit-logs',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class AuditLogGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AuditLogGateway.name);
    private clientSubscriptions = new Map<string, ClientSubscription>();

    constructor(
        private jwtService: JwtService,
        private auditQueryService: AuditQueryService,
    ) {}

    /**
     * Handle client connection with JWT authentication
     */
    async handleConnection(client: Socket) {
        try {
            // Extract token from handshake
            const token =
                client.handshake.auth.token ||
                client.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(
                    `Client ${client.id} connection rejected: No token provided`,
                );
                client.disconnect();
                return;
            }

            // Verify JWT token
            const payload = this.jwtService.verify(token);

            // Check if user has ADMIN role
            if (!payload.roles || !payload.roles.includes('ADMIN')) {
                this.logger.warn(
                    `Client ${client.id} connection rejected: Not an admin`,
                );
                client.disconnect();
                return;
            }

            // Store user info in socket
            client.data.userId = payload.sub;
            client.data.email = payload.email;
            client.data.roles = payload.roles;

            this.logger.log(
                `Client ${client.id} connected (User: ${payload.email})`,
            );
        } catch (error) {
            this.logger.error(
                `Client ${client.id} authentication failed:`,
                error.message,
            );
            client.disconnect();
        }
    }

    /**
     * Handle client disconnection
     */
    handleDisconnect(client: Socket) {
        this.clientSubscriptions.delete(client.id);
        this.logger.log(`Client ${client.id} disconnected`);
    }

    /**
     * Subscribe to audit log updates with optional filters
     */
    @SubscribeMessage('subscribe')
    async handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() filters?: AuditLogFilters,
    ) {
        try {
            // Store subscription with filters
            this.clientSubscriptions.set(client.id, { filters });

            this.logger.log(
                `Client ${client.id} subscribed with filters:`,
                filters,
            );

            // Send initial data (last 100 audit logs)
            const initialData = await this.auditQueryService.queryAuditLogs({
                ...filters,
                page: 1,
                limit: 100,
            });

            client.emit('initial_data', initialData);

            return {
                success: true,
                message: 'Subscribed to audit log updates',
            };
        } catch (error) {
            this.logger.error(
                `Subscribe error for client ${client.id}:`,
                error.message,
            );
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Unsubscribe from audit log updates
     */
    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(@ConnectedSocket() client: Socket) {
        this.clientSubscriptions.delete(client.id);
        this.logger.log(`Client ${client.id} unsubscribed`);

        return {
            success: true,
            message: 'Unsubscribed from audit log updates',
        };
    }

    /**
     * Broadcast new audit log to all subscribed clients
     * Called by AuditLogService after creating a new audit log
     */
    broadcastNewAuditLog(auditLog: any) {
        let broadcastCount = 0;

        // Iterate through all subscribed clients
        this.clientSubscriptions.forEach((subscription, clientId) => {
            // Check if audit log matches client's filters
            if (this.matchesFilters(auditLog, subscription.filters)) {
                const client = this.server.sockets.sockets.get(clientId);
                if (client) {
                    client.emit('new_audit_log', auditLog);
                    broadcastCount++;
                }
            }
        });

        if (broadcastCount > 0) {
            this.logger.debug(
                `Broadcasted audit log ${auditLog.id} to ${broadcastCount} clients`,
            );
        }
    }

    /**
     * Check if audit log matches client filters
     */
    private matchesFilters(
        auditLog: any,
        filters?: AuditLogFilters,
    ): boolean {
        if (!filters) {
            return true; // No filters, match all
        }

        // Check entityType filter
        if (filters.entityType && auditLog.entityType !== filters.entityType) {
            return false;
        }

        // Check entityId filter
        if (filters.entityId && auditLog.entityId !== filters.entityId) {
            return false;
        }

        // Check action filter
        if (filters.action && auditLog.action !== filters.action) {
            return false;
        }

        // Check performedBy filter
        if (
            filters.performedBy &&
            auditLog.performedBy !== filters.performedBy
        ) {
            return false;
        }

        // Check date range filters
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (new Date(auditLog.createdAt) < startDate) {
                return false;
            }
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            if (new Date(auditLog.createdAt) > endDate) {
                return false;
            }
        }

        return true;
    }
}
