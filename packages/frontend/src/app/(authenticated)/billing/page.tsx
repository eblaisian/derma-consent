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
import { toast } from 'sonner';
import {
  CheckCircle2, CreditCard, FileText, ArrowUpRight, AlertTriangle, Clock, XCircle,
} from 'lucide-react';

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
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

interface Plans {
  starter: { monthly: string | null; yearly: string | null };
  professional: { monthly: string | null; yearly: string | null };
}

interface Usage {
  used: number;
  limit: number | null;
  plan: string;
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

  const { data: plans } = useSWR<Plans>(
    `${API_URL}/api/billing/plans`,
    (url: string) => fetch(url).then((r) => r.json()),
  );

  const { data: usage } = useSWR<Usage>(
    session?.accessToken ? `${API_URL}/api/billing/usage` : null,
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
      if (data.action === 'plan_changed' || data.action === 'reactivated') {
        toast.success(data.action === 'reactivated' ? t('resubscribeSuccess') : t('planChangeSuccess'));
        window.location.assign(data.url);
      } else if (data.url) {
        window.location.assign(data.url);
      }
    } catch {
      toast.error(t('checkoutError'));
    }
  };

  const starterPriceId = billingInterval === 'monthly'
    ? plans?.starter.monthly || ''
    : plans?.starter.yearly || '';

  const professionalPriceId = billingInterval === 'monthly'
    ? plans?.professional.monthly || ''
    : plans?.professional.yearly || '';

  const statusKey = subscription?.status as keyof IntlMessages['subscriptionStatus'] | undefined;
  const isFreeTrial = subscription?.plan === 'FREE_TRIAL';
  const isPastDue = subscription?.status === 'PAST_DUE';
  const isCancelled = subscription?.status === 'CANCELLED';
  const isExpired = subscription?.status === 'EXPIRED';
  const isCancelPending = subscription?.status === 'ACTIVE' && subscription?.cancelAtPeriodEnd;
  const isInactive = isCancelled || isExpired;
  const hasStripeCustomer = !!subscription?.stripeCustomerId;

  // Show plan selection for: free trial, starter (upgrade), OR any inactive state (resubscribe)
  const showPlanSelection = isFreeTrial || subscription?.plan === 'STARTER' || isInactive;
  // Show "Manage payments" for any state where user has a Stripe customer (can update payment method, reactivate, etc.)
  const showManagePayments = hasStripeCustomer && (subscription?.status === 'ACTIVE' || isPastDue);

  const usagePercent = usage?.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  const isNearLimit = usage?.limit ? usage.used >= usage.limit * 0.8 : false;
  const isAtLimit = usage?.limit ? usage.used >= usage.limit : false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {/* Cancellation pending banner */}
      {isCancelPending && subscription?.currentPeriodEnd && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/5 p-4">
          <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-500">{t('cancelPendingTitle')}</p>
            <p className="text-sm text-muted-foreground">
              {t('cancelPendingDescription', { date: format.dateTime(new Date(subscription.currentPeriodEnd), { dateStyle: 'long' }) })}
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={handlePortal}>
            {t('resubscribe')}
          </Button>
        </div>
      )}

      {/* Past due warning */}
      {isPastDue && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">{t('pastDueTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('pastDueDescription')}</p>
          </div>
          <Button variant="destructive" size="sm" className="ml-auto shrink-0" onClick={handlePortal}>
            {t('updatePayment')}
          </Button>
        </div>
      )}

      {/* Cancelled/expired banner */}
      {isInactive && (
        <div className="flex items-center gap-3 rounded-lg border border-muted p-4">
          <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium">{isCancelled ? t('cancelledTitle') : t('expiredTitle')}</p>
            <p className="text-sm text-muted-foreground">{isCancelled ? t('cancelledDescription') : t('expiredDescription')}</p>
          </div>
        </div>
      )}

      {/* Plan + Usage row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Current plan card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('currentPlan')}</CardTitle>
              {statusKey && (
                <Badge variant={statusVariants[subscription!.status] || 'outline'}>
                  {isCancelPending
                    ? t('cancelPendingBadge')
                    : tStatus.has(statusKey) ? tStatus(statusKey) : subscription!.status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <p className="text-2xl font-bold">
                {subscription ? (
                  tPlans.has(subscription.plan as keyof IntlMessages['subscriptionPlans'])
                    ? tPlans(subscription.plan as keyof IntlMessages['subscriptionPlans'])
                    : subscription.plan
                ) : t('loading')}
              </p>
            )}

            <div className="space-y-1 text-sm text-muted-foreground">
              {subscription?.trialEndsAt && subscription.status === 'TRIALING' && (
                <p>{t('trialEnds')} {format.dateTime(new Date(subscription.trialEndsAt), { dateStyle: 'long' })}</p>
              )}
              {subscription?.currentPeriodEnd && !isInactive && !isCancelPending && (
                <p>{t('nextBilling')} {format.dateTime(new Date(subscription.currentPeriodEnd), { dateStyle: 'long' })}</p>
              )}
              {isCancelPending && subscription?.currentPeriodEnd && (
                <p>{t('accessUntil')} {format.dateTime(new Date(subscription.currentPeriodEnd), { dateStyle: 'long' })}</p>
              )}
            </div>

            {showManagePayments && (
              <Button variant="outline" size="sm" onClick={handlePortal}>
                <CreditCard className="mr-2 h-4 w-4" />
                {t('managePayments')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Usage card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('usageTitle')}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!usage ? (
              <Skeleton className="h-8 w-40" />
            ) : usage.limit ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{usage.used}</span>
                  <span className="text-sm text-muted-foreground">/ {usage.limit} {t('consentsThisMonth')}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  {isAtLimit && (
                    <p className="text-xs text-destructive font-medium">{t('limitReached')}</p>
                  )}
                  {isNearLimit && !isAtLimit && (
                    <p className="text-xs text-yellow-600">{t('nearLimit')}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{usage.used}</span>
                <span className="text-sm text-muted-foreground">{t('consentsThisMonth')}</span>
                <Badge variant="secondary" className="ml-2 text-xs">{t('unlimited')}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan selection — show for upgrade, resubscribe, or initial selection */}
      {showPlanSelection && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isInactive ? t('choosePlan') : isFreeTrial ? t('choosePlan') : t('upgradePlan')}
            </h2>
            <div className="flex items-center gap-1">
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
          </div>

          <div className="grid gap-4 md:grid-cols-3 items-stretch">
            {([
              { plan: 'STARTER', priceKey: billingInterval === 'monthly' ? 'starterPrice' as const : 'starterYearlyPrice' as const, features: ['starterFeature1', 'starterFeature2', 'starterFeature3'] as const, priceId: starterPriceId, highlighted: false },
              { plan: 'PROFESSIONAL', priceKey: billingInterval === 'monthly' ? 'professionalPrice' as const : 'professionalYearlyPrice' as const, features: ['professionalFeature1', 'professionalFeature2', 'professionalFeature3', 'professionalFeature4'] as const, priceId: professionalPriceId, highlighted: true },
              { plan: 'ENTERPRISE', priceKey: null, features: ['enterpriseFeature1', 'enterpriseFeature2', 'enterpriseFeature3', 'enterpriseFeature4'] as const, priceId: null, highlighted: false },
            ] as const).map((tier) => {
              const isCurrent = subscription?.plan === tier.plan && !isInactive;
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
                        <li key={fKey} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          {tPlans(fKey)}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/50 py-2 text-sm font-medium text-muted-foreground">
                        <CheckCircle2 className="size-4 text-primary" />
                        {t('currentPlanActive')}
                      </div>
                    ) : tier.priceId ? (
                      <Button className="w-full" onClick={() => handleCheckout(tier.priceId!)}>
                        {isInactive ? t('resubscribe') : isFreeTrial ? t('select') : t('upgrade')}
                        <ArrowUpRight className="ml-1 h-4 w-4" />
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
        </>
      )}

      {/* Already on Professional and active — show compact info */}
      {subscription?.plan === 'PROFESSIONAL' && !isInactive && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{t('onProfessional')}</p>
                <p className="text-sm text-muted-foreground">{t('onProfessionalDescription')}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:enterprise@dermaconsent.de?subject=Enterprise%20Plan%20Inquiry">
                {t('contactUs')}
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
