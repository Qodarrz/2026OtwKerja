import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { Role } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: 'notifications',
  pingInterval: 25000,
  pingTimeout: 5000,
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  
  // Socket-to-user mapping for connection tracking
  private socketToUserMap = new Map<string, string>();
  
  // Connection metrics
  private totalConnections = 0;
  private activeConnections = 0;
  private connectionsByRole = new Map<Role, number>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Validate Origin header
      const origin = client.handshake.headers.origin;
      const allowedOrigins = process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL]
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

      if (!origin || !allowedOrigins.includes(origin)) {
        this.logger.warn(`Rejected connection from invalid origin: ${origin}`);
        client.emit('error', {
          code: 'INVALID_ORIGIN',
          message: 'Connection rejected: invalid origin',
        });
        client.disconnect(true);
        return;
      }

      // Extract token from handshake auth or authorization header
      const token = 
        client.handshake.auth?.token || 
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      // Validate token using JwtService
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'secretKey',
      });

      // Query user from database with id and roles
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, roles: true, email: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Store userId and roles in client.data
      client.data.userId = user.id;
      client.data.roles = user.roles;

      // Join user-specific room
      this.joinUserRoom(client, user.id);
      
      // Join role-based rooms
      this.joinRoleRooms(client, user.roles);
      
      // Store socket-to-user mapping for connection tracking
      this.socketToUserMap.set(client.id, user.id);

      // Update connection metrics
      this.totalConnections++;
      this.activeConnections++;
      user.roles.forEach((role) => {
        this.connectionsByRole.set(role, (this.connectionsByRole.get(role) || 0) + 1);
      });

      this.logger.log(
        `Client connected: ${client.id}, User: ${user.id}, Roles: ${user.roles.join(',')}, ` +
        `Total: ${this.totalConnections}, Active: ${this.activeConnections}, Timestamp: ${new Date().toISOString()}`
      );
    } catch (error) {
      // Emit error and disconnect if authentication fails
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.emit('error', { 
        code: 'AUTH_FAILED', 
        message: 'Authentication failed. Please log in again.' 
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketToUserMap.get(client.id);
    const roles = client.data.roles as Role[] || [];
    const reason = client.disconnected ? 'client_disconnect' : 'server_disconnect';
    
    // Remove socket-to-user mapping
    this.socketToUserMap.delete(client.id);
    
    // Update connection metrics
    this.activeConnections--;
    roles.forEach((role) => {
      const count = this.connectionsByRole.get(role) || 0;
      if (count > 0) {
        this.connectionsByRole.set(role, count - 1);
      }
    });
    
    this.logger.log(
      `Client disconnected: ${client.id}${userId ? `, User: ${userId}` : ''}, ` +
      `Reason: ${reason}, Active: ${this.activeConnections}, Timestamp: ${new Date().toISOString()}`
    );
  }

  /**
   * Join user to their personal notification room
   */
  private joinUserRoom(client: Socket, userId: string): void {
    const roomName = `user_${userId}`;
    client.join(roomName);
    this.logger.log(`User ${userId} joined room: ${roomName}`);
  }

  /**
   * Join user to all role-based rooms
   */
  private joinRoleRooms(client: Socket, roles: Role[]): void {
    roles.forEach((role) => {
      const roomName = `role_${role}`;
      client.join(roomName);
      this.logger.log(`User ${client.data.userId} joined role room: ${roomName}`);
    });
  }

  /**
   * Send real-time notification to a specific user
   */
  sendNotification(userId: string, data: any) {
    // In a real app, we would join the user to a room named by their userId
    this.server.to(`user_${userId}`).emit('new_notification', data);
    
    // For demo: broadcast to everyone if it's an escalation
    if (data.type === 'SLA_ESCALATION') {
      this.server.emit('admin_alert', data);
    }
  }

  /**
   * Send targeted message to a specific user
   */
  sendToUser(userId: string, event: string, payload: any): void {
    const startTime = Date.now();
    
    try {
      this.server.to(`user_${userId}`).emit(event, payload);
      
      const latency = Date.now() - startTime;
      this.logger.debug(`Message delivered to user ${userId}: ${event}, Latency: ${latency}ms`);
      
      if (latency > 1000) {
        this.logger.warn(
          `Slow message delivery: ${latency}ms for event ${event} to user ${userId}`
        );
      }
    } catch (error) {
      this.logger.error(`Failed to deliver message to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send broadcast message to all users with a specific role
   */
  sendToRole(role: Role, event: string, payload: any): void {
    const startTime = Date.now();
    
    try {
      this.server.to(`role_${role}`).emit(event, payload);
      
      const latency = Date.now() - startTime;
      this.logger.debug(`Message broadcast to role ${role}: ${event}, Latency: ${latency}ms`);
      
      if (latency > 1000) {
        this.logger.warn(
          `Slow message delivery: ${latency}ms for event ${event} to role ${role}`
        );
      }
    } catch (error) {
      this.logger.error(`Failed to broadcast message to role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Handle heartbeat ping from client
   */
  @SubscribeMessage('heartbeat_ping')
  handleHeartbeat(client: Socket): void {
    client.emit('heartbeat_pong', { timestamp: Date.now() });
  }

  /**
   * Get current connection metrics
   */
  getConnectionMetrics(): {
    totalConnections: number;
    activeConnections: number;
    connectionsByRole: Record<string, number>;
  } {
    const connectionsByRoleObj: Record<string, number> = {};
    this.connectionsByRole.forEach((count, role) => {
      connectionsByRoleObj[role] = count;
    });

    return {
      totalConnections: this.totalConnections,
      activeConnections: this.activeConnections,
      connectionsByRole: connectionsByRoleObj,
    };
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, userId: string) {
    client.join(`user_${userId}`);
    this.logger.log(`User ${userId} joined their notification room`);
  }
}
