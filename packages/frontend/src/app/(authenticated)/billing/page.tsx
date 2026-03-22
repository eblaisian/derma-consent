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
  MessageSquare, Mail, Brain, HardDrive,
} from 'lucide-react';
import { PRICING } from '@/lib/pricing';

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

interface ResourceUsage {
  used: number;
  limit: number | null;
}

interface Usage {
  plan: string;
  periodKey: string;
  daysUntilReset: number;
  resources: {
    SMS: ResourceUsage;
    EMAIL: ResourceUsage;
    AI_EXPLAINER: ResourceUsage;
    STORAGE_BYTES: ResourceUsage;
  };
  consents: {
    used: number;
    limit: number | null;
  };
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${Math.round(bytes / 1048576)} MB`;
  return `${bytes} B`;
}

function ResourceRow({ label, icon: Icon, used, limit, isStorage }: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  used: number;
  limit: number | null;
  isStorage?: boolean;
}) {
  const t = useTranslations('billing');
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isNearLimit = limit ? percent >= 80 : false;
  const isAtLimit = limit ? used >= limit : false;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-3.5" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1.5 tabular-nums">
          <span className="font-medium text-foreground">
            {isStorage ? formatBytes(used) : used}
          </span>
          {limit !== null ? (
            <span className="text-muted-foreground">
              / {isStorage ? formatBytes(limit) : limit}
            </span>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t('unlimited')}</Badge>
          )}
        </div>
      </div>
      {limit !== null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
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

  // Check if any resource has quota issues (for the banner)
  const hasQuotaWarning = usage?.resources && Object.values(usage.resources).some(
    (r) => r.limit !== null && r.used >= r.limit * 0.8,
  );
  const hasQuotaExceeded = usage?.resources && Object.values(usage.resources).some(
    (r) => r.limit !== null && r.used >= r.limit,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-page-title font-display font-light text-balance">{t('title')}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{t('description')}</p>
      </div>

      {/* Cancellation pending banner */}
      {isCancelPending && subscription?.currentPeriodEnd && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/5 p-4">
          <Clock className="size-5 text-yellow-600 shrink-0" />
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
          <AlertTriangle className="size-5 text-destructive shrink-0" />
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
          <XCircle className="size-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium">{isCancelled ? t('cancelledTitle') : t('expiredTitle')}</p>
            <p className="text-sm text-muted-foreground">{isCancelled ? t('cancelledDescription') : t('expiredDescription')}</p>
          </div>
        </div>
      )}

      {/* Plan + Usage row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Current plan card */}
        <Card className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('currentPlan')}</CardTitle>
              {statusKey && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  subscription!.status === 'ACTIVE' || subscription!.status === 'TRIALING'
                    ? 'bg-success-subtle text-success'
                    : subscription!.status === 'PAST_DUE'
                      ? 'bg-destructive-subtle text-destructive'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {isCancelPending
                    ? t('cancelPendingBadge')
                    : tStatus.has(statusKey) ? tStatus(statusKey) : subscription!.status}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <p className="text-2xl font-semibold">
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
                <CreditCard className="mr-2 size-4" />
                {t('managePayments')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Usage card */}
        <Card className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('usageTitle')}</CardTitle>
              {usage && (
                <span className="text-xs text-muted-foreground">
                  {t('daysUntilReset', { days: usage.daysUntilReset })}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!usage ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <>
                <ResourceRow
                  label={t('resourceConsents')}
                  icon={FileText}
                  used={usage.consents.used}
                  limit={usage.consents.limit}
                />
                <ResourceRow
                  label={t('resourceSms')}
                  icon={MessageSquare}
                  used={usage.resources.SMS.used}
                  limit={usage.resources.SMS.limit}
                />
                <ResourceRow
                  label={t('resourceEmail')}
                  icon={Mail}
                  used={usage.resources.EMAIL.used}
                  limit={usage.resources.EMAIL.limit}
                />
                <ResourceRow
                  label={t('resourceAiExplainer')}
                  icon={Brain}
                  used={usage.resources.AI_EXPLAINER.used}
                  limit={usage.resources.AI_EXPLAINER.limit}
                />
                <ResourceRow
                  label={t('resourceStorage')}
                  icon={HardDrive}
                  used={usage.resources.STORAGE_BYTES.used}
                  limit={usage.resources.STORAGE_BYTES.limit}
                  isStorage
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quota warning/exceeded banner */}
      {hasQuotaExceeded && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <AlertTriangle className="size-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">{t('quotaExceededTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('quotaExceededDescription')}</p>
          </div>
        </div>
      )}
      {hasQuotaWarning && !hasQuotaExceeded && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/5 p-4">
          <AlertTriangle className="size-5 text-yellow-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-500">{t('quotaNearLimitTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('quotaNearLimitDescription')}</p>
          </div>
        </div>
      )}

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
              { plan: 'STARTER', price: billingInterval === 'monthly' ? PRICING.starter.monthly : PRICING.starter.yearly, interval: billingInterval, features: ['starterFeature1', 'starterFeature2', 'starterFeature3', 'starterFeature4', 'starterFeature5'] as const, priceId: starterPriceId, highlighted: false },
              { plan: 'PROFESSIONAL', price: billingInterval === 'monthly' ? PRICING.professional.monthly : PRICING.professional.yearly, interval: billingInterval, features: ['professionalFeature1', 'professionalFeature2', 'professionalFeature3', 'professionalFeature4', 'professionalFeature5'] as const, priceId: professionalPriceId, highlighted: true },
              { plan: 'ENTERPRISE', price: null, interval: billingInterval, features: ['enterpriseFeature1', 'enterpriseFeature2', 'enterpriseFeature3', 'enterpriseFeature4'] as const, priceId: null, highlighted: false },
            ] as const).map((tier) => {
              const isCurrent = subscription?.plan === tier.plan && !isInactive;
              return (
                <Card key={tier.plan} className={`flex flex-col rounded-xl border border-border/50 shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-border ${
                  tier.highlighted ? 'border-primary ring-1 ring-primary/20' : ''
                } ${tier.plan === 'ENTERPRISE' ? 'bg-gradient-to-br from-primary/[0.03] to-transparent' : ''}`}>
                  <CardHeader>
                    <CardTitle>{tPlans(tier.plan as keyof IntlMessages['subscriptionPlans'])}</CardTitle>
                    <CardDescription>{tPlans(`${tier.plan.toLowerCase()}Description` as keyof IntlMessages['subscriptionPlans'])}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <p className="text-2xl font-semibold tabular-nums">
                      {tier.price != null
                        ? t(tier.interval === 'monthly' ? 'priceMonthly' : 'priceYearly', { amount: tier.price })
                        : t('onRequest')}
                    </p>
                    <ul className="flex-1 space-y-1 text-sm text-muted-foreground">
                      {tier.features.map((fKey) => (
                        <li key={fKey} className="flex items-center gap-2">
                          <CheckCircle2 className="size-3.5 text-primary shrink-0" />
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
                        <ArrowUpRight className="ml-1 size-4" />
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
        <Card className="rounded-xl border border-border/50 bg-gradient-to-r from-primary/[0.03] to-transparent shadow-[var(--shadow-sm)]">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-primary" />
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
