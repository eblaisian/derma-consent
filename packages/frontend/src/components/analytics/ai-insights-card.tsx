'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAiStatus } from '@/hooks/use-ai-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw } from 'lucide-react';

export function AiInsightsCard() {
  const t = useTranslations('analyticsInsights');
  const { data: session } = useSession();
  const locale = useLocale();
  const { features, aiEnabled } = useAiStatus();

  const { data, isLoading, mutate } = useSWR<{ insights: string }>(
    features.analyticsInsights && aiEnabled && session?.accessToken
      ? `${API_URL}/api/analytics/insights?locale=${locale}`
      : null,
    createAuthFetcher(session?.accessToken),
    { revalidateOnFocus: false, revalidateOnMount: true },
  );

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
