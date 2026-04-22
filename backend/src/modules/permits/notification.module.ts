import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';

@Module({
    imports: [PrismaModule, MailerModule],
    controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}
