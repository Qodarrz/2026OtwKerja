import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, Role } from '@prisma/client';
import * as path from 'path';
import { put, del } from '@vercel/blob';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
    AuditEntityType,
    AuditActionType,
} from '../../audit-log/dto/audit-log.dto';

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

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
    ) { }

    /**
     * Check if user has staff role (can access any application)
     */
    private async hasStaffRole(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { roles: true },
        });

        if (!user) {
            return false;
        }

        return user.roles.some((role) =>
            ([Role.ADMIN, Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER] as Role[]).includes(
                role,
            ),
        );
    }

    /**
     * Verify user has access to an application (owner or staff)
     */
    private async verifyApplicationAccess(
        applicationId: string,
        userId: string,
        action: string,
    ): Promise<void> {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Owner always has access
        if (application.applicantId === userId) {
            return;
        }

        // Check if user has staff role
        const isStaff = await this.hasStaffRole(userId);

        if (!isStaff) {
            throw new ForbiddenException(
                `You can only ${action} your own applications`,
            );
        }
    }

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
        await this.verifyApplicationAccess(
            applicationId,
            userId,
            'upload documents to',
        );

        // Sanitize filename
        const sanitizedFilename = this.sanitizeFilename(file.originalname);

        // Generate storage path
        const storagePath = this.generateStoragePath(
            applicationId,
            sanitizedFilename,
        );

        // Save file to Vercel Blob
        const blob = await put(storagePath, file.buffer, {
            access: 'public', // Using public to allow easy download redirect
        });

        const blobUrl = blob.url;

        // Create document record in database
        const document = await this.prisma.document.create({
            data: {
                filename: path.basename(storagePath),
                originalFilename: file.originalname,
                mimeType: file.mimetype,
                fileSize: file.size,
                storagePath: blobUrl,
                applicationId,
            },
        });

        // Create audit log for upload
        await this.auditLogService.createAuditLog({
            entityType: AuditEntityType.DOCUMENT,
            entityId: document.id,
            action: AuditActionType.UPLOAD,
            performedBy: userId,
            changes: {
                filename: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                applicationId,
            },
        });

        return document;
    }

    /**
     * Get document metadata (which includes the Vercel Blob URL)
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
            const isStaff = await this.hasStaffRole(userId);

            if (!isStaff) {
                throw new ForbiddenException(
                    'You can only download documents from your own applications',
                );
            }
        }

        // Vercel Blob file should be available via storagePath url

        // Create audit log for download
        await this.auditLogService.createAuditLog({
            entityType: AuditEntityType.DOCUMENT,
            entityId: documentId,
            action: AuditActionType.DOWNLOAD,
            performedBy: userId,
            changes: {
                filename: document.originalFilename,
                fileSize: document.fileSize,
                mimeType: document.mimeType,
                applicationId: document.applicationId,
            },
        });

        return {
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

        // Delete file from Vercel Blob
        try {
            await del(document.storagePath);
        } catch (error) {
            // File might not exist on blob, continue with database deletion
            console.error('Error deleting file from Blob:', error);
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
        await this.verifyApplicationAccess(
            applicationId,
            userId,
            'view documents from',
        );

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
        // Just return the path fragment for Vercel Blob
        return `permits/${applicationId}/${timestamp}-${filename}`;
    }
}
