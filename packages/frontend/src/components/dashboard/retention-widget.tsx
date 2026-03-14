'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAiStatus } from '@/hooks/use-ai-status';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserCheck } from 'lucide-react';

interface RetentionFlag {
  patientId: string;
  type: string;
  lastTreatmentDate: string;
  daysSince: number;
  recommendedCadenceDays: number;
}

export function RetentionWidget() {
  const t = useTranslations('retention');
  const tTypes = useTranslations('consentTypes');
  const { data: session } = useSession();
  const { features } = useAiStatus();

  const { data } = useSWR<RetentionFlag[]>(
    features.retention && session?.accessToken
      ? `${API_URL}/api/analytics/retention-flags`
      : null,
    createAuthFetcher(session?.accessToken),
    { refreshInterval: 300_000 },
  );

  if (!features.retention || !data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCheck className="h-4 w-4 text-amber-500" />
          {t('widgetTitle')}
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {data.length} {t('patients')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.slice(0, 8).map((flag) => (
            <div key={`${flag.patientId}-${flag.type}`} className="flex items-center justify-between text-sm py-1.5 border-b border-border-subtle last:border-0">
              <div className="flex items-center gap-2">
                <Link href={`/patients/${flag.patientId}`} className="text-primary hover:underline font-medium text-xs">
                  {flag.patientId.substring(0, 8)}...
                </Link>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {tTypes.has(flag.type as Parameters<typeof tTypes>[0]) ? tTypes(flag.type as Parameters<typeof tTypes>[0]) : flag.type}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {flag.daysSince}d / {flag.recommendedCadenceDays}d
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
