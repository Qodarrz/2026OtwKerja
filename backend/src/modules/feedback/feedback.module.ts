import { Module } from '@nestjs/common';
import { FeedbackService } from './services/feedback.service';
import { FeedbackController } from './controllers/feedback.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../permits/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
