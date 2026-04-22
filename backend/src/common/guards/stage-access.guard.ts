import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { Role, WorkflowStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StageAccessGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.userId) {
            throw new ForbiddenException('User not authenticated');
        }

        // Get application ID from request params
        const applicationId = request.params.id;

        if (!applicationId) {
            throw new ForbiddenException('Application ID not provided');
        }

        // Fetch application with current stage
        const application = await this.prisma.permitApplication.findUnique({
            where: { id: applicationId },
            select: { currentStage: true },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Fetch user with roles
        const userWithRoles = await this.prisma.user.findUnique({
            where: { id: user.userId },
            select: { roles: true },
        });

        if (!userWithRoles) {
            throw new ForbiddenException('User not found');
        }

        // ADMIN has access to all stages
        if (userWithRoles.roles.includes(Role.ADMIN)) {
            return true;
        }

        // Map workflow stages to required roles
        const stageRoleMap: Record<WorkflowStage, Role[]> = {
            [WorkflowStage.DRAFT]: [], // No specific role required for draft
            [WorkflowStage.DOCUMENT_CHECK]: [Role.DOCUMENT_VALIDATOR],
            [WorkflowStage.FIELD_INSPECTION]: [Role.FIELD_INSPECTOR],
            [WorkflowStage.LEGALIZATION]: [Role.LEGALIZER],
            [WorkflowStage.APPROVED]: [], // No validation actions on approved applications
            [WorkflowStage.REJECTED]: [], // No validation actions on rejected applications
        };

        const requiredRoles = stageRoleMap[application.currentStage];

        // If no specific roles required for this stage, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Check if user has at least one of the required roles for this stage
        const hasRequiredRole = requiredRoles.some((role) =>
            userWithRoles.roles.includes(role),
        );

        if (!hasRequiredRole) {
            throw new ForbiddenException(
                `User does not have the required role to access applications in ${application.currentStage} stage`,
            );
        }

        return true;
    }
}
