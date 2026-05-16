import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, BottleneckThreshold } from '@prisma/client';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
    AuditEntityType,
    AuditActionType,
} from '../../audit-log/dto/audit-log.dto';

export interface ThresholdDto {
    stage?: WorkflowStage | null;
    queueLengthThreshold: number;
    processingTimeMultiplier: number;
    slaViolationPercentage: number;
    workloadPerStaff: number;
    bottleneckScoreThreshold: number;
    createdBy: string;
}

export interface StageThresholds {
    queueLengthThreshold: number;
    processingTimeMultiplier: number;
    slaViolationPercentage: number;
    workloadPerStaff: number;
    bottleneckScoreThreshold: number;
}

@Injectable()
export class BottleneckThresholdService {
    private readonly logger = new Logger(BottleneckThresholdService.name);

    /** In-memory cache for threshold configurations. Key: stage name or 'global'. */
    private readonly thresholdCache = new Map<
        string,
        { data: StageThresholds; expiresAt: number }
    >();

    /** Cache TTL: 2 minutes (120 000 ms) */
    private readonly CACHE_TTL_MS = 120_000;

    constructor(
        private prisma: PrismaService,
        private auditLogService: AuditLogService,
    ) {}

    /**
     * Get thresholds for a stage (stage-specific or global default).
     * Results are cached for 2 minutes to reduce database queries.
     */
    async getThresholds(stage: WorkflowStage): Promise<StageThresholds> {
        const cacheKey = stage as string;
        const cached = this.thresholdCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }

        // Try to get stage-specific threshold
        const stageThreshold = await this.prisma.bottleneckThreshold.findUnique(
            {
                where: { stage },
                select: {
                    queueLengthThreshold: true,
                    processingTimeMultiplier: true,
                    slaViolationPercentage: true,
                    workloadPerStaff: true,
                    bottleneckScoreThreshold: true,
                },
            },
        );

        if (stageThreshold) {
            const result: StageThresholds = {
                queueLengthThreshold: stageThreshold.queueLengthThreshold,
                processingTimeMultiplier:
                    stageThreshold.processingTimeMultiplier,
                slaViolationPercentage: stageThreshold.slaViolationPercentage,
                workloadPerStaff: stageThreshold.workloadPerStaff,
                bottleneckScoreThreshold:
                    stageThreshold.bottleneckScoreThreshold,
            };
            this.thresholdCache.set(cacheKey, {
                data: result,
                expiresAt: Date.now() + this.CACHE_TTL_MS,
            });
            return result;
        }

        // Fall back to global default (where stage is null)
        const globalCacheKey = 'global';
        const cachedGlobal = this.thresholdCache.get(globalCacheKey);
        if (cachedGlobal && cachedGlobal.expiresAt > Date.now()) {
            return cachedGlobal.data;
        }

        const globalThreshold = await this.prisma.bottleneckThreshold.findFirst(
            {
                where: { stage: { equals: null } },
                select: {
                    queueLengthThreshold: true,
                    processingTimeMultiplier: true,
                    slaViolationPercentage: true,
                    workloadPerStaff: true,
                    bottleneckScoreThreshold: true,
                },
            },
        );

        if (globalThreshold) {
            const result: StageThresholds = {
                queueLengthThreshold: globalThreshold.queueLengthThreshold,
                processingTimeMultiplier:
                    globalThreshold.processingTimeMultiplier,
                slaViolationPercentage: globalThreshold.slaViolationPercentage,
                workloadPerStaff: globalThreshold.workloadPerStaff,
                bottleneckScoreThreshold:
                    globalThreshold.bottleneckScoreThreshold,
            };
            this.thresholdCache.set(globalCacheKey, {
                data: result,
                expiresAt: Date.now() + this.CACHE_TTL_MS,
            });
            return result;
        }

