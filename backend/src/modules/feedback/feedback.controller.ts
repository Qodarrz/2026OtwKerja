import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbackService.create(req.user.userId, createFeedbackDto);
  }

  @Get('application/:id')
  @UseGuards(JwtAuthGuard)
  getByApplication(@Param('id') id: string) {
    return this.feedbackService.getByApplication(id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getStats() {
    return this.feedbackService.getStats();
  }
}
