import {
    Controller,
    Get,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ReportingService } from '../services/reporting.service';

@Controller('reporting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportingController {
    constructor(private reportingService: ReportingService) { }

    /**
     * Get trend analysis over time
     * Admin only
     */
    @Get('trends')
    @Roles(Role.ADMIN)
    async getTrendAnalysis(@Query('months', ParseIntPipe) months: number = 6) {
        return this.reportingService.getTrendAnalysis(months);
    }

    /**
     * Get detailed bottleneck report
     * Admin only
     */
    @Get('bottlenecks')
    @Roles(Role.ADMIN)
    async getBottleneckReport() {
        return this.reportingService.getBottleneckReport();
    }

    /**
     * Get performance comparison (current vs previous month)
     * Admin only
     */
    @Get('performance-comparison')
    @Roles(Role.ADMIN)
    async getPerformanceComparison() {
        return this.reportingService.getPerformanceComparison();
    }

    /**
     * Get executive summary report
     * Admin only
     */
    @Get('executive-summary')
    @Roles(Role.ADMIN)
    async getExecutiveSummary() {
        return this.reportingService.getExecutiveSummary();
    }
}
