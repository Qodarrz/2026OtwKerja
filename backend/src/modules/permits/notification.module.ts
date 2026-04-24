import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';
import { NotificationService } from './services/notification.service';
import { NotificationGateway } from './gateways/notification.gateway';
import { NotificationController } from './controllers/notification.controller';

@Module({
    imports: [PrismaModule, MailerModule],
    controllers: [NotificationController],
    providers: [NotificationService, NotificationGateway],
    exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
