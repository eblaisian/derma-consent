'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAiStatus } from '@/hooks/use-ai-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  Clock,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AiInsight {
  type: 'trend' | 'opportunity' | 'attention' | 'milestone';
  severity: 'positive' | 'warning' | 'neutral' | 'info';
  title: string;
  metric: string;
  detail: string;
  action: string;
}

interface InsightsResponse {
  insights: AiInsight[];
  generatedAt: string;
}

function getInsightVisuals(insight: AiInsight): { Icon: LucideIcon; iconClass: string; metricClass: string; bgClass: string } {
  const map: Record<string, { Icon: LucideIcon; iconClass: string; metricClass: string; bgClass: string }> = {
    'trend:positive': { Icon: TrendingUp, iconClass: 'text-emerald-500', metricClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
    'trend:warning': { Icon: TrendingDown, iconClass: 'text-destructive', metricClass: 'text-destructive', bgClass: 'bg-destructive/10' },
    'trend:neutral': { Icon: TrendingUp, iconClass: 'text-muted-foreground', metricClass: 'text-muted-foreground', bgClass: 'bg-muted' },
    'trend:info': { Icon: TrendingUp, iconClass: 'text-primary', metricClass: 'text-primary', bgClass: 'bg-primary/10' },
    'opportunity:info': { Icon: Lightbulb, iconClass: 'text-primary', metricClass: 'text-primary', bgClass: 'bg-primary/10' },
    'opportunity:positive': { Icon: Lightbulb, iconClass: 'text-emerald-500', metricClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
    'attention:warning': { Icon: AlertTriangle, iconClass: 'text-amber-500', metricClass: 'text-amber-500', bgClass: 'bg-amber-500/10' },
    'attention:neutral': { Icon: Clock, iconClass: 'text-muted-foreground', metricClass: 'text-muted-foreground', bgClass: 'bg-muted' },
    'milestone:positive': { Icon: Trophy, iconClass: 'text-emerald-500', metricClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10' },
  };
  return map[`${insight.type}:${insight.severity}`] || map['attention:neutral']!;
}

function InsightRow({ insight, index }: { insight: AiInsight; index: number }) {
  const { Icon, iconClass, metricClass, bgClass } = getInsightVisuals(insight);

  return (
    <div
      className="flex items-start gap-4 py-4 first:pt-0 last:pb-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
    >
      <div className={`flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center ${bgClass}`}>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{insight.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{insight.detail}</p>
        {insight.action && (
          <p className="text-xs text-muted-foreground/70 mt-1.5">
            <span className="font-medium not-italic">Suggestion: </span>
            <span className="italic">{insight.action}</span>
          </p>
        )}
      </div>
      {insight.metric && (
        <div className={`flex-shrink-0 text-right text-lg font-semibold tabular-nums tracking-tight ${metricClass}`}>
          {insight.metric}
        </div>
      )}
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="divide-y divide-border/50">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
          <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3.5 w-64" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-12 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

const FAKE_INSIGHTS: Record<string, Array<{ title: string; metric: string; detail: string }>> = {
  de: [
    { title: 'Consent-Abschlussrate sinkt', metric: '-23%', detail: 'BOTOX Einwilligungen zeigen einen Rückgang seit letzter Woche...' },
    { title: 'Optimales Zeitfenster erkannt', metric: 'Di 14-16h', detail: '92% der Einwilligungen in diesem Zeitraum werden abgeschlossen...' },
    { title: '4 Nachsorge-Termine fällig', metric: '4 Patienten', detail: 'Patienten aus dem letzten Monat benötigen Nachsorge...' },
  ],
  en: [
    { title: 'Consent completion declining', metric: '-23%', detail: 'BOTOX consent completions show a decline since last week...' },
    { title: 'Peak conversion window found', metric: 'Tue 2-4pm', detail: '92% of consents sent during this window are completed...' },
    { title: '4 follow-ups overdue', metric: '4 patients', detail: 'Patients from last month need follow-up scheduling...' },
  ],
  es: [
    { title: 'Tasa de consentimiento en descenso', metric: '-23%', detail: 'Los consentimientos de BOTOX muestran un descenso desde la semana pasada...' },
    { title: 'Ventana de conversión óptima', metric: 'Mar 14-16h', detail: '92% de los consentimientos en este periodo se completan...' },
    { title: '4 seguimientos pendientes', metric: '4 pacientes', detail: 'Pacientes del mes pasado necesitan programar seguimiento...' },
  ],
  fr: [
    { title: 'Taux de consentement en baisse', metric: '-23%', detail: 'Les consentements BOTOX montrent une baisse depuis la semaine dernière...' },
    { title: 'Créneau de conversion optimal', metric: 'Mar 14-16h', detail: '92% des consentements envoyés durant ce créneau sont complétés...' },
    { title: '4 suivis en retard', metric: '4 patients', detail: 'Des patients du mois dernier nécessitent un suivi...' },
  ],
  ar: [
    { title: 'معدل إكمال الموافقة ينخفض', metric: '-23%', detail: 'موافقات البوتوكس تظهر انخفاضاً منذ الأسبوع الماضي...' },
    { title: 'فترة تحويل مثالية', metric: 'الثلاثاء 2-4م', detail: '92% من الموافقات المرسلة خلال هذه الفترة تكتمل...' },
    { title: '4 متابعات متأخرة', metric: '4 مرضى', detail: 'مرضى الشهر الماضي يحتاجون جدولة متابعة...' },
  ],
  tr: [
    { title: 'Onam tamamlanma oranı düşüyor', metric: '-23%', detail: 'BOTOX onamları geçen haftadan bu yana düşüş gösteriyor...' },
    { title: 'En iyi dönüşüm penceresi bulundu', metric: 'Salı 14-16', detail: 'Bu zaman diliminde gönderilen onamların %92\'si tamamlanıyor...' },
    { title: '4 takip gecikmiş', metric: '4 hasta', detail: 'Geçen aydan hastalar takip randevusu planlamamış...' },
  ],
  pl: [
    { title: 'Wskaźnik zgód spada', metric: '-23%', detail: 'Zgody na BOTOX wykazują spadek od zeszłego tygodnia...' },
    { title: 'Znaleziono optymalne okno konwersji', metric: 'Wt 14-16', detail: '92% zgód wysłanych w tym okresie jest realizowanych...' },
    { title: '4 wizyty kontrolne zaległe', metric: '4 pacjentów', detail: 'Pacjenci z zeszłego miesiąca potrzebują wizyty kontrolnej...' },
  ],
  ru: [
    { title: 'Показатель завершения согласий снижается', metric: '-23%', detail: 'Согласия на БОТОКС показывают снижение с прошлой недели...' },
    { title: 'Найдено оптимальное окно конверсии', metric: 'Вт 14-16', detail: '92% согласий, отправленных в это время, завершаются...' },
    { title: '4 контрольных визита просрочены', metric: '4 пациента', detail: 'Пациенты прошлого месяца нуждаются в контрольном визите...' },
  ],
};

function InsightsLockedCard() {
  const t = useTranslations('analyticsInsights');
  const tp = useTranslations('premiumGate');
  const locale = useLocale();
  const fakeInsights = FAKE_INSIGHTS[locale] || FAKE_INSIGHTS.en!;

  return (
    <Card className="relative overflow-hidden rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)]">
      {/* Premium accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('cardTitle')}
          </CardTitle>
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
            {tp('badge')}
          </span>
        </div>
      </CardHeader>

      <CardContent className="relative min-h-[320px]">
        {/* Fake insights with progressive blur */}
        <div className="divide-y divide-border/50 select-none pointer-events-none" aria-hidden="true">
          {/* Insight 1: partially visible (the tease) */}
          <div className="flex items-start gap-4 py-4 first:pt-0">
            <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center bg-amber-500/10">
              <TrendingDown className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{fakeInsights[0]!.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5 blur-[2px] opacity-60">{fakeInsights[0]!.detail}</p>
            </div>
            <div className="flex-shrink-0 text-lg font-semibold tabular-nums tracking-tight text-amber-500">
              {fakeInsights[0]!.metric}
            </div>
          </div>

          {/* Insight 2: mostly blurred */}
          <div className="flex items-start gap-4 py-4 opacity-50 blur-[3px]">
            <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{fakeInsights[1]!.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{fakeInsights[1]!.detail}</p>
            </div>
            <div className="flex-shrink-0 text-lg font-semibold tabular-nums tracking-tight text-primary">
              {fakeInsights[1]!.metric}
            </div>
          </div>

          {/* Insight 3: fully blurred */}
          <div className="flex items-start gap-4 py-4 opacity-25 blur-[6px]">
            <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-500/10">
              <Trophy className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{fakeInsights[2]!.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{fakeInsights[2]!.detail}</p>
            </div>
            <div className="flex-shrink-0 text-lg font-semibold tabular-nums tracking-tight text-emerald-500">
              {fakeInsights[2]!.metric}
            </div>
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute bottom-0 inset-x-0 h-3/4 bg-gradient-to-t from-card via-card/60 to-transparent" />

        {/* CTA */}
        <div className="absolute bottom-0 inset-x-0 p-6 pt-12 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">{t('lockedPulse', { count: 3 })}</span>
          </div>
          <p className="text-sm font-medium text-foreground">{t('lockedHeadline')}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[300px]">{t('lockedSubline')}</p>
          <Button className="mt-4" size="sm" asChild>
            <Link href="/billing">
              {tp('upgradeCta')} <ArrowUpRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function AiInsightsCard() {
  const t = useTranslations('analyticsInsights');
  const { data: session } = useSession();
  const locale = useLocale();
  const { features, aiEnabled, premiumFeatures } = useAiStatus();

  const { data, isLoading, mutate } = useSWR<InsightsResponse>(
    features.analyticsInsights && aiEnabled && session?.accessToken
      ? `${API_URL}/api/analytics/insights?locale=${locale}`
      : null,
    createAuthFetcher(session?.accessToken),
    { revalidateOnFocus: false, revalidateOnMount: true },
  );

  if (!features.analyticsInsights && premiumFeatures.analyticsInsights) {
    return <InsightsLockedCard />;
  }

  if (!features.analyticsInsights || !aiEnabled) return null;

  return (
    <Card className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('cardTitle')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {data?.generatedAt && !isLoading && (
              <span className="text-xs text-muted-foreground">{timeAgo(data.generatedAt)}</span>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => mutate()}
              disabled={isLoading}
              aria-label={t('refresh')}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading && <InsightsSkeleton />}
        {data?.insights && !isLoading && data.insights.length > 0 && (
          <div className="divide-y divide-border/50">
            {data.insights.map((insight, i) => (
              <InsightRow key={`${insight.title}-${i}`} insight={insight} index={i} />
            ))}
          </div>
        )}
        {data?.insights && !isLoading && data.insights.length === 0 && (
          <div className="py-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground mt-3">{t('noInsights')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
