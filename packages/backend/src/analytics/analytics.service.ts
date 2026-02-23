import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getByPeriod(practiceId: string, days = 30, explicitStartDate?: Date, explicitEndDate?: Date) {
    const startDate = explicitStartDate ?? new Date();
    if (!explicitStartDate) startDate.setDate(startDate.getDate() - days);
    const endDate = explicitEndDate;

    const consents = await this.prisma.consentForm.findMany({
      where: {
        practiceId,
        createdAt: {
          gte: startDate,
          ...(endDate && { lte: endDate }),
        },
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

  async getRevenue(practiceId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: Record<string, unknown> = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const result = await this.prisma.consentForm.aggregate({
      where: {
        practiceId,
        paymentAmountCents: { not: null },
        ...dateFilter,
      },
      _sum: { paymentAmountCents: true },
      _count: { id: true },
    });

    const totalCents = result._sum.paymentAmountCents ?? 0;
    const count = result._count.id;
    const totalRevenue = totalCents / 100;

    return {
      totalRevenue,
      transactionCount: count,
      averageTransaction: count > 0 ? totalRevenue / count : 0,
    };
  }
}
