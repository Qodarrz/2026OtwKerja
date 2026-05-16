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
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BottleneckEvent, WorkflowStage, BottleneckSeverity } from '@prisma/client';

interface SubscriptionFilters {
    stages?: WorkflowStage[];
    minSeverity?: BottleneckSeverity;
}

interface ClientSubscription {
    filters?: SubscriptionFilters;
}

interface MetricsUpdatedPayload {
    stage: WorkflowStage;
    currentScore: number;
    metrics: Record<string, unknown>;
}

/** Severity order for minSeverity filtering (lower index = lower severity) */
const SEVERITY_ORDER: BottleneckSeverity[] = ['LOW', 'MEDIUM', 'HIGH'];

@WebSocketGateway({
    namespace: '/bottlenecks',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class BottleneckGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(BottleneckGateway.name);
    private clientSubscriptions = new Map<string, ClientSubscription>();

    constructor(private jwtService: JwtService) {}

    /**
     * Handle client connection with JWT authentication.
     * Accepts ADMIN, DOCUMENT_VALIDATOR, FIELD_INSPECTOR, and LEGALIZER roles.
     */
    async handleConnection(client: Socket) {
        try {
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

            const payload = this.jwtService.verify(token);

            const allowedRoles = [
                'ADMIN',
                'DOCUMENT_VALIDATOR',
                'FIELD_INSPECTOR',
                'LEGALIZER',
            ];

            const hasRole =
                payload.roles &&
                payload.roles.some((r: string) => allowedRoles.includes(r));

            if (!hasRole) {
                this.logger.warn(
                    `Client ${client.id} connection rejected: Insufficient role`,
                );
                client.disconnect();
                return;
            }

            client.data.userId = payload.sub;
            client.data.email = payload.email;
            client.data.roles = payload.roles;

            this.logger.log(
                `Client ${client.id} connected (User: ${payload.email})`,
            );
        } catch (error) {
            this.logger.error(
                `Client ${client.id} authentication failed: ${error.message}`,
            );
            client.disconnect();
        }
    }

    /**
     * Handle client disconnection — clean up subscription and rooms.
     */
    handleDisconnect(client: Socket) {
        this.clientSubscriptions.delete(client.id);
        this.logger.log(`Client ${client.id} disconnected`);
    }

    /**
     * Subscribe to real-time bottleneck updates with optional stage/severity filters.
     * Clients are joined to stage-specific rooms for efficient broadcasting.
     *
     * Payload example:
     * { "filters": { "stages": ["DOCUMENT_CHECK"], "minSeverity": "MEDIUM" } }
     */
    @SubscribeMessage('subscribe')
    async handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload?: { filters?: SubscriptionFilters },
    ) {
        try {
            const filters = payload?.filters;

            this.clientSubscriptions.set(client.id, { filters });

            // Join stage-specific rooms for targeted broadcasting
            if (filters?.stages && filters.stages.length > 0) {
                for (const stage of filters.stages) {
                    await client.join(`stage:${stage}`);
                }
            } else {
                // No stage filter — join the global room
                await client.join('stage:ALL');
            }

            this.logger.log(
                `Client ${client.id} subscribed with filters: ${JSON.stringify(filters)}`,
            );

            return {
                success: true,
                message: 'Subscribed to bottleneck updates',
            };
        } catch (error) {
            this.logger.error(
                `Subscribe error for client ${client.id}: ${error.message}`,
            );
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Unsubscribe from bottleneck updates and leave all stage rooms.
     */
    @SubscribeMessage('unsubscribe')
    async handleUnsubscribe(@ConnectedSocket() client: Socket) {
        this.clientSubscriptions.delete(client.id);

        // Leave all stage rooms
        const rooms = Array.from(client.rooms).filter((r) =>
            r.startsWith('stage:'),
        );
        for (const room of rooms) {
            await client.leave(room);
        }

        this.logger.log(`Client ${client.id} unsubscribed`);

        return {
            success: true,
            message: 'Unsubscribed from bottleneck updates',
        };
    }

    // ─── Server-to-client broadcast methods ────────────────────────────────────

    /**
     * Broadcast a newly detected bottleneck to all subscribed clients
     * whose filters match the event.
     * Called by BottleneckAlertService.
     */
    broadcastBottleneckDetected(bottleneck: BottleneckEvent): void {
        let count = 0;

        this.clientSubscriptions.forEach((subscription, clientId) => {
            if (this.matchesFilters(bottleneck, subscription.filters)) {
                const socket = this.server.sockets.sockets.get(clientId);
                if (socket) {
                    socket.emit('bottleneck_detected', bottleneck);
                    count++;
                }
            }
        });

        if (count > 0) {
            this.logger.debug(
                `Broadcasted bottleneck_detected (${bottleneck.id}) to ${count} client(s)`,
            );
        }
    }

    /**
     * Broadcast a resolved bottleneck to all subscribed clients
     * whose filters match the event.
     * Called by BottleneckAlertService.
     */
    broadcastBottleneckResolved(bottleneck: BottleneckEvent): void {
        let count = 0;

        this.clientSubscriptions.forEach((subscription, clientId) => {
            if (this.matchesFilters(bottleneck, subscription.filters)) {
                const socket = this.server.sockets.sockets.get(clientId);
                if (socket) {
                    socket.emit('bottleneck_resolved', bottleneck);
                    count++;
                }
            }
        });

        if (count > 0) {
            this.logger.debug(
                `Broadcasted bottleneck_resolved (${bottleneck.id}) to ${count} client(s)`,
            );
        }
    }

    /**
     * Broadcast real-time metrics update for the dashboard.
     * Called by BottleneckAlertService or the detection processor.
     */
    broadcastMetricsUpdated(payload: MetricsUpdatedPayload): void {
        let count = 0;

        this.clientSubscriptions.forEach((subscription, clientId) => {
            // For metrics updates, only filter by stage (no severity filter)
            const filters = subscription.filters;
            const stageMatches =
                !filters?.stages ||
                filters.stages.length === 0 ||
                filters.stages.includes(payload.stage);

            if (stageMatches) {
                const socket = this.server.sockets.sockets.get(clientId);
                if (socket) {
                    socket.emit('metrics_updated', payload);
                    count++;
                }
            }
        });

        if (count > 0) {
            this.logger.debug(
                `Broadcasted metrics_updated for stage ${payload.stage} to ${count} client(s)`,
            );
        }
    }

    // ─── Private helpers ────────────────────────────────────────────────────────

    /**
     * Check whether a bottleneck event matches a client's subscription filters.
     */
    private matchesFilters(
        bottleneck: BottleneckEvent,
        filters?: SubscriptionFilters,
    ): boolean {
        if (!filters) {
            return true;
        }

        // Stage filter
        if (
            filters.stages &&
            filters.stages.length > 0 &&
            !filters.stages.includes(bottleneck.stage)
        ) {
            return false;
        }

        // Minimum severity filter
        if (filters.minSeverity) {
            const minIndex = SEVERITY_ORDER.indexOf(filters.minSeverity);
            const eventIndex = SEVERITY_ORDER.indexOf(bottleneck.severity);
            if (eventIndex < minIndex) {
                return false;
            }
        }

        return true;
    }
}
