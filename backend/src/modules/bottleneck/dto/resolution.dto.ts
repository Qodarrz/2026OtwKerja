import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ResolutionActionType } from '@prisma/client';

export class CreateResolutionDto {
    @IsEnum(ResolutionActionType)
    actionType: ResolutionActionType;

    @IsOptional()
    @IsString()
    notes?: string;
}
