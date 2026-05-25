import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatSessionStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  async getOrCreateSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const userName = user?.name || 'Citizen';

    let session = await this.prisma.chatSession.findFirst({
      where: {
        userId,
        status: {
          in: [ChatSessionStatus.BOT, ChatSessionStatus.OPEN],
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: {
          userId,
          status: ChatSessionStatus.BOT,
          messages: {
            create: [
              {
                senderName: 'Virtual Assistant',
                senderRole: 'BOT',
                content: `Halo ${userName}! Saya adalah asisten virtual FlowGov. Ada yang bisa saya bantu hari ini?`,
              },
            ],
          },
        },
        include: {
          messages: true,
        },
      });
    }

    return session;
  }

  async getSessionById(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Sesi chat tidak ditemukan');
    }

    return session;
  }

  async createMessage(sessionId: string, senderId: string | null, senderName: string, senderRole: string, content: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Sesi chat tidak ditemukan');
    }

    if (session.status === ChatSessionStatus.RESOLVED) {
      throw new ForbiddenException('Sesi chat ini sudah diselesaikan');
    }

    // Save message and update session's updatedAt time
    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          sessionId,
          senderId,
          senderName,
          senderRole,
          content,
        },
      }),
      this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return message;
  }

  async escalateToCS(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Sesi chat tidak ditemukan');
    }

    if (session.status === ChatSessionStatus.RESOLVED) {
      throw new ForbiddenException('Sesi chat ini sudah diselesaikan');
    }

    // Update status to OPEN and append system messages
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: ChatSessionStatus.OPEN,
        messages: {
          create: [
            {
              senderName: 'Sistem',
              senderRole: 'BOT',
              content: 'Permintaan Anda telah dialihkan ke Customer Service. Mohon tunggu beberapa saat staf kami akan segera membalas pesan Anda.',
            },
          ],
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getAllSessionsForCS() {
    return this.prisma.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50, // Limit message history size on initial load
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async assignSession(sessionId: string, agentId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Sesi chat tidak ditemukan');
    }

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        assignedToId: agentId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async resolveSession(sessionId: string, resolverName: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Sesi chat tidak ditemukan');
    }

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: ChatSessionStatus.RESOLVED,
        messages: {
          create: [
            {
              senderName: 'Sistem',
              senderRole: 'BOT',
              content: `Sesi obrolan bantuan telah diselesaikan oleh ${resolverName}. Terima kasih telah menggunakan layanan FlowGov.`,
            },
          ],
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async generateBotReply(sessionId: string, userMessage: string) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY')?.trim();
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is not set.");
      return null;
    }

    try {
      // Get conversation history for context
      const session = await this.prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10, // context window
          }
        }
      });

      const messages = [
        {
          role: "system",
          content: "You are a helpful and professional customer service virtual assistant for FlowGov, an e-government permit portal. Answer questions briefly, politely, and use Indonesian language."
        },
        ...(session?.messages.map(m => ({
          role: m.senderRole === 'USER' ? 'user' : 'assistant',
          content: m.content
        })) || []),
        { role: "user", content: userMessage }
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3001",
          "X-Title": "FlowGov Portal"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          messages: messages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter failed with status ${response.status}. API Key length: ${apiKey?.length}. Error body:`, errorText);
        throw new Error(`OpenRouter error: ${response.statusText}`);
      }

      const data = await response.json();
      const botResponse = data.choices[0]?.message?.content || "Maaf, saya tidak dapat merespons saat ini.";

      return await this.createMessage(
        sessionId,
        null,
        'Virtual Assistant',
        'BOT',
        botResponse
      );

    } catch (error) {
      console.error("Failed to generate bot reply via OpenRouter:", error);
      return null;
    }
  }

  async generateGuestBotReply(userMessage: string, history: any[]) {
    const apiKey = this.configService.get<string>('API_KEY')?.trim() || this.configService.get<string>('OPENROUTER_API_KEY')?.trim();
    if (!apiKey) {
      console.warn("OPENROUTER_API_KEY is not set.");
      return null;
    }

    try {
      const messages = [
        {
          role: "system",
          content: "You are a helpful and professional customer service virtual assistant for FlowGov, an e-government permit portal. Answer questions briefly, politely, and use Indonesian language."
        },
        ...(history || []).slice(-10).map((m: any) => ({
          role: m.senderRole === 'USER' ? 'user' : 'assistant',
          content: m.content
        })),
        { role: "user", content: userMessage }
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3001",
          "X-Title": "FlowGov Portal"
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-super-120b-a12b:free",
          messages: messages
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter error: ${response.statusText}`);
      }

      const data = await response.json();
      const botResponse = data.choices[0]?.message?.content || "Maaf, saya tidak dapat merespons saat ini.";

      return {
        senderName: 'Virtual Assistant',
        senderRole: 'BOT',
        content: botResponse,
        createdAt: new Date(),
      };

    } catch (error) {
      console.error("Failed to generate guest bot reply via OpenRouter:", error);
      return {
        senderName: 'Virtual Assistant',
        senderRole: 'BOT',
        content: "Maaf, terjadi kesalahan saat menghubungi asisten virtual.",
        createdAt: new Date(),
      };
    }
  }
}
