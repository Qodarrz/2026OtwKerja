import { IsString, IsOptional, IsArray, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PermitType, WorkflowStage } from '@prisma/client';

export class CreateApiKeyDto {
    @IsString() name: string;
    @IsOptional() @IsString() description?: string;
    @IsArray() @IsString({ each: true }) scopes: string[];
    @IsOptional() @IsDateString() expiresAt?: string;
}

export class IntegrationFiltersDto {
    @IsOptional() @IsEnum(WorkflowStage) status?: WorkflowStage;
    @IsOptional() @IsEnum(PermitType) permitType?: PermitType;
    @IsOptional() @IsInt() @Min(1) @Type(() => Number) page?: number;
    @IsOptional() @IsInt() @Min(1) @Type(() => Number) limit?: number;
}
