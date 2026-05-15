import { Test, TestingModule } from '@nestjs/testing';
import { FileService } from '../../src/modules/permits/services/file.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { WorkflowStage, PermitType } from '@prisma/client';

// Mock fs modules before any imports that use them
jest.mock('fs/promises', () => {
    const actual = jest.requireActual('fs/promises');
    return {
        ...actual,
        mkdir: jest.fn(),
        writeFile: jest.fn(),
        access: jest.fn(),
        unlink: jest.fn(),
    };
});

jest.mock('fs', () => {
    const actual = jest.requireActual('fs');
    return {
        ...actual,
        createReadStream: jest.fn(),
        existsSync: jest.fn(() => true),
    };
});

import * as fs from 'fs/promises';
import * as path from 'path';

describe('FileService', () => {
    let service: FileService;
    let prisma: PrismaService;

    const mockPrismaService = {
        document: {
            create: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
        },
        permitApplication: {
            findUnique: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FileService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<FileService>(FileService);
        prisma = module.get<PrismaService>(PrismaService);

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('validateFile', () => {
        it('should accept valid PDF file', () => {
            const file = {
                originalname: 'document.pdf',
                mimetype: 'application/pdf',
                size: 5 * 1024 * 1024, // 5MB
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const result = service.validateFile(file);

            expect(result.isValid).toBe(true);
            expect(result.errors).toBeUndefined();
        });

        it('should accept valid JPEG file', () => {
            const file = {
                originalname: 'image.jpg',
                mimetype: 'image/jpeg',
                size: 3 * 1024 * 1024, // 3MB
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const result = service.validateFile(file);

            expect(result.isValid).toBe(true);
            expect(result.errors).toBeUndefined();
        });

        it('should accept valid PNG file', () => {
            const file = {
                originalname: 'image.png',
                mimetype: 'image/png',
                size: 2 * 1024 * 1024, // 2MB
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const result = service.validateFile(file);

            expect(result.isValid).toBe(true);
            expect(result.errors).toBeUndefined();
        });

        it('should reject file exceeding size limit', () => {
            const file = {
                originalname: 'large.pdf',
                mimetype: 'application/pdf',
                size: 15 * 1024 * 1024, // 15MB
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const result = service.validateFile(file);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'File size exceeds maximum allowed size of 10MB',
            );
        });

        it('should reject invalid MIME type', () => {
            const file = {
                originalname: 'document.doc',
                mimetype: 'application/msword',
                size: 1 * 1024 * 1024, // 1MB
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const result = service.validateFile(file);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'File type application/msword is not allowed. Allowed types: PDF, JPEG, PNG',
            );
        });

        it('should reject invalid file extension', () => {
            const file = {
                originalname: 'document.txt',
                mimetype: 'application/pdf', // Mimetype might be spoofed
                size: 1 * 1024 * 1024, // 1MB
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const result = service.validateFile(file);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'File extension .txt is not allowed. Allowed extensions: .pdf, .jpg, .jpeg, .png',
            );
        });

        it('should reject file with multiple validation errors', () => {
            const file = {
                originalname: 'document.exe',
                mimetype: 'application/x-msdownload',
                size: 15 * 1024 * 1024, // 15MB
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const result = service.validateFile(file);

            expect(result.isValid).toBe(false);
            expect(result.errors?.length).toBeGreaterThan(1);
        });
    });

    describe('uploadDocument', () => {
        const mockFile = {
            originalname: 'test-document.pdf',
            mimetype: 'application/pdf',
            size: 5 * 1024 * 1024,
            buffer: Buffer.from('test content'),
        } as Express.Multer.File;

        const mockApplication = {
            id: 'app-123',
            applicantId: 'user-123',
            status: WorkflowStage.DRAFT,
            permitType: PermitType.BUILDING_PERMIT,
        };

        beforeEach(() => {
            (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
            (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
        });

        it('should upload document successfully', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.document.create.mockResolvedValue({
                id: 'doc-123',
                filename: 'test-document.pdf',
                originalFilename: 'test-document.pdf',
                mimeType: 'application/pdf',
                fileSize: mockFile.size,
                storagePath: 'uploads/permits/app-123/123456789-test-document.pdf',
                applicationId: 'app-123',
                uploadedAt: new Date(),
            });

            const result = await service.uploadDocument(
                mockFile,
                'app-123',
                'user-123',
            );

            expect(result).toBeDefined();
            expect(result.id).toBe('doc-123');
            expect(mockPrismaService.permitApplication.findUnique).toHaveBeenCalledWith(
                {
                    where: { id: 'app-123' },
                },
            );
            expect(fs.mkdir).toHaveBeenCalled();
            expect(fs.writeFile).toHaveBeenCalled();
            expect(mockPrismaService.document.create).toHaveBeenCalled();
        });

        it('should throw BadRequestException for invalid file', async () => {
            const invalidFile = {
                ...mockFile,
                mimetype: 'application/msword',
            } as Express.Multer.File;

            await expect(
                service.uploadDocument(invalidFile, 'app-123', 'user-123'),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if application does not exist', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.uploadDocument(mockFile, 'app-123', 'user-123'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should sanitize filename with special characters', async () => {
            const fileWithSpecialChars = {
                ...mockFile,
                originalname: '../../../etc/passwd.pdf',
            } as Express.Multer.File;

            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.document.create.mockResolvedValue({
                id: 'doc-123',
                filename: 'sanitized.pdf',
                originalFilename: fileWithSpecialChars.originalname,
                mimeType: 'application/pdf',
                fileSize: mockFile.size,
                storagePath: 'uploads/permits/app-123/123456789-sanitized.pdf',
                applicationId: 'app-123',
                uploadedAt: new Date(),
            });

            await service.uploadDocument(fileWithSpecialChars, 'app-123', 'user-123');

            // Verify that the filename was sanitized (no path traversal)
            const createCall = mockPrismaService.document.create.mock.calls[0][0];
            expect(createCall.data.storagePath).not.toContain('..');
        });
    });

    describe('getDocument', () => {
        const mockDocument = {
            id: 'doc-123',
            filename: 'test.pdf',
            originalFilename: 'test.pdf',
            mimeType: 'application/pdf',
            fileSize: 1024,
            storagePath: 'uploads/permits/app-123/123456789-test.pdf',
            applicationId: 'app-123',
            uploadedAt: new Date(),
            application: {
                id: 'app-123',
                applicantId: 'user-123',
                status: WorkflowStage.DOCUMENT_CHECK,
            },
        };

        beforeEach(() => {
            (fs.access as jest.Mock).mockResolvedValue(undefined);
        });

        it('should return document stream for valid request', async () => {
            mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

            const result = await service.getDocument('doc-123', 'user-123');

            expect(result).toBeDefined();
            expect(result.document).toEqual(mockDocument);
            expect(mockPrismaService.document.findUnique).toHaveBeenCalledWith({
                where: { id: 'doc-123' },
                include: { application: true },
            });
        });

        it('should throw NotFoundException if document does not exist', async () => {
            mockPrismaService.document.findUnique.mockResolvedValue(null);

            await expect(service.getDocument('doc-123', 'user-123')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw NotFoundException if file does not exist on disk', async () => {
            mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);
            (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

            await expect(service.getDocument('doc-123', 'user-123')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('deleteDocument', () => {
        const mockDocument = {
            id: 'doc-123',
            filename: 'test.pdf',
            originalFilename: 'test.pdf',
            mimeType: 'application/pdf',
            fileSize: 1024,
            storagePath: 'uploads/permits/app-123/123456789-test.pdf',
            applicationId: 'app-123',
            uploadedAt: new Date(),
            application: {
                id: 'app-123',
                applicantId: 'user-123',
                status: WorkflowStage.DRAFT,
            },
        };

        beforeEach(() => {
            (fs.unlink as jest.Mock).mockResolvedValue(undefined);
        });

        it('should delete document successfully', async () => {
            mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);
            mockPrismaService.document.delete.mockResolvedValue(mockDocument);

            const result = await service.deleteDocument('doc-123', 'user-123');

            expect(result.message).toBe('Document deleted successfully');
            expect(fs.unlink).toHaveBeenCalled();
            expect(mockPrismaService.document.delete).toHaveBeenCalledWith({
                where: { id: 'doc-123' },
            });
        });

        it('should throw NotFoundException if document does not exist', async () => {
            mockPrismaService.document.findUnique.mockResolvedValue(null);

            await expect(
                service.deleteDocument('doc-123', 'user-123'),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user is not the applicant', async () => {
            mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);

            await expect(
                service.deleteDocument('doc-123', 'other-user'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException if application is not in DRAFT status', async () => {
            const submittedDocument = {
                ...mockDocument,
                application: {
                    ...mockDocument.application,
                    status: WorkflowStage.DOCUMENT_CHECK,
                },
            };
            mockPrismaService.document.findUnique.mockResolvedValue(
                submittedDocument,
            );

            await expect(
                service.deleteDocument('doc-123', 'user-123'),
            ).rejects.toThrow(BadRequestException);
        });

        it('should continue deletion even if file does not exist on disk', async () => {
            mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);
            mockPrismaService.document.delete.mockResolvedValue(mockDocument);
            (fs.unlink as jest.Mock).mockRejectedValue(new Error('File not found'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = await service.deleteDocument('doc-123', 'user-123');

            expect(result.message).toBe('Document deleted successfully');
            expect(mockPrismaService.document.delete).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error deleting file from disk:',
                expect.any(Error),
            );
            consoleSpy.mockRestore();
        });
    });

    describe('listDocuments', () => {
        const mockApplication = {
            id: 'app-123',
            applicantId: 'user-123',
            status: WorkflowStage.DRAFT,
        };

        const mockDocuments = [
            {
                id: 'doc-1',
                filename: 'test1.pdf',
                originalFilename: 'test1.pdf',
                mimeType: 'application/pdf',
                fileSize: 1024,
                storagePath: 'uploads/permits/app-123/1-test1.pdf',
                applicationId: 'app-123',
                uploadedAt: new Date('2026-04-22T10:00:00Z'),
            },
            {
                id: 'doc-2',
                filename: 'test2.jpg',
                originalFilename: 'test2.jpg',
                mimeType: 'image/jpeg',
                fileSize: 2048,
                storagePath: 'uploads/permits/app-123/2-test2.jpg',
                applicationId: 'app-123',
                uploadedAt: new Date('2026-04-22T09:00:00Z'),
            },
        ];

        it('should list documents for an application', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(
                mockApplication,
            );
            mockPrismaService.document.findMany.mockResolvedValue(mockDocuments);

            const result = await service.listDocuments('app-123', 'user-123');

            expect(result).toEqual(mockDocuments);
            expect(mockPrismaService.document.findMany).toHaveBeenCalledWith({
                where: { applicationId: 'app-123' },
                orderBy: { uploadedAt: 'desc' },
            });
        });

        it('should throw NotFoundException if application does not exist', async () => {
            mockPrismaService.permitApplication.findUnique.mockResolvedValue(null);

            await expect(
                service.listDocuments('app-123', 'user-123'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('generateStoragePath', () => {
        it('should generate correct storage path', () => {
            const path = service.generateStoragePath('app-123', 'test.pdf');

            expect(path).toMatch(/^uploads\/permits\/app-123\/\d+-test\.pdf$/);
        });

        it('should include timestamp in path', async () => {
            const path1 = service.generateStoragePath('app-123', 'test.pdf');
            
            // Wait a tiny bit to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 5));
            
            const path2 = service.generateStoragePath('app-123', 'test.pdf');

            // Paths should be different due to timestamp
            expect(path1).not.toBe(path2);
        });
    });
});
