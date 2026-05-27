import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AnalyticsService } from './src/modules/permits/services/analytics.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const analyticsService = app.get(AnalyticsService);
  
  try {
    const res = await analyticsService.getStageBottlenecks();
    console.log("Success:", res);
  } catch(e) {
    console.error("Error:", e);
  }
  
  await app.close();
}
main();
