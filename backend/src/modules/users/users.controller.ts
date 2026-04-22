import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateUserRolesDto } from './dto/user.dto';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * PATCH /api/users/:id/roles
     * Assign roles to staff member (admin only)
     */
    @Patch(':id/roles')
    async updateUserRoles(
        @Request() req: any,
        @Param('id') userId: string,
        @Body() dto: UpdateUserRolesDto,
    ) {
        // Check if current user is admin
        const currentUser = await this.usersService.findById(req.user.sub);
        if (!currentUser || !currentUser.roles.includes(Role.ADMIN)) {
            throw new ForbiddenException('Only admins can assign roles');
        }

        return this.usersService.updateUserRoles(userId, dto.roles);
    }

    /**
     * GET /api/users/staff
     * List staff members with roles (admin only)
     */
    @Get('staff')
    async listStaff(@Request() req: any) {
        // Check if current user is admin
        const currentUser = await this.usersService.findById(req.user.sub);
        if (!currentUser || !currentUser.roles.includes(Role.ADMIN)) {
            throw new ForbiddenException('Only admins can view staff list');
        }

        return this.usersService.listStaff();
    }
}
