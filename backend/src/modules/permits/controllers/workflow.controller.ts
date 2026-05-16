import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { WorkflowService } from '../services/workflow.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type {
    ApproveApplicationDto,
    RejectApplicationDto,
} from '../services/workflow.service';
import { BatchApproveDto, BatchRejectDto } from '../dto/batch.dto';

@Controller('permits/applications')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowService) { }

    @Post('batch/approve')
    async batchApprove(
        @Request() req: any,
        @Body() dto: BatchApproveDto,
    ) {
        const userId = req.user.sub;
        const results = await this.workflowService.batchApprove(userId, dto.items);
        return {
            total: dto.items.length,
            succeeded: results.succeeded.length,
            failed: results.failed.length,
            results,
        };
    }

    @Post('batch/reject')
    async batchReject(
        @Request() req: any,
        @Body() dto: BatchRejectDto,
    ) {
        const userId = req.user.sub;
        const results = await this.workflowService.batchReject(userId, dto.items);
        return {
            total: dto.items.length,
            succeeded: results.succeeded.length,
            failed: results.failed.length,
            results,
        };
    }

    @Post(':id/approve')
    async approveApplication(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: ApproveApplicationDto,
    ) {
        const userId = req.user.sub;
        return this.workflowService.approveApplication(id, userId, dto);
    }

    @Post(':id/reject')
    async rejectApplication(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: RejectApplicationDto,
    ) {
        const userId = req.user.sub;
        return this.workflowService.rejectApplication(id, userId, dto);
    }

    @Get(':id/history')
    async getStageHistory(@Param('id') id: string) {
        return this.workflowService.getStageHistory(id);
    }

    @Get(':id/validation-actions')
    async getValidationActions(@Param('id') id: string) {
        return this.workflowService.getValidationActions(id);
    }
    
    @Get('staff/tasks')
    async getStaffTasks(
        @Request() req: any,
        @Query() query: any, // Use any or define a proper DTO if needed
    ) {
        const userId = req.user.sub;
        return this.workflowService.getApplicationsForStaff(userId, query);
    }
}
