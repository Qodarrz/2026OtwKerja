import {
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Request,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FileService } from '../services/file.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class DocumentController {
    constructor(private readonly fileService: FileService) { }

    /**
     * POST /api/permits/applications/:id/documents
     * Upload document (multipart)
     */
    @Post('permits/applications/:id/documents')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDocument(
        @Request() req: any,
        @Param('id') applicationId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const userId = req.user.sub;
        return this.fileService.uploadDocument(file, applicationId, userId);
    }

    /**
     * GET /api/permits/applications/:id/documents
     * List documents
     */
    @Get('permits/applications/:id/documents')
    async listDocuments(@Request() req: any, @Param('id') applicationId: string) {
        const userId = req.user.sub;
        return this.fileService.listDocuments(applicationId, userId);
    }

    /**
     * GET /api/permits/documents/:documentId/download
     * Download document
     */
    @Get('permits/documents/:documentId/download')
    async downloadDocument(
        @Request() req: any,
        @Param('documentId') documentId: string,
        @Res() res: Response,
    ) {
        const userId = req.user.sub;
        const { stream, document } = await this.fileService.getDocument(
            documentId,
            userId,
        );

        // Set response headers
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${document.originalFilename}"`,
        );
        res.setHeader('Content-Length', document.fileSize);

        // Pipe file stream to response
        stream.pipe(res);
    }

    /**
     * DELETE /api/permits/documents/:documentId
     * Delete document (draft only)
     */
    @Delete('permits/documents/:documentId')
    async deleteDocument(
        @Request() req: any,
        @Param('documentId') documentId: string,
    ) {
        const userId = req.user.sub;
        return this.fileService.deleteDocument(documentId, userId);
    }
}
