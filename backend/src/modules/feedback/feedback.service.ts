import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

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
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
