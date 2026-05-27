import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { NotificationService } from '../permits/services/notification.service';
import { NotificationGateway } from '../permits/gateways/notification.gateway';
import { NotificationType } from '@prisma/client';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(userId: string, dto: CreateFeedbackDto) {
    const application = await this.prisma.permitApplication.findUnique({
      where: { id: dto.applicationId },
    });

    if (!application) {
      throw new NotFoundException('Permit application not found');
    }

    return this.prisma.feedback.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        type: dto.type,
        applicationId: dto.applicationId,
        userId: userId,
      },
    });
  }

  async getByApplication(applicationId: string) {
    return this.prisma.feedback.findMany({
      where: { applicationId },
      include: {
        user: { select: { name: true } },
        respondedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllFeedbacks(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.feedback.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { name: true } },
          application: { select: { referenceNumber: true } },
          respondedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feedback.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async replyToFeedback(id: string, response: string, respondedById: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!feedback) throw new NotFoundException('Feedback not found');
    if (feedback.response) throw new NotFoundException('Feedback already responded');

    const updatedFeedback = await this.prisma.feedback.update({
      where: { id },
      data: {
        response,
        respondedAt: new Date(),
        respondedById,
      },
      include: { user: true, application: true },
    });

    // Send Notification
    const notification = await this.prisma.notification.create({
      data: {
        userId: feedback.userId,
        type: NotificationType.FEEDBACK_RESPONSE,
        title: 'Balasan Feedback',
        message: `Feedback Anda untuk permohonan ${feedback.application.referenceNumber} telah dibalas oleh Admin/CS.`,
        applicationId: feedback.applicationId,
      },
    });

    try {
      this.notificationGateway.sendToUser(feedback.userId, 'notification:feedback_response', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.createdAt.toISOString(),
        metadata: {
          applicationId: feedback.applicationId,
          referenceNumber: feedback.application.referenceNumber,
        },
      });
    } catch (error) {
      console.error('WebSocket delivery failed:', error);
    }

    return updatedFeedback;
  }

  async getStats() {
    const aggregations = await this.prisma.feedback.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      averageRating: aggregations._avg.rating || 0,
      totalFeedback: aggregations._count.id,
    };
  }
}
