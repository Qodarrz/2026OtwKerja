import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationModule } from '../permits/notification.module';
import { WorkflowModule } from '../permits/workflow.module';
import { BottleneckController } from './controllers/bottleneck.controller';
import { BottleneckDetectionService } from './services/bottleneck-detection.service';
import { BottleneckThresholdService } from './services/bottleneck-threshold.service';
import { BottleneckRecommendationService } from './services/bottleneck-recommendation.service';
import { BottleneckAlertService } from './services/bottleneck-alert.service';
import { BottleneckHistoricalService } from './services/bottleneck-historical.service';
import { BottleneckProcessor } from './processors/bottleneck.processor';
import { BottleneckGateway } from './gateways/bottleneck.gateway';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'bottleneck-detection',
        }),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '7d' },
        }),
        PrismaModule,
        AuditLogModule,
        NotificationModule,
        WorkflowModule,
    ],
    controllers: [BottleneckController],
    providers: [
        BottleneckDetectionService,
        BottleneckThresholdService,
        BottleneckRecommendationService,
        BottleneckAlertService,
        BottleneckHistoricalService,
        BottleneckProcessor,
        BottleneckGateway,
    ],
    exports: [
        BottleneckDetectionService,
        BottleneckThresholdService,
        BottleneckRecommendationService,
        BottleneckAlertService,
        BottleneckHistoricalService,
    ],
})
export class BottleneckModule implements OnModuleInit {
    constructor(
        private readonly processor: BottleneckProcessor,
        private readonly gateway: BottleneckGateway,
    ) {}

    /**
     * Wire the WebSocket gateway into the processor after all providers are
     * instantiated. This avoids a circular dependency between the two classes
     * while still allowing the processor to broadcast events.
     */
    onModuleInit(): void {
        this.processor.setGateway(this.gateway);
    }
}
