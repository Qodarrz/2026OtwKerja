import {
    Controller,
    Get,
    Query,
    UseGuards,
    ParseIntPipe,
    DefaultValuePipe,
    Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AnalyticsService } from '../services/analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) { }

    /**
     * Get dashboard metrics
     * Staff and Admin can access
     */
    @Get('dashboard')
    @Roles(
        Role.ADMIN,
        Role.DOCUMENT_VALIDATOR,
        Role.FIELD_INSPECTOR,
        Role.LEGALIZER,
    )
    async getDashboardMetrics(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        return this.analyticsService.getDashboardMetrics(start, end);
    }

    /**
     * Get staff performance metrics
     * Admin only
     */
    @Get('staff-performance')
    @Roles(Role.ADMIN)
    async getStaffPerformance(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        return this.analyticsService.getStaffPerformance(start, end);
    }

    /**
     * Get stage bottleneck analysis
     * Admin only
     */
    @Get('bottlenecks')
    @Roles(Role.ADMIN)
    async getStageBottlenecks() {
        return this.analyticsService.getStageBottlenecks();
    }

    /**
     * Get monthly report
     * Admin only
     */
    @Get('monthly-report')
    @Roles(Role.ADMIN)
    async getMonthlyReport(
        @Query('year', ParseIntPipe) year: number,
        @Query('month', ParseIntPipe) month: number,
    ) {
        return this.analyticsService.getMonthlyReport(year, month);
    }

    @Get('user-dashboard')
    @Roles(Role.USER, Role.ADMIN)
    async getUserDashboard(@Req() req: any) {
        return this.analyticsService.getUserDashboardMetrics(req.user.userId);
    }

    /**
     * Get recent audit logs
     * Admin only
     */
    @Get('audit-logs')
    @Roles(Role.ADMIN)
    async getRecentAuditLogs(@Query('limit', ParseIntPipe) limit: number = 10) {
        return this.analyticsService.getRecentAuditLogs(limit);
    }

    /**
     * Get system health metrics
     * Admin only
     */
    @Get('health')
    @Roles(Role.ADMIN)
    async getSystemHealth() {
        return this.analyticsService.getSystemHealthMetrics();
    }

    /**
     * Get time-series metrics
     * Admin only
     * Query params: intervalHours (default 1), periodDays (default 7)
     */
    @Get('time-series')
    @Roles(Role.ADMIN)
    async getTimeSeries(
        @Query('intervalHours', new DefaultValuePipe(1), ParseIntPipe) intervalHours: number,
        @Query('periodDays', new DefaultValuePipe(7), ParseIntPipe) periodDays: number,
    ) {
        return this.analyticsService.getTimeSeriesMetrics(intervalHours, periodDays);
    }

    /**
     * Get current live metrics snapshot
     * Admin and staff roles
     */
    @Get('live')
    @Roles(
        Role.ADMIN,
        Role.DOCUMENT_VALIDATOR,
        Role.FIELD_INSPECTOR,
        Role.LEGALIZER,
    )
    async getLiveMetrics() {
        return this.analyticsService.getLiveMetrics();
    }
}
