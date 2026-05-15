import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermitType, WorkflowStage, Prisma, Role } from '@prisma/client';
import {
    CreateApplicationDto,
    UpdateApplicationDto,
    ListApplicationsQuery,
} from '../dto/permit.dto';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
    AuditEntityType,
    AuditActionType,
} from '../../audit-log/dto/audit-log.dto';

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class PermitService {
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
     * Create a new permit application (draft status)
     */
    async createApplication(userId: string, dto: CreateApplicationDto) {
        // Validate application data
        this.validateApplicationData(dto);

        const application = await this.prisma.permitApplication.create({
            data: {
                permitType: dto.permitType,
                applicantId: userId,
                status: WorkflowStage.DRAFT,
                currentStage: WorkflowStage.DRAFT,
                referenceNumber: '', // Will be set on submission

                // Building permit fields
                locationAddress: dto.locationAddress,
                landSize: dto.landSize,
                landType: dto.landType,
                buildingHeight: dto.buildingHeight,
                njopValue: dto.njopValue,
                isStrategicLocation: dto.isStrategicLocation,

                // Business license fields
                businessName: dto.businessName,
                businessType: dto.businessType,
                businessLocation: dto.businessLocation,
                estimatedEmployees: dto.estimatedEmployees,
            },
            include: {
                applicant: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        // Create audit log
        await this.auditLogService.createAuditLog({
            entityType: AuditEntityType.PERMIT_APPLICATION,
            entityId: application.id,
            action: AuditActionType.CREATE,
            performedBy: userId,
            changes: {
                after: {
                    permitType: application.permitType,
                    status: application.status,
                    locationAddress: application.locationAddress,
                    landSize: application.landSize,
                    businessName: application.businessName,
                },
            },
        });

        return application;
    }

    /**
     * Get application by ID with access control
     */
    async getApplication(id: string, userId: string) {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id },
            include: {
                applicant: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                documents: true,
                validationActions: {
                    include: {
                        performedBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        performedAt: 'desc',
                    },
                },
                stageHistory: {
                    orderBy: {
                        transitionedAt: 'desc',
                    },
                },
            },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Check access: applicant can view their own, staff can view applications at their assigned stages
        if (application.applicantId !== userId) {
            const isStaff = await this.hasStaffRole(userId);

            if (!isStaff) {
                throw new ForbiddenException(
                    'You can only view your own applications',
                );
            }
        }

        return application;
    }

    /**
     * List applications with filtering and pagination
     */
    async listApplications(
        userId: string,
        query: ListApplicationsQuery,
    ): Promise<PaginatedResult<any>> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.PermitApplicationWhereInput = {
            applicantId: userId, // Filter by user (will be modified for staff)
        };

        if (query.status) {
            where.status = query.status;
        }

        if (query.permitType) {
            where.permitType = query.permitType;
        }

        if (query.search) {
            where.OR = [
                { referenceNumber: { contains: query.search, mode: 'insensitive' } },
                {
                    applicant: {
                        name: { contains: query.search, mode: 'insensitive' },
                    },
                },
            ];
        }

        const orderBy: Prisma.PermitApplicationOrderByWithRelationInput = {};
        if (query.sortBy === 'submittedAt') {
            orderBy.submittedAt = 'desc';
        } else {
            orderBy.updatedAt = 'desc';
        }

        const [data, total] = await Promise.all([
            this.prisma.permitApplication.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    applicant: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
            }),
            this.prisma.permitApplication.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Update application (only in DRAFT status)
     */
    async updateApplication(
        id: string,
        userId: string,
        dto: UpdateApplicationDto,
    ) {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.applicantId !== userId) {
            throw new ForbiddenException('You can only update your own applications');
        }

        if (application.status !== WorkflowStage.DRAFT) {
            throw new BadRequestException(
                'Can only update applications in DRAFT status',
            );
        }

        // Capture before state for audit log
        const beforeState = {
            locationAddress: application.locationAddress,
            landSize: application.landSize,
            landType: application.landType,
            buildingHeight: application.buildingHeight,
            njopValue: application.njopValue,
            isStrategicLocation: application.isStrategicLocation,
            businessName: application.businessName,
            businessType: application.businessType,
            businessLocation: application.businessLocation,
            estimatedEmployees: application.estimatedEmployees,
        };

        const updated = await this.prisma.permitApplication.update({
            where: { id },
            data: {
                locationAddress: dto.locationAddress,
                landSize: dto.landSize,
                landType: dto.landType,
                buildingHeight: dto.buildingHeight,
                njopValue: dto.njopValue,
                isStrategicLocation: dto.isStrategicLocation,
                businessName: dto.businessName,
                businessType: dto.businessType,
                businessLocation: dto.businessLocation,
                estimatedEmployees: dto.estimatedEmployees,
            },
            include: {
                applicant: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        // Create audit log with before/after states
        await this.auditLogService.createAuditLog({
            entityType: AuditEntityType.PERMIT_APPLICATION,
            entityId: id,
            action: AuditActionType.UPDATE,
            performedBy: userId,
            changes: {
                before: beforeState,
                after: {
                    locationAddress: updated.locationAddress,
                    landSize: updated.landSize,
                    landType: updated.landType,
                    buildingHeight: updated.buildingHeight,
                    njopValue: updated.njopValue,
                    isStrategicLocation: updated.isStrategicLocation,
                    businessName: updated.businessName,
                    businessType: updated.businessType,
                    businessLocation: updated.businessLocation,
                    estimatedEmployees: updated.estimatedEmployees,
                },
            },
        });

        return updated;
    }

    /**
     * Delete application (only in DRAFT status)
     */
    async deleteApplication(id: string, userId: string) {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.applicantId !== userId) {
            throw new ForbiddenException(
                'You can only delete your own applications',
            );
        }

        if (application.status !== WorkflowStage.DRAFT) {
            throw new BadRequestException(
                'Can only delete applications in DRAFT status',
            );
        }

        // Capture before state for audit log
        const beforeState = {
            permitType: application.permitType,
            status: application.status,
            referenceNumber: application.referenceNumber,
            locationAddress: application.locationAddress,
            businessName: application.businessName,
        };

        await this.prisma.permitApplication.delete({
            where: { id },
        });

        // Create audit log
        await this.auditLogService.createAuditLog({
            entityType: AuditEntityType.PERMIT_APPLICATION,
            entityId: id,
            action: AuditActionType.DELETE,
            performedBy: userId,
            changes: {
                before: beforeState,
            },
        });

        return { message: 'Application deleted successfully' };
    }

    /**
     * Submit application for processing
     * Validates, calculates tax, generates reference number, moves to DOCUMENT_CHECK stage
     */
    async submitApplication(id: string, userId: string) {
        const application = await this.prisma.permitApplication.findUnique({
            where: { id },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.applicantId !== userId) {
            throw new ForbiddenException(
                'You can only submit your own applications',
            );
        }

        if (application.status !== WorkflowStage.DRAFT) {
            throw new BadRequestException(
                'Can only submit applications in DRAFT status',
            );
        }

        // Validate required fields
        this.validateApplicationData({
            permitType: application.permitType,
            locationAddress: application.locationAddress,
            landSize: application.landSize,
            landType: application.landType,
            buildingHeight: application.buildingHeight,
            njopValue: application.njopValue,
            isStrategicLocation: application.isStrategicLocation,
            businessName: application.businessName,
            businessType: application.businessType,
            businessLocation: application.businessLocation,
            estimatedEmployees: application.estimatedEmployees,
        } as CreateApplicationDto);

        // Generate reference number
        const referenceNumber = this.generateReferenceNumber(
            application.permitType,
        );

        // Update application
        const updated = await this.prisma.permitApplication.update({
            where: { id },
            data: {
                referenceNumber,
                status: WorkflowStage.DOCUMENT_CHECK,
                currentStage: WorkflowStage.DOCUMENT_CHECK,
                submittedAt: new Date(),
            },
            include: {
                applicant: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        // Create stage history
        await this.prisma.stageHistory.create({
            data: {
                applicationId: id,
                fromStage: WorkflowStage.DRAFT,
                toStage: WorkflowStage.DOCUMENT_CHECK,
                transitionedAt: new Date(),
            },
        });

        // Create notification
        await this.prisma.notification.create({
            data: {
                userId,
                type: 'APPLICATION_SUBMITTED',
                title: 'Application Submitted',
                message: `Your application ${referenceNumber} has been submitted for document check`,
                applicationId: id,
            },
        });

        // Create audit log
        await this.auditLogService.createAuditLog({
            entityType: AuditEntityType.PERMIT_APPLICATION,
            entityId: id,
            action: AuditActionType.SUBMIT,
            performedBy: userId,
            changes: {
                before: {
                    status: WorkflowStage.DRAFT,
                    referenceNumber: '',
                },
                after: {
                    status: WorkflowStage.DOCUMENT_CHECK,
                    referenceNumber: updated.referenceNumber,
                    submittedAt: updated.submittedAt,
                },
            },
        });

        return updated;
    }

    /**
     * Resubmit rejected application
     * Creates new application based on rejected one, allows modifications
     */
    async resubmitApplication(
        originalId: string,
        userId: string,
        dto: UpdateApplicationDto,
    ) {
        const original = await this.prisma.permitApplication.findUnique({
            where: { id: originalId },
        });

        if (!original) {
            throw new NotFoundException('Original application not found');
        }

        if (original.applicantId !== userId) {
            throw new ForbiddenException(
                'You can only resubmit your own applications',
            );
        }

        if (original.status !== WorkflowStage.REJECTED) {
            throw new BadRequestException(
                'Can only resubmit applications that were REJECTED',
            );
        }

        // Create new application with modifications
        const newApplication = await this.prisma.permitApplication.create({
            data: {
                permitType: original.permitType,
                applicantId: userId,
                status: WorkflowStage.DRAFT,
                currentStage: WorkflowStage.DRAFT,
                referenceNumber: '', // Will be set on submission
                originalApplicationId: originalId,

                // Use updated values or fall back to original
                locationAddress: dto.locationAddress ?? original.locationAddress,
                landSize: dto.landSize ?? original.landSize,
                landType: dto.landType ?? original.landType,
                buildingHeight: dto.buildingHeight ?? original.buildingHeight,
                njopValue: dto.njopValue ?? original.njopValue,
                isStrategicLocation:
                    dto.isStrategicLocation ?? original.isStrategicLocation,
                businessName: dto.businessName ?? original.businessName,
                businessType: dto.businessType ?? original.businessType,
                businessLocation: dto.businessLocation ?? original.businessLocation,
                estimatedEmployees:
                    dto.estimatedEmployees ?? original.estimatedEmployees,
            },
            include: {
                applicant: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        return newApplication;
    }

    /**
     * Generate reference number for permit application
     * Format: {PERMIT_TYPE_PREFIX}/{YEAR}/{MONTH}/{SEQUENCE}
     * Example: BP/2026/04/00001 or BL/2026/04/00001
     */
    private generateReferenceNumber(permitType: PermitType): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const sequence = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');

        const prefix = permitType === PermitType.BUILDING_PERMIT ? 'BP' : 'BL';

        return `${prefix}/${year}/${month}/${sequence}`;
    }

    /**
     * Validate application data based on permit type
     */
    validateApplicationData(dto: CreateApplicationDto | UpdateApplicationDto) {
        if ('permitType' in dto) {
            if (dto.permitType === PermitType.BUILDING_PERMIT) {
                // Building permit requires property information
                if (!dto.locationAddress) {
                    throw new BadRequestException(
                        'Location address is required for building permits',
                    );
                }
                if (!dto.landSize || dto.landSize <= 0) {
                    throw new BadRequestException(
                        'Valid land size is required for building permits',
                    );
                }
                if (!dto.landType) {
                    throw new BadRequestException(
                        'Land type is required for building permits',
                    );
                }
                if (!dto.buildingHeight || dto.buildingHeight <= 0) {
                    throw new BadRequestException(
                        'Valid building height is required for building permits',
                    );
                }
                if (!dto.njopValue || dto.njopValue <= 0) {
                    throw new BadRequestException(
                        'Valid NJOP value is required for building permits',
                    );
                }
            } else if (dto.permitType === PermitType.BUSINESS_LICENSE) {
                // Business license requires business information
                if (!dto.businessName) {
                    throw new BadRequestException(
                        'Business name is required for business licenses',
                    );
                }
                if (!dto.businessType) {
                    throw new BadRequestException(
                        'Business type is required for business licenses',
                    );
                }
                if (!dto.businessLocation) {
                    throw new BadRequestException(
                        'Business location is required for business licenses',
                    );
                }
                if (!dto.estimatedEmployees || dto.estimatedEmployees <= 0) {
                    throw new BadRequestException(
                        'Valid estimated employees is required for business licenses',
                    );
                }
            }
        }

        return true;
    }
}
