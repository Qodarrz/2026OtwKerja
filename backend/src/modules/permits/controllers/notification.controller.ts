import {
    Controller,
    Get,
    Param,
    Patch,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { ListNotificationsQuery } from '../services/notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    /**
     * GET /api/notifications
     * Get user notifications with pagination
     */
    @Get()
    async getNotifications(
        @Request() req: any,
        @Query() query: ListNotificationsQuery,
    ) {
        const userId = req.user.sub;
        return this.notificationService.getUserNotifications(userId, query);
    }

    /**
     * PATCH /api/notifications/:id/read
     * Mark as read
     */
    @Patch(':id/read')
    async markAsRead(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.sub;
        await this.notificationService.markAsRead(id, userId);
        return { message: 'Notification marked as read' };
    }

    /**
     * PATCH /api/notifications/read-all
     * Mark all as read
     */
    @Patch('read-all')
    async markAllAsRead(@Request() req: any) {
        const userId = req.user.sub;
        await this.notificationService.markAllAsRead(userId);
        return { message: 'All notifications marked as read' };
    }

    /**
     * GET /api/notifications/unread-count
     * Get unread count
     */
    @Get('unread-count')
    async getUnreadCount(@Request() req: any) {
        const userId = req.user.sub;
        const count = await this.notificationService.getUnreadCount(userId);
        return { count };
    }
}
