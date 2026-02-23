import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformAdminGuard } from '../auth/platform-admin.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/admin/dashboard')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

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
}
