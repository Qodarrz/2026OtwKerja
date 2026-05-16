import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { GlobalAuditInterceptor } from './common/interceptors/global-audit.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PermitModule } from './modules/permits/permit.module';
import { WorkflowModule } from './modules/permits/workflow.module';
import { NotificationModule } from './modules/permits/notification.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { BottleneckModule } from './modules/bottleneck/bottleneck.module';
import { IntegrationModule } from './modules/integration/integration.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    PrismaModule,
    AuditLogModule,
    AuthModule,
    UsersModule,
    PermitModule,
    WorkflowModule,
    NotificationModule,
    FeedbackModule,
    BottleneckModule,
    IntegrationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalAuditInterceptor,
    },
  ],
})
export class AppModule {}
