import { Controller, Get, Post, Delete, Param, Body, Query, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiKeyService } from '../services/api-key.service';
import { IntegrationService } from '../services/integration.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { RequireScopes } from '../decorators/api-scopes.decorator';
import { CreateApiKeyDto, IntegrationFiltersDto } from '../dto/integration.dto';

@Controller('api/v1/integration')
export class IntegrationController {
    constructor(
        private apiKeyService: ApiKeyService,
        private integrationService: IntegrationService,
    ) { }

    private validateAdminSecret(secret: string | undefined) {
        const adminSecret = process.env.INTEGRATION_ADMIN_SECRET;
        if (!adminSecret || secret !== adminSecret) {
            throw new UnauthorizedException('Invalid admin secret');
        }
    }

    // ── API Key Management (admin secret protected) ──────────────────────────

    @Post('keys')
    async createApiKey(@Headers('x-admin-secret') secret: string, @Body() dto: CreateApiKeyDto) {
        this.validateAdminSecret(secret);
        return this.wrapResponse(await this.apiKeyService.createApiKey(dto));
    }

    @Get('keys')
    async listApiKeys(@Headers('x-admin-secret') secret: string) {
        this.validateAdminSecret(secret);
        return this.wrapResponse(await this.apiKeyService.listApiKeys());
    }

    @Delete('keys/:id')
    async revokeApiKey(@Headers('x-admin-secret') secret: string, @Param('id') id: string) {
        this.validateAdminSecret(secret);
        return this.wrapResponse(await this.apiKeyService.revokeApiKey(id));
    }

    // ── Integration endpoints (API key protected) ────────────────────────────

    @Get('applications/:referenceNumber')
    @UseGuards(ApiKeyGuard)
    @RequireScopes('read:applications')
    async getApplicationStatus(@Param('referenceNumber') referenceNumber: string) {
        return this.wrapResponse(await this.integrationService.getApplicationStatus(referenceNumber));
    }

    @Get('applications')
    @UseGuards(ApiKeyGuard)
    @RequireScopes('read:applications')
    async listApplications(@Query() filters: IntegrationFiltersDto) {
        return this.wrapResponse(await this.integrationService.listApplications(filters));
    }

    @Get('stats')
    @UseGuards(ApiKeyGuard)
    @RequireScopes('read:stats')
    async getStats() {
        return this.wrapResponse(await this.integrationService.getStatsSummary());
    }

    private wrapResponse(data: any) {
        return { success: true, data, meta: { timestamp: new Date().toISOString(), version: '1.0' } };
    }
}
