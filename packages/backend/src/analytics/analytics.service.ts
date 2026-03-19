import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

// Re-treatment cadence in days per consent type
const TREATMENT_CADENCE: Record<string, number> = {
  BOTOX: 120,
  FILLER: 270,
  LASER: 180,
  CHEMICAL_PEEL: 90,
  MICRONEEDLING: 90,
  PRP: 90,
};

const LOCALE_NAMES: Record<string, string> = {
  de: 'German', en: 'English', es: 'Spanish', fr: 'French',
  ar: 'Arabic', tr: 'Turkish', pl: 'Polish', ru: 'Russian',
};

export interface AiInsight {
  type: 'trend' | 'opportunity' | 'attention' | 'milestone';
  severity: 'positive' | 'warning' | 'neutral' | 'info';
  title: string;
  metric: string;
  detail: string;
  action: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly insightsCache = new Map<string, { text: string; cachedAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

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

  // --- Patient Retention Flagging ---

  async getRetentionFlags(practiceId: string) {
    const now = new Date();

    // Get the most recent signed consent per patient per type
    const latestConsents = await this.prisma.consentForm.findMany({
      where: {
        practiceId,
        status: { in: ['SIGNED', 'PAID', 'COMPLETED'] },
        patientId: { not: null },
      },
      select: {
        patientId: true,
        type: true,
        signatureTimestamp: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by patient+type, keep only the most recent
    const latestByPatientType = new Map<string, typeof latestConsents[0]>();
    for (const consent of latestConsents) {
      const key = `${consent.patientId}:${consent.type}`;
      if (!latestByPatientType.has(key)) {
        latestByPatientType.set(key, consent);
      }
    }

    // Check each against cadence
    const overduePatients: Array<{
      patientId: string;
      type: string;
      lastTreatmentDate: string;
      daysSince: number;
      recommendedCadenceDays: number;
    }> = [];

    for (const [, consent] of latestByPatientType) {
      const cadence = TREATMENT_CADENCE[consent.type];
      if (!cadence) continue;

      const lastDate = consent.signatureTimestamp || consent.createdAt;
      const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (24 * 3600_000));

      if (daysSince > cadence) {
        overduePatients.push({
          patientId: consent.patientId!,
          type: consent.type,
          lastTreatmentDate: lastDate.toISOString(),
          daysSince,
          recommendedCadenceDays: cadence,
        });
      }
    }

    // Sort by most overdue first
    overduePatients.sort((a, b) => b.daysSince - a.daysSince);

    return overduePatients.slice(0, 50); // Limit to 50
  }

  // --- AI Analytics Insights ---

  async generateInsights(practiceId: string, locale: string): Promise<{ insights: AiInsight[]; generatedAt: string }> {
    // Check cache (1 hour TTL)
    const cacheKey = `${practiceId}:${locale}`;
    const cached = this.insightsCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < 3600_000) {
      return { insights: JSON.parse(cached.text), generatedAt: new Date(cached.cachedAt).toISOString() };
    }

    // Gather aggregate data (all non-PII)
    const [overview, byType, conversion, trend] = await Promise.all([
      this.getOverview(practiceId),
      this.getByType(practiceId),
      this.getConversion(practiceId),
      this.getByPeriod(practiceId, 30),
    ]);

    const dataContext = JSON.stringify({ overview, byType, conversion, recentTrend: trend.slice(-7) });
    const language = LOCALE_NAMES[locale] || 'German';

    const raw = await this.ai.chat([
      {
        role: 'system',
        content: [
          'You are a practice analytics assistant for a German dermatology clinic.',
          'Analyse the data and return exactly 2-3 actionable insights as a JSON array.',
          'Each insight must follow this schema:',
          '{"type":"trend"|"opportunity"|"attention"|"milestone",',
          '"severity":"positive"|"warning"|"neutral"|"info",',
          '"title":"Short headline max 60 chars",',
          '"metric":"Key number e.g. -18%, 4 patients, Tue 2pm",',
          '"detail":"One sentence with specific numbers from the data",',
          '"action":"One sentence actionable recommendation"}',
          'Rules: trend=changing over time, opportunity=untapped potential, attention=needs follow-up, milestone=achievement.',
          'severity: positive=good, warning=needs attention, neutral=informational, info=opportunity.',
          'Be specific with numbers. Reference treatment types by name.',
          `All text in ${language}.`,
          'Return ONLY the JSON array, no wrapping object, no markdown, no code fences.',
        ].join(' '),
      },
      {
        role: 'user',
        content: `Practice analytics data:\n${dataContext}`,
      },
    ], { maxTokens: 500, temperature: 0.4 });

    const now = Date.now();
    let insights: AiInsight[];
    try {
      const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      insights = (Array.isArray(parsed) ? parsed : [parsed]).slice(0, 3);
    } catch {
      this.logger.warn('Failed to parse structured insights, wrapping as single item');
      insights = [{ type: 'attention', severity: 'neutral', title: 'Practice Overview', metric: '', detail: raw.slice(0, 200), action: '' }];
    }

    this.insightsCache.set(cacheKey, { text: JSON.stringify(insights), cachedAt: now });

    return { insights, generatedAt: new Date(now).toISOString() };
  }
}
