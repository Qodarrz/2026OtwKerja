import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowStage, BottleneckThreshold } from '@prisma/client';

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

    constructor(private prisma: PrismaService) {}

    /**
     * Get thresholds for a stage (stage-specific or global default)
     */
    async getThresholds(stage: WorkflowStage): Promise<StageThresholds> {
        // Try to get stage-specific threshold
        const stageThreshold = await this.prisma.bottleneckThreshold.findUnique(
            {
                where: { stage },
            },
        );

        if (stageThreshold) {
            return {
                queueLengthThreshold: stageThreshold.queueLengthThreshold,
                processingTimeMultiplier:
                    stageThreshold.processingTimeMultiplier,
                slaViolationPercentage: stageThreshold.slaViolationPercentage,
                workloadPerStaff: stageThreshold.workloadPerStaff,
                bottleneckScoreThreshold:
                    stageThreshold.bottleneckScoreThreshold,
            };
        }

        // Fall back to global default (where stage is null)
        const globalThreshold = await this.prisma.bottleneckThreshold.findFirst(
            {
                where: { stage: { equals: null } },
            },
        );

        if (globalThreshold) {
            return {
                queueLengthThreshold: globalThreshold.queueLengthThreshold,
                processingTimeMultiplier:
                    globalThreshold.processingTimeMultiplier,
                slaViolationPercentage: globalThreshold.slaViolationPercentage,
                workloadPerStaff: globalThreshold.workloadPerStaff,
                bottleneckScoreThreshold:
                    globalThreshold.bottleneckScoreThreshold,
            };
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
     * Update thresholds for a stage or global default
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

        if (existingThreshold) {
            // Update existing threshold
            const updated = await this.prisma.bottleneckThreshold.update({
                where: { id: existingThreshold.id },
                data: thresholdData,
            });

            this.logger.log(
                `Updated threshold configuration for ${stage || 'global default'}`,
            );

            return updated;
        } else {
            // Create new threshold
            const created = await this.prisma.bottleneckThreshold.create({
                data: {
                    stage: stage || null,
                    ...thresholdData,
                    createdBy,
                },
            });

            this.logger.log(
                `Created threshold configuration for ${stage || 'global default'}`,
            );

            return created;
        }
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
}
