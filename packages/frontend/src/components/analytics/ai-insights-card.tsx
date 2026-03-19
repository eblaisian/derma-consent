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
import { Sparkles, RefreshCw, ArrowUpRight } from 'lucide-react';

function InsightsLockedCard() {
  const t = useTranslations('analyticsInsights');
  const tp = useTranslations('premiumGate');

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('cardTitle')}
          </CardTitle>
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">
            {tp('badge')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="relative min-h-[140px]">
        {/* Blurred fake insights */}
        <div className="space-y-2 select-none pointer-events-none" aria-hidden="true">
          <Skeleton className="h-4 w-full blur-sm" />
          <Skeleton className="h-4 w-11/12 blur-sm" />
          <Skeleton className="h-4 w-9/12 blur-sm" />
        </div>

        {/* Overlay CTA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4">
          <p className="text-sm font-medium">{tp('analyticsInsightsTitle')}</p>
          <p className="text-xs text-muted-foreground max-w-[240px]">{tp('analyticsInsightsDescription')}</p>
          <Button size="sm" asChild>
            <Link href="/billing">
              {tp('upgradeCta')} <ArrowUpRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AiInsightsCard() {
  const t = useTranslations('analyticsInsights');
  const { data: session } = useSession();
  const locale = useLocale();
  const { features, aiEnabled, premiumFeatures } = useAiStatus();

  const { data, isLoading, mutate } = useSWR<{ insights: string }>(
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('cardTitle')}
          </CardTitle>
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
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-9/12" />
          </div>
        )}
        {data?.insights && !isLoading && (
          <p className="text-sm leading-relaxed text-foreground-secondary">
            {data.insights}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
