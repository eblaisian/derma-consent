import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode, errorPayload } from '../common/error-codes';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Platform admins bypass subscription checks
    if (user?.role === 'PLATFORM_ADMIN') {
      return true;
    }

    if (!user?.practiceId) {
      throw new ForbiddenException(errorPayload(ErrorCode.NO_PRACTICE_ASSIGNED));
    }

    // Check if practice is suspended
    const practice = await this.prisma.practice.findUnique({
      where: { id: user.practiceId },
      select: { isSuspended: true },
    });

    if (practice?.isSuspended) {
      throw new ForbiddenException(errorPayload(ErrorCode.PRACTICE_SUSPENDED));
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId: user.practiceId },
    });

    if (!subscription) {
      throw new ForbiddenException(errorPayload(ErrorCode.NO_ACTIVE_SUBSCRIPTION));
    }

    const now = new Date();

    // Allow trialing within trial period
    if (subscription.status === 'TRIALING') {
      if (subscription.trialEndsAt && subscription.trialEndsAt > now) {
        return true;
      }
      // Trial expired — update status so frontend shows correct UI
      await this.prisma.subscription.update({
        where: { practiceId: user.practiceId },
        data: { status: 'EXPIRED' },
      });
      throw new ForbiddenException(errorPayload(ErrorCode.TRIAL_EXPIRED));
    }

    // Allow active subscriptions (including those pending cancellation — access until period end)
    if (subscription.status === 'ACTIVE') {
      return true;
    }

    // Allow past-due subscriptions — Stripe retries payment automatically.
    // Only block when Stripe gives up and fires subscription.deleted (→ CANCELLED).
    if (subscription.status === 'PAST_DUE') {
      return true;
    }

    // Grace period: cancelled but still within the paid billing period
    if (subscription.status === 'CANCELLED' && subscription.currentPeriodEnd && subscription.currentPeriodEnd > now) {
      return true;
    }

    throw new ForbiddenException(errorPayload(ErrorCode.SUBSCRIPTION_REQUIRED));
  }
}
