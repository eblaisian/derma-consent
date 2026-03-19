import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/ai')
export class AiStatusController {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('public-status')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async publicStatus() {
    const enabled = await this.ai.isConfigured();
    return { aiEnabled: enabled };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async authenticatedStatus(@CurrentUser() user: CurrentUserPayload) {
    const aiConfigured = await this.ai.isConfigured();

    const noPremiumFeatures = { communications: false, aftercare: false, analyticsInsights: false };

    if (!aiConfigured) {
      return {
        aiEnabled: false,
        features: {
          explainer: false,
          communications: false,
          aftercare: false,
          analyticsInsights: false,
          noShowRisk: true,
          retention: true,
        },
        premiumFeatures: noPremiumFeatures,
      };
    }

    let isPremiumPlan = false;
    if (user.practiceId) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { practiceId: user.practiceId },
        select: { plan: true },
      });
      const premiumPlans = ['PROFESSIONAL', 'ENTERPRISE'];
      isPremiumPlan = !!(subscription && premiumPlans.includes(subscription.plan));
    }

    return {
      aiEnabled: true,
      features: {
        explainer: true,
        communications: isPremiumPlan,
        aftercare: isPremiumPlan,
        analyticsInsights: isPremiumPlan,
        noShowRisk: true,
        retention: true,
      },
      premiumFeatures: {
        communications: !isPremiumPlan,
        aftercare: !isPremiumPlan,
        analyticsInsights: !isPremiumPlan,
      },
    };
  }
}
