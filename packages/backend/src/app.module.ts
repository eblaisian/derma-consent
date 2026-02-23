import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
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
    AuditModule,
    BillingModule,
    PatientModule,
    SettingsModule,
    AnalyticsModule,
    PhotoModule,
    TreatmentPlanModule,
    AdminModule,
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
