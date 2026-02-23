'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ExternalLink, CheckCircle2, Clock, CreditCard } from 'lucide-react';

interface ConnectStatus {
  status: 'not_started' | 'pending' | 'active';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  accountId: string | null;
}

export function StripeConnectSetup() {
  const t = useTranslations('billing');
  const { data: session } = useSession();
  const authFetch = useAuthFetch();

  const { data: connectStatus, isLoading, mutate } = useSWR<ConnectStatus>(
    session?.accessToken ? `${API_URL}/api/stripe/connect/status` : null,
    createAuthFetcher(session?.accessToken),
  );

  const handleOnboard = async () => {
    try {
      const data = await authFetch('/api/stripe/connect/onboard', { method: 'POST' });
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error(t('connectError'));
    }
  };

  const handleDashboard = async () => {
    try {
      const data = await authFetch('/api/stripe/connect/dashboard-link', { method: 'POST' });
      if (data.url) window.open(data.url, '_blank');
    } catch {
      toast.error(t('connectError'));
    }
  };

  const statusIcon = {
    not_started: <CreditCard className="h-5 w-5 text-muted-foreground" />,
    pending: <Clock className="h-5 w-5 text-yellow-500" />,
    active: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  };

  const statusBadge = {
    not_started: <Badge variant="outline">{t('connectNotStarted')}</Badge>,
    pending: <Badge variant="secondary">{t('connectPending')}</Badge>,
    active: <Badge variant="default">{t('connectActive')}</Badge>,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {connectStatus ? statusIcon[connectStatus.status] : <CreditCard className="h-5 w-5" />}
          {t('connectTitle')}
        </CardTitle>
        <CardDescription>{t('connectDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>
        ) : connectStatus ? (
          <>
            <div className="flex items-center gap-2">
              {statusBadge[connectStatus.status]}
            </div>

            {connectStatus.status === 'not_started' && (
              <Button onClick={handleOnboard}>
                <CreditCard className="mr-2 h-4 w-4" />
                {t('connectWithStripe')}
              </Button>
            )}

            {connectStatus.status === 'pending' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('connectPendingDescription')}</p>
                <Button variant="outline" onClick={handleOnboard}>
                  {t('continueSetup')}
                </Button>
              </div>
            )}

            {connectStatus.status === 'active' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('connectActiveDescription')}</p>
                <Button variant="outline" onClick={handleDashboard}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('stripeDashboard')}
                </Button>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
