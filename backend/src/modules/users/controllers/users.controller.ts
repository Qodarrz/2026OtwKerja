import {
    Body,
    Controller,
    Get,
    Post,
    Param,
    Patch,
    Delete,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UpdateUserRolesDto } from '../dto/user.dto';
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
     * GET /api/users
     * List regular users (admin only)
     */
    @Get()
    async listUsers(@Request() req: any) {
        // Check if current user is admin
        const currentUser = await this.usersService.findById(req.user.sub);
        if (!currentUser || !currentUser.roles.includes(Role.ADMIN)) {
            throw new ForbiddenException('Only admins can view user list');
        }

        return this.usersService.listUsers();
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

    @Patch(':id')
    async updateUser(@Request() req: any, @Param('id') id: string, @Body() data: any) {
        // Check if current user is admin
        const currentUser = await this.usersService.findById(req.user.sub);
        if (!currentUser || !currentUser.roles.includes(Role.ADMIN)) {
            throw new ForbiddenException('Only admins can update users');
        }

        return this.usersService.updateUser(id, data);
    }

    /**
     * DELETE /api/users/me
     * Delete my own account
     */
    @Delete('me')
    async deleteMyAccount(@Request() req: any, @Body() data: any) {
        return this.usersService.deleteMyAccount(req.user.sub, data.password);
    }

    @Delete(':id')
    async deleteUser(@Request() req: any, @Param('id') id: string) {
        // Check if current user is admin
        const currentUser = await this.usersService.findById(req.user.sub);
        if (!currentUser || !currentUser.roles.includes(Role.ADMIN)) {
            throw new ForbiddenException('Only admins can delete users');
        }

        return this.usersService.deleteUser(id);
    }

    @Post()
    async createUser(@Request() req: any, @Body() data: any) {
        // Check if current user is admin
        const currentUser = await this.usersService.findById(req.user.sub);
        if (!currentUser || !currentUser.roles.includes(Role.ADMIN)) {
            throw new ForbiddenException('Only admins can create users');
        }

        return this.usersService.create(data);
    }

    /**
     * GET /api/users/me/profile
     */
    @Get('me/profile')
    async getMyProfile(@Request() req: any) {
        return this.usersService.getProfile(req.user.sub);
    }

    /**
     * PATCH /api/users/me/profile
     */
    @Patch('me/profile')
    async updateMyProfile(@Request() req: any, @Body() data: any) {
        return this.usersService.updateMyProfile(req.user.sub, data);
    }

    /**
     * GET /api/users/me/history
     */
    @Get('me/history')
    async getMyHistory(@Request() req: any) {
        return this.usersService.getActivityHistory(req.user.sub);
    }

    /**
     * GET /api/users/me/settings
     */
    @Get('me/settings')
    async getMySettings(@Request() req: any) {
        return this.usersService.getNotificationSettings(req.user.sub);
    }

    /**
     * PATCH /api/users/me/settings
     */
    @Patch('me/settings')
    async updateMySettings(@Request() req: any, @Body() data: any) {
        return this.usersService.updateNotificationSettings(req.user.sub, data);
    }

    /**
     * PATCH /api/users/me/password
     */
    @Patch('me/password')
    async updateMyPassword(@Request() req: any, @Body() data: any) {
        return this.usersService.changePassword(req.user.sub, data.currentPassword, data.newPassword);
    }
}
