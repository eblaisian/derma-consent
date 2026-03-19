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

interface InsightVisuals {
  Icon: LucideIcon;
  iconClass: string;
  metricClass: string;
  metricBg: string;
  accentBorder: string;
  bgClass: string;
}

function getInsightVisuals(insight: AiInsight): InsightVisuals {
  const map: Record<string, InsightVisuals> = {
    'trend:positive': { Icon: TrendingUp, iconClass: 'text-emerald-600 dark:text-emerald-400', metricClass: 'text-emerald-700 dark:text-emerald-300', metricBg: 'bg-emerald-50 dark:bg-emerald-950/40', accentBorder: 'border-l-emerald-500', bgClass: 'bg-emerald-100/60 dark:bg-emerald-900/30' },
    'trend:warning': { Icon: TrendingDown, iconClass: 'text-red-600 dark:text-red-400', metricClass: 'text-red-700 dark:text-red-300', metricBg: 'bg-red-50 dark:bg-red-950/40', accentBorder: 'border-l-red-500', bgClass: 'bg-red-100/60 dark:bg-red-900/30' },
    'trend:neutral': { Icon: TrendingUp, iconClass: 'text-muted-foreground', metricClass: 'text-foreground', metricBg: 'bg-muted', accentBorder: 'border-l-muted-foreground/40', bgClass: 'bg-muted/60' },
    'trend:info': { Icon: TrendingUp, iconClass: 'text-primary', metricClass: 'text-primary', metricBg: 'bg-primary/5', accentBorder: 'border-l-primary', bgClass: 'bg-primary/10' },
    'opportunity:info': { Icon: Lightbulb, iconClass: 'text-blue-600 dark:text-blue-400', metricClass: 'text-blue-700 dark:text-blue-300', metricBg: 'bg-blue-50 dark:bg-blue-950/40', accentBorder: 'border-l-blue-500', bgClass: 'bg-blue-100/60 dark:bg-blue-900/30' },
    'opportunity:positive': { Icon: Lightbulb, iconClass: 'text-emerald-600 dark:text-emerald-400', metricClass: 'text-emerald-700 dark:text-emerald-300', metricBg: 'bg-emerald-50 dark:bg-emerald-950/40', accentBorder: 'border-l-emerald-500', bgClass: 'bg-emerald-100/60 dark:bg-emerald-900/30' },
    'attention:warning': { Icon: AlertTriangle, iconClass: 'text-amber-600 dark:text-amber-400', metricClass: 'text-amber-700 dark:text-amber-300', metricBg: 'bg-amber-50 dark:bg-amber-950/40', accentBorder: 'border-l-amber-500', bgClass: 'bg-amber-100/60 dark:bg-amber-900/30' },
    'attention:neutral': { Icon: Clock, iconClass: 'text-muted-foreground', metricClass: 'text-foreground', metricBg: 'bg-muted', accentBorder: 'border-l-muted-foreground/40', bgClass: 'bg-muted/60' },
    'milestone:positive': { Icon: Trophy, iconClass: 'text-emerald-600 dark:text-emerald-400', metricClass: 'text-emerald-700 dark:text-emerald-300', metricBg: 'bg-emerald-50 dark:bg-emerald-950/40', accentBorder: 'border-l-emerald-500', bgClass: 'bg-emerald-100/60 dark:bg-emerald-900/30' },
  };
  return map[`${insight.type}:${insight.severity}`] || map['attention:neutral']!;
}

function InsightsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-border/40 p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const FAKE_INSIGHTS: Record<string, Array<{ title: string; metric: string; detail: string }>> = {
  de: [
    { title: 'Consent-Abschlussrate sinkt', metric: '-23%', detail: 'BOTOX Einwilligungen zeigen einen Ruckgang seit letzter Woche...' },
    { title: 'Optimales Zeitfenster erkannt', metric: 'Di 14-16h', detail: '92% der Einwilligungen in diesem Zeitraum werden abgeschlossen...' },
    { title: '4 Nachsorge-Termine fallig', metric: '4 Patienten', detail: 'Patienten aus dem letzten Monat benotigen Nachsorge...' },
  ],
  en: [
    { title: 'Consent completion declining', metric: '-23%', detail: 'BOTOX consent completions show a decline since last week...' },
    { title: 'Peak conversion window found', metric: 'Tue 2-4pm', detail: '92% of consents sent during this window are completed...' },
    { title: '4 follow-ups overdue', metric: '4 patients', detail: 'Patients from last month need follow-up scheduling...' },
  ],
  es: [
    { title: 'Tasa de consentimiento en descenso', metric: '-23%', detail: 'Los consentimientos de BOTOX muestran un descenso...' },
    { title: 'Ventana de conversion optima', metric: 'Mar 14-16h', detail: '92% de los consentimientos en este periodo se completan...' },
    { title: '4 seguimientos pendientes', metric: '4 pacientes', detail: 'Pacientes del mes pasado necesitan programar seguimiento...' },
  ],
  fr: [
    { title: 'Taux de consentement en baisse', metric: '-23%', detail: 'Les consentements BOTOX montrent une baisse...' },
    { title: 'Creneau de conversion optimal', metric: 'Mar 14-16h', detail: '92% des consentements envoyes durant ce creneau sont completes...' },
    { title: '4 suivis en retard', metric: '4 patients', detail: 'Des patients du mois dernier necessitent un suivi...' },
  ],
  ar: [
    { title: 'معدل إكمال الموافقة ينخفض', metric: '-23%', detail: 'موافقات البوتوكس تظهر انخفاضاً منذ الأسبوع الماضي...' },
    { title: 'فترة تحويل مثالية', metric: 'الثلاثاء 2-4م', detail: '92% من الموافقات المرسلة خلال هذه الفترة تكتمل...' },
    { title: '4 متابعات متأخرة', metric: '4 مرضى', detail: 'مرضى الشهر الماضي يحتاجون جدولة متابعة...' },
  ],
  tr: [
    { title: 'Onam tamamlanma orani dususyor', metric: '-23%', detail: 'BOTOX onamlari gecen haftadan bu yana dusus gosteriyor...' },
    { title: 'En iyi donusum penceresi bulundu', metric: 'Sali 14-16', detail: 'Bu zaman diliminde gonderilen onamlarin %92si tamamlaniyor...' },
    { title: '4 takip gecikmis', metric: '4 hasta', detail: 'Gecen aydan hastalar takip randevusu planlamamis...' },
  ],
  pl: [
    { title: 'Wskaznik zgod spada', metric: '-23%', detail: 'Zgody na BOTOX wykazuja spadek od zeszlego tygodnia...' },
    { title: 'Znaleziono optymalne okno konwersji', metric: 'Wt 14-16', detail: '92% zgod wyslanych w tym okresie jest realizowanych...' },
    { title: '4 wizyty kontrolne zalegle', metric: '4 pacjentow', detail: 'Pacjenci z zeszlego miesiaca potrzebuja wizyty kontrolnej...' },
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
        <div className="space-y-3 select-none pointer-events-none" aria-hidden="true">
          {/* Insight 1: partially visible */}
          <div className="rounded-lg border border-border/40 border-l-2 border-l-amber-500 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-amber-100/60 dark:bg-amber-900/30">
                <TrendingDown className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{fakeInsights[0]!.title}</p>
                  <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 tabular-nums">
                    {fakeInsights[0]!.metric}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground mt-1 blur-[2px] opacity-60">{fakeInsights[0]!.detail}</p>
              </div>
            </div>
          </div>

          {/* Insight 2: mostly blurred */}
          <div className="rounded-lg border border-border/40 border-l-2 border-l-blue-500 p-4 opacity-50 blur-[3px]">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-blue-100/60">
                <Lightbulb className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{fakeInsights[1]!.title}</p>
                  <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 tabular-nums">{fakeInsights[1]!.metric}</span>
                </div>
                <p className="text-[13px] text-muted-foreground mt-1">{fakeInsights[1]!.detail}</p>
              </div>
            </div>
          </div>

          {/* Insight 3: fully blurred */}
          <div className="rounded-lg border border-border/40 border-l-2 border-l-emerald-500 p-4 opacity-25 blur-[6px]">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-emerald-100/60">
                <Trophy className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{fakeInsights[2]!.title}</p>
                  <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 tabular-nums">{fakeInsights[2]!.metric}</span>
                </div>
                <p className="text-[13px] text-muted-foreground mt-1">{fakeInsights[2]!.detail}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-3/4 bg-gradient-to-t from-card via-card/60 to-transparent" />

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
        {!isLoading && data?.insights && Array.isArray(data.insights) && data.insights.length > 0 && (
          <div className="space-y-3">
            {data.insights.map((insight, i) => {
              const v = getInsightVisuals(insight);
              const IconComp = v.Icon;
              return (
                <div
                  key={`insight-${i}`}
                  className={`rounded-lg border border-border/40 border-l-2 ${v.accentBorder} p-4 transition-colors hover:bg-muted/30`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${v.bgClass}`}>
                      <IconComp className={`h-[18px] w-[18px] ${v.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{String(insight.title || '')}</p>
                        {insight.metric && (
                          <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${v.metricBg} ${v.metricClass}`}>
                            {String(insight.metric)}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed text-muted-foreground mt-1">{String(insight.detail || '')}</p>
                      {insight.action && (
                        <div className="mt-2 rounded-md bg-muted/40 px-3 py-1.5">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground/70">Tip: </span>
                            {String(insight.action)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!isLoading && data?.insights && Array.isArray(data.insights) && data.insights.length === 0 && (
          <div className="py-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground mt-3">{t('noInsights')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
