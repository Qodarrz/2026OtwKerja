import {
    Controller,
    Get,
    Query,
    UseGuards,
    Param,
    Patch,
    Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role, WorkflowStage } from '@prisma/client';
import { SLAService } from '../services/sla.service';

@Controller('sla')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SLAController {
    constructor(private slaService: SLAService) { }

    /**
     * Get all SLA rules
     * Admin only
     */
    @Get('rules')
    @Roles(Role.ADMIN)
    async getSLARules() {
        return this.slaService.getAllSLARules();
    }

    /**
     * Update SLA rule for a stage
     * Admin only
     */
    @Patch('rules/:stage')
    @Roles(Role.ADMIN)
    async updateSLARule(
        @Param('stage') stage: WorkflowStage,
        @Body() body: { maxDurationHours: number; warningThreshold?: number },
    ) {
        return this.slaService.updateSLARule(
            stage,
            body.maxDurationHours,
            body.warningThreshold,
        );
    }

    /**
     * Get SLA statistics
     * Staff and Admin can access
     */
    @Get('statistics')
    @Roles(
        Role.ADMIN,
        Role.DOCUMENT_VALIDATOR,
        Role.FIELD_INSPECTOR,
        Role.LEGALIZER,
    )
    async getSLAStatistics(
        @Query('stage') stage?: WorkflowStage,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        return this.slaService.getSLAStatistics(stage, start, end);
    }

    /**
     * Get overdue applications
     * Staff and Admin can access
     */
    @Get('overdue')
    @Roles(
        Role.ADMIN,
        Role.DOCUMENT_VALIDATOR,
        Role.FIELD_INSPECTOR,
        Role.LEGALIZER,
    )
    async getOverdueApplications(@Query('stage') stage?: WorkflowStage) {
        return this.slaService.getOverdueApplications(stage);
    }

    /**
     * Get applications with SLA warnings
     * Staff and Admin can access
     */
    @Get('warnings')
    @Roles(
        Role.ADMIN,
        Role.DOCUMENT_VALIDATOR,
        Role.FIELD_INSPECTOR,
        Role.LEGALIZER,
    )
    async getWarningApplications(@Query('stage') stage?: WorkflowStage) {
        return this.slaService.getWarningApplications(stage);
    }

    /**
     * Manually trigger SLA status update for all active stages
     * Admin only
     */
    @Patch('update-statuses')
    @Roles(Role.ADMIN)
    async updateActiveSLAStatuses() {
        return this.slaService.updateActiveSLAStatuses();
    }
}
