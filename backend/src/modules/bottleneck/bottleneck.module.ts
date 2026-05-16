import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { BottleneckController } from './controllers/bottleneck.controller';
import { BottleneckDetectionService } from './services/bottleneck-detection.service';
import { BottleneckThresholdService } from './services/bottleneck-threshold.service';
import { BottleneckRecommendationService } from './services/bottleneck-recommendation.service';
import { BottleneckAlertService } from './services/bottleneck-alert.service';
import { BottleneckHistoricalService } from './services/bottleneck-historical.service';

@Module({
    imports: [PrismaModule],
    controllers: [BottleneckController],
    providers: [
        BottleneckDetectionService,
        BottleneckThresholdService,
        BottleneckRecommendationService,
        BottleneckAlertService,
        BottleneckHistoricalService,
    ],
    exports: [
        BottleneckDetectionService,
        BottleneckThresholdService,
        BottleneckRecommendationService,
        BottleneckAlertService,
        BottleneckHistoricalService,
    ],
})
export class BottleneckModule {}
