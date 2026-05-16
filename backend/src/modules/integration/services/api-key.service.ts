import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateApiKeyDto } from '../dto/integration.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
    constructor(private prisma: PrismaService) { }

    async createApiKey(dto: CreateApiKeyDto) {
        const rawKey = crypto.randomBytes(32).toString('hex');
        const apiKey = await this.prisma.apiKey.create({
            data: {
                key: rawKey,
                name: dto.name,
                description: dto.description,
                scopes: dto.scopes,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            },
        });
        // Return the raw key only on creation
        return { ...apiKey, key: rawKey };
    }

    async listApiKeys() {
        const keys = await this.prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
        // Mask the key value for security
        return keys.map(k => ({ ...k, key: `${k.key.substring(0, 8)}...` }));
    }

    async revokeApiKey(id: string) {
        const key = await this.prisma.apiKey.findUnique({ where: { id } });
        if (!key) throw new NotFoundException('API key not found');
        return this.prisma.apiKey.update({ where: { id }, data: { isActive: false } });
    }

    async rotateApiKey(id: string) {
        const key = await this.prisma.apiKey.findUnique({ where: { id } });
        if (!key) throw new NotFoundException('API key not found');
        const newRawKey = crypto.randomBytes(32).toString('hex');
        const updated = await this.prisma.apiKey.update({
            where: { id },
            data: { key: newRawKey, isActive: true, lastUsedAt: null },
        });
        return { ...updated, key: newRawKey };
    }
}
