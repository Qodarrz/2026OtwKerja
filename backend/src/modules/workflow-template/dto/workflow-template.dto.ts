import {
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
    IsInt,
    IsNumber,
    IsBoolean,
    Min,
    Max,
    ArrayMinSize,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { WorkflowStage, Role, PermitType } from '@prisma/client';

export class CreateWorkflowTemplateStageDto {
    @IsEnum(WorkflowStage)
    stage: WorkflowStage;

    @IsInt()
    @Min(0)
    order: number;

    @IsArray()
    @IsEnum(Role, { each: true })
    requiredRoles: Role[];

    @IsOptional()
    @IsInt()
    @Min(1)
    slaDurationHours?: number = 24;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    slaWarningPercent?: number = 0.8;

    @IsOptional()
    @IsBoolean()
    isRequired?: boolean = true;
}

export class CreateWorkflowTemplateDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(PermitType)
    permitType: PermitType;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateWorkflowTemplateStageDto)
    stages: CreateWorkflowTemplateStageDto[];
}

export class UpdateWorkflowTemplateDto extends PartialType(CreateWorkflowTemplateDto) {}
