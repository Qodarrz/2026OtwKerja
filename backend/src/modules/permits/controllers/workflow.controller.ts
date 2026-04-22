import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { WorkflowService } from '../services/workflow.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type {
    ApproveApplicationDto,
    RejectApplicationDto,
} from '../services/workflow.service';

@Controller('permits/applications')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
    constructor(private readonly workflowService: WorkflowService) { }

    /**
     * POST /api/permits/applications/:id/approve
     * Approve at current stage
     */
    @Post(':id/approve')
    async approveApplication(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: ApproveApplicationDto,
    ) {
        const userId = req.user.sub;
        return this.workflowService.approveApplication(id, userId, dto);
    }

    /**
     * POST /api/permits/applications/:id/reject
     * Reject application
     */
    @Post(':id/reject')
    async rejectApplication(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: RejectApplicationDto,
    ) {
        const userId = req.user.sub;
        return this.workflowService.rejectApplication(id, userId, dto);
    }

    /**
     * GET /api/permits/applications/:id/history
     * Get stage history
     */
    @Get(':id/history')
    async getStageHistory(@Param('id') id: string) {
        return this.workflowService.getStageHistory(id);
    }

    /**
     * GET /api/permits/applications/:id/validation-actions
     * Get validation actions
     */
    @Get(':id/validation-actions')
    async getValidationActions(@Param('id') id: string) {
        return this.workflowService.getValidationActions(id);
    }
}