        // Use hardcoded defaults if no configuration exists
        return {
            queueLengthThreshold: 10,
            processingTimeMultiplier: 1.5,
            slaViolationPercentage: 20.0,
            workloadPerStaff: 5.0,
            bottleneckScoreThreshold: 60,
        };
    }

    /**
     * Get all threshold configurations
     */
    async getAllThresholds(): Promise<BottleneckThreshold[]> {
        return this.prisma.bottleneckThreshold.findMany({
            orderBy: [{ stage: 'asc' }],
        });
    }

    /**
     * Update or create thresholds for a stage or the global default.
     */
    async updateThresholds(
        thresholdDto: ThresholdDto,
    ): Promise<BottleneckThreshold> {
        // Validate threshold values
        this.validateThresholds(thresholdDto);

        const { stage, createdBy, ...thresholdData } = thresholdDto;

        // Check if threshold already exists
        const existingThreshold = stage
            ? await this.prisma.bottleneckThreshold.findUnique({
                  where: { stage },
              })
            : await this.prisma.bottleneckThreshold.findFirst({
                  where: { stage: { equals: null } },
              });

        let result: BottleneckThreshold;

        if (existingThreshold) {
            // Update existing threshold
            result = await this.prisma.bottleneckThreshold.update({
                where: { id: existingThreshold.id },
                data: thresholdData,
            });

            // Invalidate cache for this stage and global fallback
            this.invalidateCache(stage ?? null);

            this.logger.log(
                `Updated threshold configuration for ${stage || 'global default'}`,
            );

            try {
                await this.auditLogService.createAuditLog({
                    entityType: AuditEntityType.BOTTLENECK_THRESHOLD,
                    entityId: result.id,
                    action: AuditActionType.THRESHOLD_UPDATED,
                    performedBy: createdBy,
                    changes: {
                        before: {
                            stage: existingThreshold.stage,
                            queueLengthThreshold: existingThreshold.queueLengthThreshold,
                            processingTimeMultiplier: existingThreshold.processingTimeMultiplier,
                            slaViolationPercentage: existingThreshold.slaViolationPercentage,
                            workloadPerStaff: existingThreshold.workloadPerStaff,
                            bottleneckScoreThreshold: existingThreshold.bottleneckScoreThreshold,
                        },
                        after: {
                            stage: result.stage,
                            queueLengthThreshold: result.queueLengthThreshold,
                            processingTimeMultiplier: result.processingTimeMultiplier,
                            slaViolationPercentage: result.slaViolationPercentage,
                            workloadPerStaff: result.workloadPerStaff,
                            bottleneckScoreThreshold: result.bottleneckScoreThreshold,
                        },
                    },
                });
            } catch (error) {
                this.logger.error(
                    `Failed to create audit log for threshold update:`,
                    error,
                );
            }
        } else {
            // Create new threshold
            result = await this.prisma.bottleneckThreshold.create({
                data: {
                    stage: stage || null,
                    ...thresholdData,
                    createdBy,
                },
            });

            // Invalidate cache for this stage and global fallback
            this.invalidateCache(stage ?? null);

            this.logger.log(
                `Created threshold configuration for ${stage || 'global default'}`,
            );

            try {
                await this.auditLogService.createAuditLog({
                    entityType: AuditEntityType.BOTTLENECK_THRESHOLD,
                    entityId: result.id,
                    action: AuditActionType.THRESHOLD_UPDATED,
                    performedBy: createdBy,
                    changes: {
                        after: {
                            stage: result.stage,
                            queueLengthThreshold: result.queueLengthThreshold,
                            processingTimeMultiplier: result.processingTimeMultiplier,
                            slaViolationPercentage: result.slaViolationPercentage,
                            workloadPerStaff: result.workloadPerStaff,
                            bottleneckScoreThreshold: result.bottleneckScoreThreshold,
                        },
                    },
                });
            } catch (error) {
                this.logger.error(
                    `Failed to create audit log for threshold creation:`,
                    error,
                );
            }
        }

        return result;
    }

    /**
     * Validate threshold values
     */
    private validateThresholds(thresholds: ThresholdDto): void {
        const errors: string[] = [];

        if (thresholds.queueLengthThreshold < 0) {
            errors.push('queueLengthThreshold must be a positive number');
        }
        if (thresholds.processingTimeMultiplier < 0) {
            errors.push('processingTimeMultiplier must be a positive number');
        }
        if (thresholds.slaViolationPercentage < 0) {
            errors.push('slaViolationPercentage must be a positive number');
        }
        if (thresholds.workloadPerStaff < 0) {
            errors.push('workloadPerStaff must be a positive number');
        }
        if (thresholds.bottleneckScoreThreshold < 0) {
            errors.push('bottleneckScoreThreshold must be a positive number');
        }

        if (thresholds.processingTimeMultiplier === 0) {
            errors.push('processingTimeMultiplier must be greater than 0');
        }

        if (
            thresholds.slaViolationPercentage < 0 ||
            thresholds.slaViolationPercentage > 100
        ) {
            errors.push('slaViolationPercentage must be between 0 and 100');
        }

        if (thresholds.queueLengthThreshold > 1000) {
            errors.push('queueLengthThreshold must not exceed 1000');
        }
        if (thresholds.processingTimeMultiplier > 10) {
            errors.push('processingTimeMultiplier must not exceed 10');
        }
        if (thresholds.workloadPerStaff > 100) {
            errors.push('workloadPerStaff must not exceed 100');
        }
        if (thresholds.bottleneckScoreThreshold > 100) {
            errors.push('bottleneckScoreThreshold must not exceed 100');
        }

        if (errors.length > 0) {
            throw new BadRequestException({
                message: 'Threshold validation failed',
                errors,
            });
        }
    }

    /**
     * Delete a threshold configuration
     */
    async deleteThreshold(stage: WorkflowStage): Promise<void> {
        const threshold = await this.prisma.bottleneckThreshold.findUnique({
            where: { stage },
        });

        if (!threshold) {
            throw new NotFoundException(
                `Threshold configuration for stage ${stage} not found`,
            );
        }

        await this.prisma.bottleneckThreshold.delete({
            where: { stage },
        });

        // Invalidate cache for this stage
        this.invalidateCache(stage);

        this.logger.log(`Deleted threshold configuration for stage ${stage}`);
    }

    /**
     * Get threshold by ID
     */
    async getThresholdById(id: string): Promise<BottleneckThreshold | null> {
        return this.prisma.bottleneckThreshold.findUnique({
            where: { id },
        });
    }

    /**
     * Invalidate cache entries for a given stage (and global fallback).
     * Called whenever thresholds are created, updated, or deleted.
     */
    private invalidateCache(stage: WorkflowStage | null): void {
        if (stage) {
            this.thresholdCache.delete(stage as string);
        }
        // Always clear global cache since stage lookups fall back to it
        this.thresholdCache.delete('global');
        this.logger.debug(
            `Threshold cache invalidated for ${stage ?? 'global'}`,
        );
    }
}
