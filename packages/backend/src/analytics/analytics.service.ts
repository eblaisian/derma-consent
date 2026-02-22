import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class AnalyticsService {
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = stripeKey ? new Stripe(stripeKey) : null;
  }

  async getOverview(practiceId: string) {
    const [total, pending, signed, completed, revoked] = await Promise.all([
      this.prisma.consentForm.count({ where: { practiceId } }),
      this.prisma.consentForm.count({ where: { practiceId, status: 'PENDING' } }),
      this.prisma.consentForm.count({ where: { practiceId, status: 'SIGNED' } }),
      this.prisma.consentForm.count({ where: { practiceId, status: 'COMPLETED' } }),
      this.prisma.consentForm.count({ where: { practiceId, status: 'REVOKED' } }),
    ]);

    const patients = await this.prisma.patient.count({ where: { practiceId } });

    return { total, pending, signed, completed, revoked, patients };
  }

  async getByType(practiceId: string) {
    const results = await this.prisma.consentForm.groupBy({
      by: ['type'],
      where: { practiceId },
      _count: { id: true },
    });

    return results.map((r) => ({
      type: r.type,
      count: r._count.id,
    }));
  }

  async getByPeriod(practiceId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const consents = await this.prisma.consentForm.findMany({
      where: {
        practiceId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const byDate: Record<string, { created: number; signed: number }> = {};

    for (const consent of consents) {
      const date = consent.createdAt.toISOString().split('T')[0];
      if (!byDate[date]) byDate[date] = { created: 0, signed: 0 };
      byDate[date].created++;
      if (consent.status === 'SIGNED' || consent.status === 'COMPLETED' || consent.status === 'PAID') {
        byDate[date].signed++;
      }
    }

    return Object.entries(byDate).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  }

  async getConversion(practiceId: string) {
    const statuses = await this.prisma.consentForm.groupBy({
      by: ['status'],
      where: { practiceId },
      _count: { id: true },
    });

    const statusMap: Record<string, number> = {};
    for (const s of statuses) {
      statusMap[s.status] = s._count.id;
    }

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const signed = (statusMap['SIGNED'] || 0) + (statusMap['PAID'] || 0) + (statusMap['COMPLETED'] || 0);

    return {
      total,
      signed,
      conversionRate: total > 0 ? Math.round((signed / total) * 100) : 0,
      byStatus: statusMap,
    };
  }

  async getRevenue(practiceId: string) {
    const paid = await this.prisma.consentForm.findMany({
      where: {
        practiceId,
        status: { in: ['PAID', 'COMPLETED'] },
        stripePaymentIntent: { not: null },
      },
      select: {
        createdAt: true,
        stripePaymentIntent: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalRevenue = 0;
    const transactions: { date: string; amount: number; paymentIntent: string }[] = [];

    if (this.stripe && paid.length > 0) {
      for (const consent of paid) {
        try {
          const pi = await this.stripe.paymentIntents.retrieve(consent.stripePaymentIntent!);
          const amount = pi.amount / 100;
          totalRevenue += amount;
          transactions.push({
            date: consent.createdAt.toISOString().split('T')[0],
            amount,
            paymentIntent: consent.stripePaymentIntent!,
          });
        } catch {
          // Skip failed lookups (e.g. test payment intents)
          transactions.push({
            date: consent.createdAt.toISOString().split('T')[0],
            amount: 0,
            paymentIntent: consent.stripePaymentIntent!,
          });
        }
      }
    }

    return {
      totalRevenue,
      transactionCount: paid.length,
      averageTransaction: paid.length > 0 ? totalRevenue / paid.length : 0,
      transactions,
    };
  }
}
