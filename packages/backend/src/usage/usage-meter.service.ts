import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { ErrorCode, errorPayload } from '../common/error-codes';
import { UsageResource, SubscriptionPlan } from '@prisma/client';

export type ResourceType = 'SMS' | 'EMAIL' | 'AI_EXPLAINER' | 'STORAGE_BYTES';

export interface ResourceUsage {
  resource: ResourceType;
  used: number;
  limit: number | null; // null = unlimited
}

export interface UsageSummary {
  plan: SubscriptionPlan;
  periodKey: string;
  daysUntilReset: number;
  resources: Record<ResourceType, { used: number; limit: number | null }>;
}

/** Map resource enum → PlatformConfig key prefix */
const RESOURCE_CONFIG_KEY: Record<ResourceType, string> = {
  SMS: 'usage.sms',
  EMAIL: 'usage.email',
  AI_EXPLAINER: 'usage.aiExplainer',
  STORAGE_BYTES: 'usage.storageBytes',
};

/** Map SubscriptionPlan → config key suffix */
const PLAN_SUFFIX: Record<SubscriptionPlan, string> = {
  FREE_TRIAL: 'freeTrialLimit',
  STARTER: 'starterLimit',
  PROFESSIONAL: 'professionalLimit',
  ENTERPRISE: 'enterpriseLimit',
};

@Injectable()
export class UsageMeterService {
  private readonly logger = new Logger(UsageMeterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  /**
   * Check quota and increment usage atomically.
   * Throws ForbiddenException if the quota would be exceeded.
   * Returns the new count after increment.
   */
  async checkAndIncrement(
    practiceId: string,
    resource: ResourceType,
    amount: number = 1,
    errorCode: ErrorCode = ErrorCode.QUOTA_EXCEEDED,
  ): Promise<number> {
    const periodKey = await this.resolvePeriodKey(practiceId);
    const plan = await this.resolvePlan(practiceId);
    const limit = await this.getPlanLimit(plan, resource);

    // Check current usage before incrementing (if there's a limit)
    if (limit !== null) {
      const current = await this.getCurrentCount(practiceId, resource, periodKey);
      if (current + amount > limit) {
        throw new ForbiddenException(
          errorPayload(errorCode, `Monthly ${resource} quota (${limit}) reached`),
        );
      }
    }

    // Atomic upsert increment
    const result = await this.prisma.usageLedger.upsert({
      where: {
        practiceId_resource_periodKey: {
          practiceId,
          resource: resource as UsageResource,
          periodKey,
        },
      },
      create: {
        practiceId,
        resource: resource as UsageResource,
        periodKey,
        count: amount,
      },
      update: {
        count: { increment: amount },
      },
    });

    return Number(result.count);
  }

  /**
   * Increment usage without checking quota (for metered-but-never-blocked resources like email).
   */
  async increment(
    practiceId: string,
    resource: ResourceType,
    amount: number = 1,
  ): Promise<number> {
    const periodKey = await this.resolvePeriodKey(practiceId);

    const result = await this.prisma.usageLedger.upsert({
      where: {
        practiceId_resource_periodKey: {
          practiceId,
          resource: resource as UsageResource,
          periodKey,
        },
      },
      create: {
        practiceId,
        resource: resource as UsageResource,
        periodKey,
        count: amount,
      },
      update: {
        count: { increment: amount },
      },
    });

    return Number(result.count);
  }

  /**
   * Get current usage count for a specific resource in the current billing period.
   */
  async getCurrentCount(
    practiceId: string,
    resource: ResourceType,
    periodKey?: string,
  ): Promise<number> {
    const key = periodKey ?? (await this.resolvePeriodKey(practiceId));

    const entry = await this.prisma.usageLedger.findUnique({
      where: {
        practiceId_resource_periodKey: {
          practiceId,
          resource: resource as UsageResource,
          periodKey: key,
        },
      },
    });

    return entry ? Number(entry.count) : 0;
  }

  /**
   * Get full usage summary for a practice — all resources with counts and limits.
   */
  async getUsageSummary(practiceId: string): Promise<UsageSummary> {
    const periodKey = await this.resolvePeriodKey(practiceId);
    const plan = await this.resolvePlan(practiceId);
    const daysUntilReset = await this.getDaysUntilReset(practiceId);

    const resources: ResourceType[] = ['SMS', 'EMAIL', 'AI_EXPLAINER', 'STORAGE_BYTES'];

    const entries = await this.prisma.usageLedger.findMany({
      where: {
        practiceId,
        periodKey,
        resource: { in: resources as UsageResource[] },
      },
    });

    const countMap = new Map(entries.map((e) => [e.resource, Number(e.count)]));

    const result: Record<string, { used: number; limit: number | null }> = {};
    for (const r of resources) {
      result[r] = {
        used: countMap.get(r as UsageResource) ?? 0,
        limit: await this.getPlanLimit(plan, r),
      };
    }

    return {
      plan,
      periodKey,
      daysUntilReset,
      resources: result as UsageSummary['resources'],
    };
  }

  /**
   * Check if a resource has exceeded a given threshold percentage.
   */
  async isAboveThreshold(
    practiceId: string,
    resource: ResourceType,
    thresholdPercent: number,
  ): Promise<{ exceeded: boolean; used: number; limit: number | null; percent: number }> {
    const periodKey = await this.resolvePeriodKey(practiceId);
    const plan = await this.resolvePlan(practiceId);
    const limit = await this.getPlanLimit(plan, resource);
    const used = await this.getCurrentCount(practiceId, resource, periodKey);

    if (limit === null) {
      return { exceeded: false, used, limit, percent: 0 };
    }

    const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
    return { exceeded: percent >= thresholdPercent, used, limit, percent };
  }

  /**
   * Get the current billing period key for a practice.
   * Stripe-aligned for paid subscriptions, calendar month for trials.
   */
  async resolvePeriodKey(practiceId: string): Promise<string> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
      select: {
        stripeSubscriptionId: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        status: true,
      },
    });

    // Stripe-aligned period if active paid subscription with period data
    if (
      subscription?.stripeSubscriptionId &&
      subscription.currentPeriodStart &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd > new Date() &&
      (subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE')
    ) {
      const start = subscription.currentPeriodStart.toISOString().split('T')[0];
      return `STRIPE-${subscription.stripeSubscriptionId}-${start}`;
    }

    // Calendar month fallback (trials, expired, no subscription)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // ── Private helpers ──

  private async resolvePlan(practiceId: string): Promise<SubscriptionPlan> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
      select: { plan: true },
    });
    return subscription?.plan ?? 'FREE_TRIAL';
  }

  private async getPlanLimit(
    plan: SubscriptionPlan,
    resource: ResourceType,
  ): Promise<number | null> {
    const configKey = `${RESOURCE_CONFIG_KEY[resource]}.${PLAN_SUFFIX[plan]}`;
    const value = parseInt((await this.platformConfig.get(configKey)) || '-1', 10);
    return value === -1 ? null : value;
  }

  private async getDaysUntilReset(practiceId: string): Promise<number> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { practiceId },
      select: {
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
        status: true,
      },
    });

    if (
      subscription?.stripeSubscriptionId &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd > new Date() &&
      (subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE')
    ) {
      return Math.max(0, Math.ceil(
        (subscription.currentPeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
      ));
    }

    // Calendar month: days until end of month
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.max(0, lastDay.getDate() - now.getDate());
  }
}
