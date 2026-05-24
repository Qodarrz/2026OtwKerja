import { PermitType, LandType, WorkflowStage } from '@prisma/client';
import {
    IsEnum,
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsInt,
    Min,
    IsNotEmpty,
    IsDateString,
    IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateApplicationDto {
    @IsEnum(PermitType)
    permitType: PermitType;

    @IsOptional()
    dynamicData?: any;

    // Building Permit fields
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    locationAddress?: string;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    landSize?: number;

    @IsOptional()
    @IsEnum(LandType)
    landType?: LandType;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    buildingHeight?: number;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    njopValue?: number;

    @IsOptional()
    @IsBoolean()
    isStrategicLocation?: boolean;

    // Business License fields
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    businessName?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    businessType?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    businessLocation?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    estimatedEmployees?: number;
}

export class UpdateApplicationDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    locationAddress?: string;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    landSize?: number;

    @IsOptional()
    @IsEnum(LandType)
    landType?: LandType;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    buildingHeight?: number;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    njopValue?: number;

    @IsOptional()
    @IsBoolean()
    isStrategicLocation?: boolean;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    businessName?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    businessType?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    businessLocation?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    estimatedEmployees?: number;
}

export class ListApplicationsQuery {
    @IsOptional()
    @IsEnum(WorkflowStage)
    status?: WorkflowStage;

    @IsOptional()
    @IsEnum(PermitType)
    permitType?: PermitType;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(['submittedAt', 'updatedAt', 'createdAt', 'referenceNumber'])
    sortBy?: 'submittedAt' | 'updatedAt' | 'createdAt' | 'referenceNumber';

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number;

    // Date range filters
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    // Multi-value filters (comma-separated in query string)
    @IsOptional()
    @IsArray()
    @IsEnum(WorkflowStage, { each: true })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.split(',').map((v: string) => v.trim()) : value,
    )
    stages?: WorkflowStage[];

    @IsOptional()
    @IsArray()
    @IsEnum(LandType, { each: true })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.split(',').map((v: string) => v.trim()) : value,
    )
    landTypes?: LandType[];

    // Numeric range filters
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minLandSize?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxLandSize?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minNjopValue?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxNjopValue?: number;

    // Boolean filter
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    isStrategicLocation?: boolean;

    // Sort direction
    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
}
