import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';

export const REQUIRED_SCOPES_KEY = 'requiredScopes';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private prisma: PrismaService, private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKeyHeader = request.headers['x-api-key'];

        if (!apiKeyHeader) throw new UnauthorizedException('API key required');

        const apiKey = await this.prisma.apiKey.findUnique({ where: { key: apiKeyHeader } });

        if (!apiKey || !apiKey.isActive) throw new UnauthorizedException('Invalid API key');

        if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
            throw new ForbiddenException('API key has expired');
        }

        // Update lastUsedAt (fire and forget)
        this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => { });

        // Check required scopes
        const requiredScopes = this.reflector.getAllAndOverride<string[]>(REQUIRED_SCOPES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (requiredScopes && requiredScopes.length > 0) {
            const hasAllScopes = requiredScopes.every(scope => apiKey.scopes.includes(scope));
            if (!hasAllScopes) throw new ForbiddenException('Insufficient API key scopes');
        }

        request.apiKey = apiKey;
        return true;
    }
}
