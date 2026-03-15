'use client';

import { useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { StripeConnectSetup } from '@/components/billing/stripe-connect-setup';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

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
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const { data: subscription, isLoading } = useSWR<Subscription>(
    session?.accessToken ? `${API_URL}/api/billing/subscription` : null,
    createAuthFetcher(session?.accessToken),
  );

  const handlePortal = async () => {
    try {
      const data = await authFetch('/api/billing/portal', { method: 'POST' });
      if (data.url) window.location.assign(data.url);
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
      if (data.url) window.location.assign(data.url);
    } catch {
      toast.error(t('checkoutError'));
    }
  };

  const starterPriceId = billingInterval === 'monthly'
    ? process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || ''
    : process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID || '';

  const professionalPriceId = billingInterval === 'monthly'
    ? process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || ''
    : process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || '';

  const statusKey = subscription?.status as keyof IntlMessages['subscriptionStatus'] | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('currentPlan')}</CardTitle>
            <CardDescription>
              {isLoading ? (
                <Skeleton className="h-4 w-32 mt-1" />
              ) : subscription ? (
                tPlans.has(subscription.plan as keyof IntlMessages['subscriptionPlans'])
                  ? tPlans(subscription.plan as keyof IntlMessages['subscriptionPlans'])
                  : subscription.plan
              ) : t('loading')}
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

        <StripeConnectSetup />
      </div>

      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-1">
        <Button
          variant={billingInterval === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setBillingInterval('monthly')}
        >
          {t('monthly')}
        </Button>
        <Button
          variant={billingInterval === 'yearly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setBillingInterval('yearly')}
        >
          {t('yearly')}
          <span className="ml-1 text-xs opacity-75">{t('yearlySavings')}</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 items-stretch">
        {([
          { plan: 'STARTER', priceKey: billingInterval === 'monthly' ? 'starterPrice' as const : 'starterYearlyPrice' as const, features: ['starterFeature1', 'starterFeature2', 'starterFeature3'] as const, priceId: starterPriceId, highlighted: false },
          { plan: 'PROFESSIONAL', priceKey: billingInterval === 'monthly' ? 'professionalPrice' as const : 'professionalYearlyPrice' as const, features: ['professionalFeature1', 'professionalFeature2', 'professionalFeature3', 'professionalFeature4'] as const, priceId: professionalPriceId, highlighted: true },
          { plan: 'ENTERPRISE', priceKey: null, features: ['enterpriseFeature1', 'enterpriseFeature2', 'enterpriseFeature3', 'enterpriseFeature4'] as const, priceId: null, highlighted: false },
        ] as const).map((tier) => {
          const isCurrent = subscription?.plan === tier.plan;
          return (
            <Card key={tier.plan} className={`flex flex-col ${tier.highlighted ? 'border-primary' : ''}`}>
              <CardHeader>
                <CardTitle>{tPlans(tier.plan as keyof IntlMessages['subscriptionPlans'])}</CardTitle>
                <CardDescription>{tPlans(`${tier.plan.toLowerCase()}Description` as keyof IntlMessages['subscriptionPlans'])}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-2xl font-bold">
                  {tier.priceKey ? t(tier.priceKey) : t('onRequest')}
                </p>
                <ul className="flex-1 space-y-1 text-sm text-muted-foreground">
                  {tier.features.map((fKey) => (
                    <li key={fKey}>{tPlans(fKey)}</li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/50 py-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="size-4 text-success" />
                    {t('currentPlanActive')}
                  </div>
                ) : tier.priceId ? (
                  <Button className="w-full" onClick={() => handleCheckout(tier.priceId!)}>
                    {t('select')}
                  </Button>
                ) : tier.plan === 'ENTERPRISE' ? (
                  <Button className="w-full" variant="outline" asChild>
                    <a href="mailto:enterprise@dermaconsent.de?subject=Enterprise%20Plan%20Inquiry">
                      {t('contactUs')}
                    </a>
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    {t('comingSoon')}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
