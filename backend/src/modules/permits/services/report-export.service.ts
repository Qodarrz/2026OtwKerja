import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, PermitType } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

export interface ExportFilters {
    status?: WorkflowStage;
    permitType?: PermitType;
    startDate?: string;
    endDate?: string;
    applicantId?: string;
}

@Injectable()
export class ReportExportService {
    constructor(private prisma: PrismaService) {}

    /**
     * Export permit applications to PDF
     */
    async exportToPDF(filters: ExportFilters): Promise<Buffer> {
        // Fetch applications with filters
        const applications = await this.fetchApplications(filters);

        if (applications.length === 0) {
            throw new BadRequestException('No applications found for export');
        }

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('Permit Applications Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, {
                align: 'center',
            });
            doc.moveDown();

            // Filters summary
            if (Object.keys(filters).length > 0) {
                doc.fontSize(12).text('Filters Applied:', { underline: true });
                if (filters.status) doc.text(`Status: ${filters.status}`);
                if (filters.permitType) doc.text(`Permit Type: ${filters.permitType}`);
                if (filters.startDate) doc.text(`Start Date: ${filters.startDate}`);
                if (filters.endDate) doc.text(`End Date: ${filters.endDate}`);
                doc.moveDown();
            }

            // Summary statistics
            doc.fontSize(12).text('Summary:', { underline: true });
            doc.text(`Total Applications: ${applications.length}`);
            const byStatus = this.groupBy(applications, 'status');
            Object.entries(byStatus).forEach(([status, count]) => {
                doc.text(`  ${status}: ${count}`);
            });
            doc.moveDown();

            // Applications table
            doc.fontSize(14).text('Applications:', { underline: true });
            doc.moveDown(0.5);

            applications.forEach((app, index) => {
                // Check if we need a new page
                if (doc.y > 700) {
                    doc.addPage();
                }

                doc.fontSize(11).text(`${index + 1}. ${app.referenceNumber || 'DRAFT'}`, {
                    continued: true,
                });
                doc.fontSize(9).text(` (${app.permitType})`, { align: 'left' });

                doc.fontSize(9);
                doc.text(`   Applicant: ${app.applicant.name} (${app.applicant.email})`);
                doc.text(`   Status: ${app.status}`);
                doc.text(
                    `   Submitted: ${app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Not submitted'}`,
                );

                if (app.permitType === PermitType.BUILDING_PERMIT) {
                    doc.text(`   Location: ${app.locationAddress || 'N/A'}`);
                    doc.text(`   Land Size: ${app.landSize || 'N/A'} m²`);
                } else if (app.permitType === PermitType.BUSINESS_LICENSE) {
                    doc.text(`   Business: ${app.businessName || 'N/A'}`);
                    doc.text(`   Type: ${app.businessType || 'N/A'}`);
                }

                doc.moveDown(0.5);
            });

            // Footer
            doc.fontSize(8).text(
                `Page ${doc.bufferedPageRange().count} - FlowGov System`,
                50,
                doc.page.height - 50,
                { align: 'center' },
            );

            doc.end();
        });
    }

    /**
     * Export permit applications to Excel
     */
    async exportToExcel(filters: ExportFilters): Promise<Buffer> {
        // Fetch applications with filters
        const applications = await this.fetchApplications(filters);

        if (applications.length === 0) {
            throw new BadRequestException('No applications found for export');
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FlowGov System';
        workbook.created = new Date();

        // Main sheet
        const worksheet = workbook.addWorksheet('Applications');

        // Define columns
        worksheet.columns = [
            { header: 'Reference Number', key: 'referenceNumber', width: 20 },
            { header: 'Permit Type', key: 'permitType', width: 20 },
            { header: 'Status', key: 'status', width: 20 },
            { header: 'Applicant Name', key: 'applicantName', width: 25 },
            { header: 'Applicant Email', key: 'applicantEmail', width: 30 },
            { header: 'Submitted At', key: 'submittedAt', width: 20 },
            { header: 'Location/Business', key: 'location', width: 30 },
            { header: 'Land Size/Employees', key: 'size', width: 20 },
            { header: 'Created At', key: 'createdAt', width: 20 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        // Add data rows
        applications.forEach((app) => {
            worksheet.addRow({
                referenceNumber: app.referenceNumber || 'DRAFT',
                permitType: app.permitType,
                status: app.status,
                applicantName: app.applicant.name,
                applicantEmail: app.applicant.email,
                submittedAt: app.submittedAt
                    ? new Date(app.submittedAt).toLocaleDateString()
                    : 'Not submitted',
                location:
                    app.permitType === PermitType.BUILDING_PERMIT
                        ? app.locationAddress || 'N/A'
                        : app.businessName || 'N/A',
                size:
                    app.permitType === PermitType.BUILDING_PERMIT
                        ? `${app.landSize || 'N/A'} m²`
                        : `${app.estimatedEmployees || 'N/A'} employees`,
                createdAt: new Date(app.createdAt).toLocaleDateString(),
            });
        });

        // Summary sheet
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 },
        ];

        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        // Add summary data
        summarySheet.addRow({
            metric: 'Total Applications',
            value: applications.length,
        });
        summarySheet.addRow({
            metric: 'Report Generated',
            value: new Date().toLocaleString(),
        });
        summarySheet.addRow({ metric: '', value: '' });

        // Status breakdown
        const byStatus = this.groupBy(applications, 'status');
        summarySheet.addRow({ metric: 'By Status:', value: '' });
        Object.entries(byStatus).forEach(([status, count]) => {
            summarySheet.addRow({ metric: `  ${status}`, value: count });
        });

        // Permit type breakdown
        const byType = this.groupBy(applications, 'permitType');
        summarySheet.addRow({ metric: '', value: '' });
        summarySheet.addRow({ metric: 'By Permit Type:', value: '' });
        Object.entries(byType).forEach(([type, count]) => {
            summarySheet.addRow({ metric: `  ${type}`, value: count });
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Fetch applications with filters
     */
    private async fetchApplications(filters: ExportFilters) {
        const where: any = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.permitType) {
            where.permitType = filters.permitType;
        }

        if (filters.applicantId) {
            where.applicantId = filters.applicantId;
        }

        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.createdAt.lte = new Date(filters.endDate);
            }
        }

        return this.prisma.permitApplication.findMany({
            where,
            include: {
                applicant: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10000, // Limit to 10,000 records
        });
    }

    /**
     * Group array by key
     */
    private groupBy(array: any[], key: string): Record<string, number> {
        return array.reduce((result, item) => {
            const value = item[key];
            result[value] = (result[value] || 0) + 1;
            return result;
        }, {});
    }
}
