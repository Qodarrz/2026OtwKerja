import {
    Controller,
    Get,
    Query,
    Res,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ReportExportService } from '../services/report-export.service';
import type { ExportFilters } from '../services/report-export.service';

@Controller('permits/export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
    constructor(private reportExportService: ReportExportService) {}

    /**
     * Export permit applications to PDF
     * GET /permits/export/pdf?status=APPROVED&startDate=2026-01-01
     */
    @Get('pdf')
    @Roles(Role.ADMIN, Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER)
    async exportToPDF(@Query() filters: ExportFilters, @Res() res: Response) {
        const pdf = await this.reportExportService.exportToPDF(filters);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="permit-applications-${Date.now()}.pdf"`,
        );

        res.status(HttpStatus.OK).send(pdf);
    }

    /**
     * Export permit applications to Excel
     * GET /permits/export/excel?status=APPROVED&startDate=2026-01-01
     */
    @Get('excel')
    @Roles(Role.ADMIN, Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER)
    async exportToExcel(
        @Query() filters: ExportFilters,
        @Res() res: Response,
    ) {
        const excel = await this.reportExportService.exportToExcel(filters);

        // Set headers for Excel download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="permit-applications-${Date.now()}.xlsx"`,
        );

        res.status(HttpStatus.OK).send(excel);
    }
}
