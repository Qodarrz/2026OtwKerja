import { Controller, Post, Body, Get, Param, UseGuards, Request, Query } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ReplyFeedbackDto } from './dto/reply-feedback.dto';
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

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CS)
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.feedbackService.getAllFeedbacks(pageNum, limitNum);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.CS)
  reply(
    @Request() req: any,
    @Param('id') id: string,
    @Body() replyDto: ReplyFeedbackDto,
  ) {
    return this.feedbackService.replyToFeedback(id, replyDto.response, req.user.userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getStats() {
    return this.feedbackService.getStats();
  }
}
