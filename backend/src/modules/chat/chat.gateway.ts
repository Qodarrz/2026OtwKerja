import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      let token: string | null = null;
      
      // 1. Try to extract from Cookie header
      const cookies = client.handshake.headers.cookie;
      if (cookies) {
        const match = cookies.match(/access_token=([^;]+)/);
        if (match) {
          token = match[1];
        }
      }

      // 2. Try to extract from Auth options
      if (!token && client.handshake.auth?.token) {
        token = client.handshake.auth.token;
      }

      // 3. Try to extract from Query parameters
      if (!token && client.handshake.query?.token) {
        token = client.handshake.query.token as string;
      }

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify token
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'secretKey',
      });

      // Fetch user from DB
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, roles: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      // Save user profile onto socket connection state
      client.data.user = user;
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Socket disconnected
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const session = await this.chatService.getSessionById(data.sessionId);
    
    // Authorization: User must be owner or internal staff
    const internalRoles = [Role.ADMIN, Role.CS];
    const isInternal = user.roles.some((role: any) => internalRoles.includes(role));

    if (session.userId !== user.id && !isInternal) {
      client.emit('error', { message: 'Akses ditolak' });
      return;
    }

    // Join room
    client.join(`session_${data.sessionId}`);
  }

  @SubscribeMessage('leave_session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    client.leave(`session_${data.sessionId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; content: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    const session = await this.chatService.getSessionById(data.sessionId);
    
    // Determine sender details
    const internalRoles = [Role.ADMIN, Role.CS];
    const isInternal = user.roles.some((role: any) => internalRoles.includes(role));
    
    const senderRole = isInternal ? 'ADMIN' : 'USER';
    const senderName = user.name || 'Citizen';

    // Create and save message in database
    const savedMessage = await this.chatService.createMessage(
      data.sessionId,
      user.id,
      senderName,
      senderRole,
      data.content,
    );

    // Broadcast to the chat room
    this.server.to(`session_${data.sessionId}`).emit('new_message', savedMessage);

    // Broadcast to all staff that an update has occurred (for list update in real-time)
    this.server.emit('ticket_activity', {
      sessionId: data.sessionId,
      latestMessage: savedMessage,
    });
  }

  // Gateway triggered broadcast for external actions (like controller resolves)
  emitSessionUpdated(sessionId: string, status: string, message: any) {
    this.server.to(`session_${sessionId}`).emit('session_updated', { status, message });
    this.server.emit('ticket_activity', {
      sessionId,
      status,
      latestMessage: message,
    });
  }
}
