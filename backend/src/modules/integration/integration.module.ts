import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ApiKeyService } from './services/api-key.service';
import { IntegrationService } from './services/integration.service';
import { IntegrationController } from './controllers/integration.controller';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
    imports: [PrismaModule],
    controllers: [IntegrationController],
    providers: [ApiKeyService, IntegrationService, ApiKeyGuard],
    exports: [ApiKeyService],
})
export class IntegrationModule { }
