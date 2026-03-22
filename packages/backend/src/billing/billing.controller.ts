import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './billing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { UsageMeterService } from '../usage/usage-meter.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly platformConfig: PlatformConfigService,
    private readonly usageMeter: UsageMeterService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('plans')
  async getPlans() {
    const [starterMonthly, starterYearly, proMonthly, proYearly] = await Promise.all([
      this.platformConfig.get('stripe.starterMonthlyPriceId'),
      this.platformConfig.get('stripe.starterYearlyPriceId'),
      this.platformConfig.get('stripe.professionalMonthlyPriceId'),
      this.platformConfig.get('stripe.professionalYearlyPriceId'),
    ]);
    return {
      starter: { monthly: starterMonthly || null, yearly: starterYearly || null },
      professional: { monthly: proMonthly || null, yearly: proYearly || null },
    };
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getSubscription(@CurrentUser() user: CurrentUserPayload) {
    return this.billingService.getSubscription(user.practiceId!);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getUsage(@CurrentUser() user: CurrentUserPayload) {
    const summary = await this.usageMeter.getUsageSummary(user.practiceId!);

    // Also include consent form count (existing feature, separate from resource quotas)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const consentsUsed = await this.prisma.consentForm.count({
      where: {
        practiceId: user.practiceId!,
        createdAt: { gte: monthStart },
      },
    });

    const limitKey = `plans.${summary.plan === 'FREE_TRIAL' ? 'freeTrialLimit' : summary.plan === 'STARTER' ? 'starterLimit' : summary.plan === 'PROFESSIONAL' ? 'professionalLimit' : 'enterpriseLimit'}`;
    const consentLimit = parseInt((await this.platformConfig.get(limitKey)) || '-1', 10);

    return {
      plan: summary.plan,
      periodKey: summary.periodKey,
      daysUntilReset: summary.daysUntilReset,
      resources: summary.resources,
      consents: {
        used: consentsUsed,
        limit: consentLimit > 0 ? consentLimit : null,
      },
    };
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.billingService.createCheckoutSession(
      user.practiceId!,
      dto.priceId,
      user.email,
    );
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createPortal(@CurrentUser() user: CurrentUserPayload) {
    return this.billingService.createPortalSession(user.practiceId!);
  }
}
