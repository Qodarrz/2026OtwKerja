import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AnalyticsService } from './src/modules/permits/services/analytics.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const analyticsService = app.get(AnalyticsService);
  
  const metrics = await analyticsService.getDashboardMetrics();
  console.log("Metrics ON_TIME:", metrics.onTimePercentage);
  console.log("Metrics OVERDUE:", metrics.overdueCount);
  
  const bottlenecks = await analyticsService.getStageBottlenecks();
  console.log("Bottlenecks:", bottlenecks);
  
  await app.close();
}
bootstrap();
