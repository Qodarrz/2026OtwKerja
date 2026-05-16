import {
    IsOptional,
    IsEnum,
    IsNumber,
    IsString,
    Min,
    Max,
} from 'class-validator';
import { WorkflowStage } from '@prisma/client';

export class UpdateThresholdDto {
    @IsOptional()
    @IsEnum(WorkflowStage)
    stage?: WorkflowStage;

    @IsNumber()
    @Min(0)
    @Max(1000)
    queueLengthThreshold: number;

    @IsNumber()
    @Min(0.1)
    @Max(10)
    processingTimeMultiplier: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    slaViolationPercentage: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    workloadPerStaff: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    bottleneckScoreThreshold: number;

    @IsString()
    createdBy: string;
}
