import {
    IsOptional,
    IsEnum,
    IsDateString,
    IsInt,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowStage, BottleneckSeverity } from '@prisma/client';

export class GetHistoryQueryDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsEnum(WorkflowStage)
    stage?: WorkflowStage;

    @IsOptional()
    @IsEnum(BottleneckSeverity)
    severity?: BottleneckSeverity;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 50;
}
