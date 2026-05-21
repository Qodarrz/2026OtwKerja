import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { PermitService } from '../services/permit.service';
import { TaxCalculatorService } from '../services/tax-calculator.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
    CreateApplicationDto,
    UpdateApplicationDto,
    ListApplicationsQuery,
} from '../dto/permit.dto';

@Controller('permits/applications')
@UseGuards(JwtAuthGuard)
export class PermitController {
    constructor(
        private readonly permitService: PermitService,
        private readonly taxCalculatorService: TaxCalculatorService,
    ) { }

    /**
     * POST /api/permits/applications
     * Create draft application
     */
    @Post()
    async createApplication(
        @Request() req: any,
        @Body() dto: CreateApplicationDto,
    ) {
        const userId = req.user.sub;
        return this.permitService.createApplication(userId, dto);
    }

    /**
     * GET /api/permits/applications
     * List applications with filters
     */
    @Get()
    async listApplications(
        @Request() req: any,
        @Query() query: ListApplicationsQuery,
    ) {
        const userId = req.user.sub;
        return this.permitService.listApplications(userId, query);
    }

    /**
     * GET /api/permits/applications/schemas
     * Get permit schemas (dynamic form definitions)
     */
    @Get('schemas')
    async getSchemas() {
        return this.permitService.getSchemas();
    }

    /**
     * GET /api/permits/applications/search
     * Search across ALL applications (staff/admin).
     * Must be declared before `:id` to avoid NestJS treating "search" as an ID.
     */
    @Get('search')
    async searchApplications(
        @Request() req: any,
        @Query() query: ListApplicationsQuery,
    ) {
        const userId = req.user.sub;
        return this.permitService.searchApplications(userId, query);
    }

    /**
     * GET /api/permits/applications/:id
     * Get application details
     */
    @Get(':id')
    async getApplication(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.sub;
        return this.permitService.getApplication(id, userId);
    }

    /**
     * PATCH /api/permits/applications/:id
     * Update draft application
     */
    @Patch(':id')
    async updateApplication(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateApplicationDto,
    ) {
        const userId = req.user.sub;
        return this.permitService.updateApplication(id, userId, dto);
    }

    /**
     * DELETE /api/permits/applications/:id
     * Delete draft application
     */
    @Delete(':id')
    async deleteApplication(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.sub;
        return this.permitService.deleteApplication(id, userId);
    }

    /**
     * POST /api/permits/applications/:id/submit
     * Submit for review
     */
    @Post(':id/submit')
    async submitApplication(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.sub;
        return this.permitService.submitApplication(id, userId);
    }

    /**
     * POST /api/permits/applications/:id/calculate-tax
     * Calculate tax breakdown
     */
    @Post(':id/calculate-tax')
    async calculateTax(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.sub;
        const application = await this.permitService.getApplication(id, userId);

        const taxResult = this.taxCalculatorService.calculateTax({
            permitType: application.permitType,
            landSize: application.landSize || undefined,
            njopValue: application.njopValue || undefined,
            isStrategicLocation: application.isStrategicLocation || undefined,
            landType: application.landType || undefined,
            buildingHeight: application.buildingHeight || undefined,
            estimatedEmployees: application.estimatedEmployees || undefined,
        });

        return taxResult;
    }

    /**
     * POST /api/permits/applications/:id/resubmit
     * Resubmit rejected application
     */
    @Post(':id/resubmit')
    async resubmitApplication(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateApplicationDto,
    ) {
        const userId = req.user.sub;
        return this.permitService.resubmitApplication(id, userId, dto);
    }
}
