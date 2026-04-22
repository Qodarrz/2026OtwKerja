import { Role } from '@prisma/client';
import { IsArray, IsEnum } from 'class-validator';

export class UpdateUserRolesDto {
    @IsArray()
    @IsEnum(Role, { each: true })
    roles: Role[];
}
