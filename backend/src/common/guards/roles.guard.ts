import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Get required roles from decorator metadata
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Get user from request (set by JwtAuthGuard)
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.userId) {
            return false;
        }

        // Fetch user with roles from database
        const userWithRoles = await this.prisma.user.findUnique({
            where: { id: user.userId },
            select: { roles: true },
        });

        if (!userWithRoles) {
            return false;
        }

        // Check if user has at least one of the required roles
        return requiredRoles.some((role) => userWithRoles.roles.includes(role));
    }
}
