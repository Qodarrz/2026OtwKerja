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
} from 'class-validator';

export class CreateApplicationDto {
    @IsEnum(PermitType)
    permitType: PermitType;

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
    @IsEnum(['submittedAt', 'updatedAt'])
    sortBy?: 'submittedAt' | 'updatedAt';

    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    limit?: number;
}
