'use client';

import { useSession } from 'next-auth/react';
import { useTranslations, useFormatter } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  TRIALING: 'secondary',
  ACTIVE: 'default',
  PAST_DUE: 'destructive',
  CANCELLED: 'outline',
  EXPIRED: 'outline',
};

interface Subscription {
  id: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export default function BillingPage() {
  const t = useTranslations('billing');
  const tPlans = useTranslations('subscriptionPlans');
  const tStatus = useTranslations('subscriptionStatus');
  const format = useFormatter();
  const { data: session } = useSession();
  const authFetch = useAuthFetch();

  const { data: subscription } = useSWR<Subscription>(
    session?.accessToken ? `${API_URL}/api/billing/subscription` : null,
    createAuthFetcher(session?.accessToken),
  );

  const handlePortal = async () => {
    try {
      const data = await authFetch('/api/billing/portal', { method: 'POST' });
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error(t('portalError'));
    }
  };

  const handleCheckout = async (priceId: string) => {
    try {
      const data = await authFetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId }),
      });
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error(t('checkoutError'));
    }
  };

  const statusKey = subscription?.status as keyof IntlMessages['subscriptionStatus'] | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('currentPlan')}</CardTitle>
          <CardDescription>
            {subscription
              ? (tPlans.has(subscription.plan as keyof IntlMessages['subscriptionPlans'])
                  ? tPlans(subscription.plan as keyof IntlMessages['subscriptionPlans'])
                  : subscription.plan)
              : t('loading')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusKey && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('status')}</span>
              <Badge variant={statusVariants[subscription!.status] || 'outline'}>
                {tStatus.has(statusKey) ? tStatus(statusKey) : subscription!.status}
              </Badge>
            </div>
          )}

          {subscription?.trialEndsAt && (
            <p className="text-sm text-muted-foreground">
              {t('trialEnds')}{' '}
              {format.dateTime(new Date(subscription.trialEndsAt), { dateStyle: 'long' })}
            </p>
          )}

          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              {t('nextBilling')}{' '}
              {format.dateTime(new Date(subscription.currentPeriodEnd), { dateStyle: 'long' })}
            </p>
          )}

          {subscription?.status === 'ACTIVE' && (
            <Button variant="outline" onClick={handlePortal}>
              {t('managePayments')}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{tPlans('STARTER')}</CardTitle>
            <CardDescription>{tPlans('starterDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-bold">{t('starterPrice')}</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>{tPlans('starterFeature1')}</li>
              <li>{tPlans('starterFeature2')}</li>
              <li>{tPlans('starterFeature3')}</li>
            </ul>
            <Button
              className="w-full"
              variant={subscription?.plan === 'STARTER' ? 'secondary' : 'default'}
              disabled={subscription?.plan === 'STARTER'}
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || '')}
            >
              {subscription?.plan === 'STARTER' ? t('currentPlanBadge') : t('select')}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{tPlans('PROFESSIONAL')}</CardTitle>
            <CardDescription>{tPlans('professionalDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-bold">{t('professionalPrice')}</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>{tPlans('professionalFeature1')}</li>
              <li>{tPlans('professionalFeature2')}</li>
              <li>{tPlans('professionalFeature3')}</li>
              <li>{tPlans('professionalFeature4')}</li>
            </ul>
            <Button
              className="w-full"
              variant={subscription?.plan === 'PROFESSIONAL' ? 'secondary' : 'default'}
              disabled={subscription?.plan === 'PROFESSIONAL'}
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || '')}
            >
              {subscription?.plan === 'PROFESSIONAL' ? t('currentPlanBadge') : t('select')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tPlans('ENTERPRISE')}</CardTitle>
            <CardDescription>{tPlans('enterpriseDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-bold">{t('onRequest')}</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>{tPlans('enterpriseFeature1')}</li>
              <li>{tPlans('enterpriseFeature2')}</li>
              <li>{tPlans('enterpriseFeature3')}</li>
              <li>{tPlans('enterpriseFeature4')}</li>
            </ul>
            <Button className="w-full" variant="outline" asChild>
              <a href="mailto:enterprise@dermaconsent.de?subject=Enterprise%20Plan%20Inquiry">
                {t('contactUs')}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
