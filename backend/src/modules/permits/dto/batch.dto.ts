import {
    IsArray,
    IsOptional,
    IsString,
    IsNotEmpty,
    ArrayMinSize,
    ArrayMaxSize,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchApproveItemDto {
    @IsString()
    @IsNotEmpty()
    applicationId: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    inspectionNotes?: string;
}

export class BatchApproveDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => BatchApproveItemDto)
    items: BatchApproveItemDto[];
}

export class BatchRejectItemDto {
    @IsString()
    @IsNotEmpty()
    applicationId: string;

    @IsString()
    @IsNotEmpty()
    reason: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class BatchRejectDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => BatchRejectItemDto)
    items: BatchRejectItemDto[];
}
