import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpStatus,
    HttpCode,
    NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { BottleneckDetectionService } from '../services/bottleneck-detection.service';
import { BottleneckRecommendationService } from '../services/bottleneck-recommendation.service';
import { BottleneckThresholdService } from '../services/bottleneck-threshold.service';
import { BottleneckHistoricalService } from '../services/bottleneck-historical.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetHistoryQueryDto } from '../dto/bottleneck.dto';
import { UpdateThresholdDto } from '../dto/threshold.dto';
import { CreateResolutionDto } from '../dto/resolution.dto';

@Controller('bottlenecks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BottleneckController {
    constructor(
        private detectionService: BottleneckDetectionService,
        private recommendationService: BottleneckRecommendationService,
        private thresholdService: BottleneckThresholdService,
        private historicalService: BottleneckHistoricalService,
        private prisma: PrismaService,
    ) {}

    @Get('current')
    @Roles(
        Role.ADMIN,
        Role.DOCUMENT_VALIDATOR,
        Role.FIELD_INSPECTOR,
        Role.LEGALIZER,
    )
    async getCurrentBottlenecks(@Request() req) {
        const bottlenecks = await this.detectionService.getActiveBottlenecks();

        const bottlenecksWithRecommendations = await Promise.all(
            bottlenecks.map(async (bottleneck) => {
                const recommendations =
                    await this.recommendationService.getRecommendationsForBottleneck(
                        bottleneck.id,
                    );

                return {
                    id: bottleneck.id,
                    stage: bottleneck.stage,
                    score: bottleneck.score,
                    severity: bottleneck.severity,
                    metrics: {
                        queueLength: bottleneck.queueLength,
                        avgProcessingTime: bottleneck.avgProcessingTime,
                        slaViolationRate: bottleneck.slaViolationRate,
                        staffWorkload: bottleneck.staffWorkload,
                    },
                    detectedAt: bottleneck.detectedAt,
                    recommendations: recommendations.map((rec) => ({
                        id: rec.id,
                        type: rec.type,
                        priority: rec.priority,
                        description: rec.description,
                        estimatedImpact: rec.estimatedImpact,
                    })),
                };
            }),
        );

        return {
            bottlenecks: bottlenecksWithRecommendations,
        };
    }

    @Get('history')
    @Roles(
        Role.ADMIN,
        Role.DOCUMENT_VALIDATOR,
        Role.FIELD_INSPECTOR,
        Role.LEGALIZER,
    )
    async getHistory(@Query() query: GetHistoryQueryDto) {
        const page = query.page || 1;
        const limit = query.limit || 50;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (query.startDate || query.endDate) {
            where.detectedAt = {};
            if (query.startDate) {
                where.detectedAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.detectedAt.lte = new Date(query.endDate);
            }
        }

        if (query.stage) {
            where.stage = query.stage;
        }

        if (query.severity) {
            where.severity = query.severity;
        }

        const [data, total] = await Promise.all([
            this.prisma.bottleneckEvent.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    detectedAt: 'desc',
                },
                include: {
                    recommendations: true,
                    resolutionActions: true,
                },
            }),
            this.prisma.bottleneckEvent.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    @Get('recommendations/:bottleneckId')
    @Roles(
        Role.ADMIN,
        Role.DOCUMENT_VALIDATOR,
        Role.FIELD_INSPECTOR,
        Role.LEGALIZER,
    )
    async getRecommendations(@Param('bottleneckId') bottleneckId: string) {
        const bottleneck = await this.detectionService.getBottleneckById(
            bottleneckId,
        );

        if (!bottleneck) {
            throw new NotFoundException('Bottleneck not found');
        }

        const recommendations =
            await this.recommendationService.getRecommendationsForBottleneck(
                bottleneckId,
            );

        return {
            recommendations,
        };
    }

    @Post(':bottleneckId/resolve')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async resolveBottleneck(
        @Param('bottleneckId') bottleneckId: string,
        @Body() dto: CreateResolutionDto,
        @Request() req,
    ) {
        const bottleneck = await this.detectionService.getBottleneckById(
            bottleneckId,
        );

        if (!bottleneck) {
            throw new NotFoundException('Bottleneck not found');
        }

        const resolution = await this.prisma.bottleneckResolution.create({
            data: {
                bottleneckId,
                actionType: dto.actionType,
                performedBy: req.user.userId,
                notes: dto.notes,
            },
        });

        return resolution;
    }

    @Get('thresholds')
    @Roles(
        Role.ADMIN,
        Role.DOCUMENT_VALIDATOR,
        Role.FIELD_INSPECTOR,
        Role.LEGALIZER,
    )
    async getThresholds() {
        const thresholds = await this.thresholdService.getAllThresholds();
        return {
            thresholds,
        };
    }

    @Put('thresholds')
    @Roles(Role.ADMIN)
    async updateThresholds(@Body() dto: UpdateThresholdDto, @Request() req) {
        const threshold = await this.thresholdService.updateThresholds({
            ...dto,
            createdBy: req.user.userId,
        });

        return threshold;
    }

    @Get('reports/effectiveness')
    @Roles(
        Role.ADMIN,
        Role.DOCUMENT_VALIDATOR,
        Role.FIELD_INSPECTOR,
        Role.LEGALIZER,
    )
    async getEffectivenessReport() {
        const report =
            await this.historicalService.getResolutionEffectiveness();
        return report;
    }

    @Get('health')
    async healthCheck() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;

            return {
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                database: 'disconnected',
                timestamp: new Date().toISOString(),
            };
        }
    }
}
