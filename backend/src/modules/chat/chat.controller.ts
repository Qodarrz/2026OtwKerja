import { Controller, Post, Get, Patch, Param, UseGuards, Request, ForbiddenException, Inject, forwardRef, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  // Citizens: Get or create active session
  @Post('sessions')
  @UseGuards(JwtAuthGuard)
  async getOrCreateSession(@Request() req: any) {
    return this.chatService.getOrCreateSession(req.user.userId);
  }

  // Citizens: Get active session
  @Get('sessions/my-active')
  @UseGuards(JwtAuthGuard)
  async getMyActiveSession(@Request() req: any) {
    return this.chatService.getOrCreateSession(req.user.userId);
  }

  // Admin/Staff: Get all chat sessions
  @Get('sessions/admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CS, Role.ADMIN)
  async getAllSessionsForCS() {
    return this.chatService.getAllSessionsForCS();
  }

  // Citizens & Admin/Staff: Get detail by sessionId
  @Get('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  async getSessionById(@Param('sessionId') sessionId: string, @Request() req: any) {
    const session = await this.chatService.getSessionById(sessionId);
    
    // Check access rights: either the user is the owner, or is CS / ADMIN
    const internalRoles = [Role.CS, Role.ADMIN];
    const isInternal = req.user.roles.some((role: any) => internalRoles.includes(role));
    
    if (session.userId !== req.user.userId && !isInternal) {
      throw new ForbiddenException('Anda tidak memiliki akses ke sesi chat ini');
    }

    return session;
  }

  // Citizens: Escalate chatbot session to Customer Service (Live Chat)
  @Patch('sessions/:sessionId/escalate')
  @UseGuards(JwtAuthGuard)
  async escalateToCS(@Param('sessionId') sessionId: string, @Request() req: any) {
    const session = await this.chatService.getSessionById(sessionId);
    if (session.userId !== req.user.userId) {
      throw new ForbiddenException('Anda tidak diizinkan mengubah sesi ini');
    }
    const updatedSession = await this.chatService.escalateToCS(sessionId);
    const systemMsg = updatedSession.messages[updatedSession.messages.length - 1];
    
    // Broadcast status change in real-time
    this.chatGateway.emitSessionUpdated(sessionId, 'OPEN', systemMsg);
    
    return updatedSession;
  }

  // Admin/Staff: Assign ticket to self
  @Patch('sessions/:sessionId/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CS, Role.ADMIN)
  async assignSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    const session = await this.chatService.assignSession(sessionId, req.user.userId);
    
    // Send system message that staff has joined the chat
    const staffName = session.assignedTo?.name || 'Customer Service';
    const message = await this.chatService.createMessage(
      sessionId,
      req.user.userId,
      'Sistem',
      'BOT',
      `${staffName} bergabung ke percakapan untuk membantu Anda.`,
    );

    this.chatGateway.emitSessionUpdated(sessionId, 'OPEN', message, session.assignedTo);
    
    return session;
  }

  @Patch('sessions/:sessionId/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CS, Role.ADMIN)
  async resolveSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    const session = await this.chatService.getSessionById(sessionId);
    if (!session.assignedToId) {
      await this.chatService.assignSession(sessionId, req.user.userId);
    }
    
    const userProfile = session.assignedTo || { name: 'Customer Service' };
    const agentName = userProfile.name || 'Customer Service';
    
    const updatedSession = await this.chatService.resolveSession(sessionId, agentName);
    const systemMsg = updatedSession.messages[updatedSession.messages.length - 1];
    
    // Broadcast resolved status in real-time
    this.chatGateway.emitSessionUpdated(sessionId, 'RESOLVED', systemMsg);
    
    return updatedSession;
  }

  // Guest AI Chat (No authentication required)
  @Post('guest')
  async guestChat(@Body() body: { message: string, history: any[] }) {
    return this.chatService.generateGuestBotReply(body.message, body.history);
  }
}
