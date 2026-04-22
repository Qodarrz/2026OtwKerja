import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';

export interface ValidationResult {
    isValid: boolean;
    errors?: string[];
}

@Injectable()
export class FileService {
    private readonly uploadDir = 'uploads/permits';
    private readonly maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    private readonly allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
    ];
    private readonly allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

    constructor(private prisma: PrismaService) { }

    /**
     * Upload a document for a permit application
     */
    async uploadDocument(
        file: Express.Multer.File,
        applicationId: string,
        userId: string,
    ) {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            throw new BadRequestException(validation.errors?.join(', '));
        }

        // Verify application exists and user has access
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Check if user has access (applicant or staff)
        if (application.applicantId !== userId) {
            // TODO: Check if user has staff role
            // For now, allow access (will be enforced by guards)
        }

        // Sanitize filename
        const sanitizedFilename = this.sanitizeFilename(file.originalname);

        // Generate storage path
        const storagePath = this.generateStoragePath(
            applicationId,
            sanitizedFilename,
        );

        // Ensure directory exists
        const fullPath = path.join(process.cwd(), storagePath);
        const directory = path.dirname(fullPath);
        await fs.mkdir(directory, { recursive: true });

        // Save file to filesystem
        await fs.writeFile(fullPath, file.buffer);

        // Create document record in database
        const document = await this.prisma.document.create({
            data: {
                filename: path.basename(storagePath),
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                fileSize: file.size,
                storagePath,
                applicationId,
            },
        });

        return document;
    }

    /**
     * Get document with access control
     * Returns file stream and document metadata
     */
    async getDocument(documentId: string, userId: string) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                application: true,
            },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        // Verify user has access to the application
        if (document.application.applicantId !== userId) {
            // TODO: Check if user has staff role
            // For now, allow access (will be enforced by guards)
        }

        // Check if file exists
        const fullPath = path.join(process.cwd(), document.storagePath);
        try {
            await fs.access(fullPath);
        } catch (error) {
            throw new NotFoundException('File not found on disk');
        }

        // Return file stream
        const stream = createReadStream(fullPath);

        return {
            stream,
            document,
        };
    }

    /**
     * Delete document (only for draft applications)
     */
    async deleteDocument(documentId: string, userId: string) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                application: true,
            },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        // Verify user is the applicant
        if (document.application.applicantId !== userId) {
            throw new ForbiddenException('You can only delete your own documents');
        }

        // Only allow deletion for draft applications
        if (document.application.status !== WorkflowStage.DRAFT) {
            throw new BadRequestException(
                'Can only delete documents from applications in DRAFT status',
            );
        }

        // Delete file from filesystem
        const fullPath = path.join(process.cwd(), document.storagePath);
        try {
            await fs.unlink(fullPath);
        } catch (error) {
            // File might not exist, continue with database deletion
            console.error('Error deleting file from disk:', error);
        }

        // Delete document record from database
        await this.prisma.document.delete({
            where: { id: documentId },
        });

        return { message: 'Document deleted successfully' };
    }

    /**
     * List documents for an application
     */
    async listDocuments(applicationId: string, userId: string) {
        // Verify application exists and user has access
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Check if user has access
        if (application.applicantId !== userId) {
            // TODO: Check if user has staff role
            // For now, allow access (will be enforced by guards)
        }

        const documents = await this.prisma.document.findMany({
            where: { applicationId },
            orderBy: { uploadedAt: 'desc' },
        });

        return documents;
    }

    /**
     * Validate file type and size
     */
    validateFile(file: Express.Multer.File): ValidationResult {
        const errors: string[] = [];

        // Check file size
        if (file.size > this.maxFileSize) {
            errors.push(
                `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
            );
        }

        // Check MIME type
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            errors.push(
                `File type ${file.mimetype} is not allowed. Allowed types: PDF, JPEG, PNG`,
            );
        }

        // Check file extension
        const ext = path.extname(file.originalname).toLowerCase();
        if (!this.allowedExtensions.includes(ext)) {
            errors.push(
                `File extension ${ext} is not allowed. Allowed extensions: .pdf, .jpg, .jpeg, .png`,
            );
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    /**
     * Sanitize filename to prevent path traversal attacks
     */
    private sanitizeFilename(filename: string): string {
        // Remove any path separators and special characters
        const sanitized = filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/\.+/g, '.')
            .replace(/_+/g, '_');

        // Ensure filename is not empty
        if (!sanitized || sanitized === '.') {
            return 'document';
        }

        return sanitized;
    }

    /**
     * Generate storage path for uploaded file
     * Format: uploads/permits/{applicationId}/{timestamp}-{filename}
     */
    generateStoragePath(applicationId: string, filename: string): string {
        const timestamp = Date.now();
        return path.join(
            this.uploadDir,
            applicationId,
            `${timestamp}-${filename}`,
        );
    }
}
