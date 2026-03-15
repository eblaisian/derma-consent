import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GdtModule } from './gdt/gdt.module';
import { ConsentModule } from './consent/consent.module';
import { StripeModule } from './stripe/stripe.module';
import { PdfModule } from './pdf/pdf.module';
import { PracticeModule } from './practice/practice.module';
import { TeamModule } from './team/team.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { BillingModule } from './billing/billing.module';
import { PatientModule } from './patient/patient.module';
import { SettingsModule } from './settings/settings.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PhotoModule } from './photo/photo.module';
import { TreatmentPlanModule } from './treatment-plan/treatment-plan.module';
import { PiiSanitizerInterceptor } from './common/pii-sanitizer.interceptor';
import { HealthModule } from './health/health.module';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { PlatformConfigModule } from './platform-config/platform-config.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { NotificationModule } from './notifications/notification.module';
import { CommunicationsModule } from './communications/communications.module';
import { StorageModule } from './storage/storage.module';
import { ScheduledTasksService } from './common/scheduled-tasks.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: ['req.headers.authorization', 'req.headers["x-auth-secret"]', 'req.headers["stripe-signature"]'],
        serializers: {
          req: (req: Record<string, unknown>) => ({
            method: req.method,
            url: req.url,
            id: req.id,
          }),
          res: (res: Record<string, unknown>) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 300 },
    ]),
    PrismaModule,
    PlatformConfigModule,
    HealthModule,
    AuthModule,
    GdtModule,
    ConsentModule,
    StripeModule,
    PdfModule,
    PracticeModule,
    TeamModule,
    EmailModule,
    StorageModule,
    AuditModule,
    BillingModule,
    PatientModule,
    SettingsModule,
    AnalyticsModule,
    PhotoModule,
    TreatmentPlanModule,
    AdminModule,
    AiModule,
    NotificationModule,
    CommunicationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PiiSanitizerInterceptor,
    },
    ScheduledTasksService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
