import { Controller, Get, Query, Param } from '@nestjs/common';
import { TransparencyService } from '../services/transparency.service';

/**
 * Public Transparency Controller
 * No authentication required - provides public access to transparency data
 */
@Controller('public/transparency')
export class TransparencyController {
    constructor(private transparencyService: TransparencyService) { }

    /**
     * Get public dashboard metrics
     * Shows aggregate statistics for transparency
     * No authentication required
     */
    @Get('dashboard')
    async getPublicDashboard(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        return this.transparencyService.getPublicDashboardMetrics(start, end);
    }

    /**
     * Get application status by reference number
     * Public endpoint for applicants to check status
     * No authentication required
     */
    @Get('status/:referenceNumber')
    async getApplicationStatus(@Param('referenceNumber') referenceNumber: string) {
        const status = await this.transparencyService.getApplicationStatusPublic(
            referenceNumber,
        );

        if (!status) {
            return {
                error: 'Application not found',
                message: 'No application found with the provided reference number',
            };
        }

        return status;
    }

    /**
     * Get process transparency metrics
     * Shows how each stage performs
     * No authentication required
     */
    @Get('process')
    async getProcessTransparency() {
        return this.transparencyService.getProcessTransparency();
    }
}
