import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust for production
  },
  namespace: 'notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, userId: string) {
    client.join(`user_${userId}`);
    this.logger.log(`User ${userId} joined their notification room`);
  }
}
