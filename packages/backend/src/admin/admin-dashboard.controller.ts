import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UsageMeterService } from '../usage/usage-meter.service';

@Controller('api/admin/dashboard')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminDashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageMeter: UsageMeterService,
  ) {}

  @Get()
  async getDashboard() {
    const [
      totalPractices,
      totalUsers,
      totalConsents,
      consentsByStatus,
      subscriptionsByPlan,
      recentSignups,
      revenueResult,
    ] = await Promise.all([
      this.prisma.practice.count(),
      this.prisma.user.count({ where: { role: { not: 'PLATFORM_ADMIN' } } }),
      this.prisma.consentForm.count(),
      this.prisma.consentForm.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.subscription.groupBy({
        by: ['plan'],
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
        _count: { plan: true },
      }),
      this.prisma.practice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { users: true, consentForms: true } },
          subscription: { select: { plan: true, status: true } },
        },
      }),
      this.prisma.consentForm.aggregate({
        where: { paymentAmountCents: { not: null } },
        _sum: { paymentAmountCents: true },
      }),
    ]);

    const statusBreakdown: Record<string, number> = {};
    for (const item of consentsByStatus) {
      statusBreakdown[item.status] = item._count.status;
    }

    const planDistribution: Record<string, number> = {};
    for (const item of subscriptionsByPlan) {
      planDistribution[item.plan] = item._count.plan;
    }

    return {
      totalPractices,
      totalUsers,
      totalConsents,
      activeSubscriptions: Object.values(planDistribution).reduce((a, b) => a + b, 0),
      totalRevenueCents: revenueResult._sum.paymentAmountCents ?? 0,
      statusBreakdown,
      planDistribution,
      recentSignups,
    };
  }

  @Get('usage')
  async getUsage() {
    // Current month period key (for platform-wide aggregates)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const calendarPeriod = `${year}-${month}`;

    // Aggregate usage across all practices for the current month
    // Include both calendar-month and Stripe-period keys that start with the current month
    const aggregates = await this.prisma.usageLedger.groupBy({
      by: ['resource'],
      where: {
        OR: [
          { periodKey: calendarPeriod },
          { periodKey: { startsWith: `STRIPE-` }, updatedAt: { gte: new Date(year, now.getMonth(), 1) } },
        ],
      },
      _sum: { count: true },
    });

    const platformTotals: Record<string, number> = {};
    for (const agg of aggregates) {
      platformTotals[agg.resource] = Number(agg._sum.count ?? 0);
    }

    // Top 5 consumers per resource
    const topConsumers = await this.prisma.usageLedger.findMany({
      where: {
        OR: [
          { periodKey: calendarPeriod },
          { periodKey: { startsWith: `STRIPE-` }, updatedAt: { gte: new Date(year, now.getMonth(), 1) } },
        ],
        count: { gt: 0 },
      },
      orderBy: { count: 'desc' },
      take: 20,
      select: {
        resource: true,
        count: true,
        practice: { select: { id: true, name: true } },
      },
    });

    // Group by resource, take top 5 each
    const topByResource: Record<string, { practiceId: string; practiceName: string; count: number }[]> = {};
    for (const entry of topConsumers) {
      const key = entry.resource;
      if (!topByResource[key]) topByResource[key] = [];
      if (topByResource[key].length < 5) {
        topByResource[key].push({
          practiceId: entry.practice.id,
          practiceName: entry.practice.name,
          count: Number(entry.count),
        });
      }
    }

    // Count practices with alerts this period
    const practicesNearLimit = await this.prisma.usageAlert.findMany({
      where: {
        OR: [
          { periodKey: calendarPeriod },
          { periodKey: { startsWith: `STRIPE-` }, sentAt: { gte: new Date(year, now.getMonth(), 1) } },
        ],
      },
      select: { practiceId: true },
      distinct: ['practiceId'],
    });

    return {
      period: calendarPeriod,
      platformTotals,
      topConsumers: topByResource,
      practicesNearLimitCount: practicesNearLimit.length,
    };
  }
}
