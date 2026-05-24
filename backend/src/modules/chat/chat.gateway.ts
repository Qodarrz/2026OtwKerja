import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
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
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    server.use(async (client: Socket, next) => {
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
          return next(new Error('Authentication error'));
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
          return next(new Error('User not found'));
        }

        // Save user profile onto socket connection state
        client.data.user = user;
        next();
      } catch (e) {
        next(new Error('Authentication error'));
      }
    });
  }

  handleConnection(client: Socket) {
    // Connection established after middleware success
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

    // If session is still with BOT and sender is USER, generate AI reply
    if (session.status === 'BOT' && senderRole === 'USER') {
      const botReply = await this.chatService.generateBotReply(data.sessionId, data.content);
      if (botReply) {
        this.server.to(`session_${data.sessionId}`).emit('new_message', botReply);
        this.server.emit('ticket_activity', {
          sessionId: data.sessionId,
          latestMessage: botReply,
        });
      }
    }
  }

  // Gateway triggered broadcast for external actions (like controller resolves)
  emitSessionUpdated(sessionId: string, status: string, message: any, assignedTo?: any) {
    this.server.to(`session_${sessionId}`).emit('session_updated', { status, message, assignedTo });
    this.server.emit('ticket_activity', {
      sessionId,
      status,
      latestMessage: message,
      assignedTo,
    });
  }
}
