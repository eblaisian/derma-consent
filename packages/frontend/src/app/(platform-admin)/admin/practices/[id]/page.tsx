'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useAuthFetch } from '@/lib/auth-fetch';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Mail, Brain, HardDrive, AlertTriangle } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface PracticeDetail {
  id: string;
  name: string;
  dsgvoContact: string;
  stripeConnectId: string | null;
  isSuspended: boolean;
  suspendedAt: string | null;
  createdAt: string;
  _count: { users: number; consentForms: number; patients: number };
  subscription: {
    id: string;
    plan: string;
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
  } | null;
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  }>;
  consentStatusBreakdown: Record<string, number>;
}

const PLANS = ['FREE_TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

type Tab = 'overview' | 'users' | 'consents' | 'subscription' | 'usage';

interface PracticeUsage {
  plan: string;
  periodKey: string;
  daysUntilReset: number;
  resources: Record<string, { used: number; limit: number | null }>;
  alerts: Array<{
    id: string;
    resource: string;
    threshold: number;
    sentAt: string;
  }>;
}

const USAGE_RESOURCE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  SMS: { icon: MessageSquare, label: 'SMS' },
  EMAIL: { icon: Mail, label: 'Email' },
  AI_EXPLAINER: { icon: Brain, label: 'AI Explainer' },
  STORAGE_BYTES: { icon: HardDrive, label: 'Storage' },
};

function formatUsageValue(resource: string, value: number): string {
  if (resource === 'STORAGE_BYTES') {
    if (value >= 1073741824) return `${(value / 1073741824).toFixed(1)} GB`;
    if (value >= 1048576) return `${Math.round(value / 1048576)} MB`;
    return `${value} B`;
  }
  return value.toLocaleString();
}

export default function PracticeDetailPage() {
  const t = useTranslations('admin');
  const format = useFormatter();
  const { id } = useParams<{ id: string }>();
  const authFetch = useAuthFetch();
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  const { data: practice, isLoading, error, mutate } = useSWR<PracticeDetail>(
    `/api/admin/practices/${id}`,
    (url: string) => authFetch(url),
  );

  const { data: usageData } = useSWR<PracticeUsage>(
    tab === 'usage' ? `/api/admin/practices/${id}/usage` : null,
    (url: string) => authFetch(url),
  );

  const handleOverridePlan = async () => {
    if (!selectedPlan) return;
    try {
      await authFetch(`/api/admin/practices/${id}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({ plan: selectedPlan }),
      });
      toast.success(t('saved'));
      mutate();
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const handleToggleSuspension = async () => {
    if (!practice) return;
    const action = practice.isSuspended ? 'activate' : 'suspend';
    try {
      await authFetch(`/api/admin/practices/${id}/${action}`, { method: 'POST' });
      toast.success(practice.isSuspended ? t('active') : t('suspended'));
      mutate();
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !practice) {
    const is404 = error?.status === 404 || error?.message?.includes('404');
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="text-center">
          <h2 className="text-xl font-bold">{is404 ? t('practiceNotFound') : t('errorLoading')}</h2>
          {is404 && (
            <p className="mt-2 text-sm text-muted-foreground">{t('practiceNotFoundDescription')}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/practices"
            className="rounded border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t('backToPractices')}
          </Link>
          {!is404 && (
            <button
              onClick={() => mutate()}
              className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              {t('retry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: t('overview') },
    { key: 'users', label: t('users') },
    { key: 'consents', label: t('consents') },
    { key: 'subscription', label: t('subscription') },
    { key: 'usage', label: t('usageTab') },
  ];

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link href="/admin/practices" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-page-title text-balance">{practice.name}</h1>
          <p className="text-sm text-muted-foreground text-pretty">{practice.dsgvoContact}</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowSuspendDialog(true)}
            className={`rounded px-4 py-2 text-sm font-medium ${
              practice.isSuspended
                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
            }`}
          >
            {practice.isSuspended ? t('activate') : t('suspend')}
          </button>
        </div>
      </div>

      {/* Status badge */}
      {practice.isSuspended && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {t('suspended')} — {practice.suspendedAt ? format.dateTime(new Date(practice.suspendedAt), { dateStyle: 'medium', timeStyle: 'short' }) : ''}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === tabItem.key
                ? 'border-violet-500 text-violet-700 dark:text-violet-300'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{t('totalUsers')}</p>
            <p className="text-2xl font-bold">{practice._count.users}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{t('consentsCount')}</p>
            <p className="text-2xl font-bold">{practice._count.consentForms}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{t('plan')}</p>
            <p className="text-2xl font-bold">{practice.subscription?.plan ?? t('notApplicable')}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{t('stripeConnect')}</p>
            <p className="text-2xl font-bold">{practice.stripeConnectId ? t('connected') : t('notConnected')}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 sm:col-span-2">
            <p className="text-sm text-muted-foreground">{t('createdDate')}</p>
            <p className="text-lg font-medium">{format.dateTime(new Date(practice.createdAt), { dateStyle: 'medium' })}</p>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">{t('nameColumn')}</th>
                <th className="px-5 py-3 font-medium">{t('emailColumn')}</th>
                <th className="px-5 py-3 font-medium">{t('roleColumn')}</th>
                <th className="px-5 py-3 font-medium">{t('createdDate')}</th>
              </tr>
            </thead>
            <tbody>
              {practice.users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">{user.name ?? '-'}</td>
                  <td className="px-5 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{user.role}</span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {format.dateTime(new Date(user.createdAt), { dateStyle: 'medium' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'consents' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(practice.consentStatusBreakdown).map(([status, count]) => (
              <div key={status} className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground capitalize">{status.toLowerCase()}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
            {Object.keys(practice.consentStatusBreakdown).length === 0 && (
              <p className="text-muted-foreground col-span-full">{t('noConsentFormsYet')}</p>
            )}
          </div>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="space-y-6">
          {practice.subscription ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm text-muted-foreground">{t('currentPlan')}</p>
                  <p className="text-xl font-bold">{practice.subscription.plan}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm text-muted-foreground">{t('status')}</p>
                  <p className="text-xl font-bold">{practice.subscription.status}</p>
                </div>
              </div>

              {/* Override plan */}
              <div className="rounded-lg border bg-card p-5">
                <h3 className="mb-3 font-semibold">{t('overridePlan')}</h3>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedPlan || practice.subscription.plan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {PLANS.map((plan) => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleOverridePlan}
                    disabled={!selectedPlan || selectedPlan === practice.subscription.plan}
                    className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {t('save')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">{t('noSubscriptionFound')}</p>
          )}
        </div>
      )}

      {tab === 'usage' && (
        <div className="space-y-4">
          {!usageData ? (
            <div className="flex items-center justify-center py-10">
              <div className="size-6 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t('currentPeriod')}: {usageData.periodKey}</span>
                <span>{t('daysUntilReset', { days: usageData.daysUntilReset })}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(usageData.resources).map(([resource, data]) => {
                  const meta = USAGE_RESOURCE_META[resource];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  const percent = data.limit ? Math.min(100, Math.round((data.used / data.limit) * 100)) : 0;
                  const isNear = data.limit ? percent >= 80 : false;
                  const isAt = data.limit ? data.used >= data.limit : false;

                  return (
                    <div key={resource} className="rounded-lg border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{meta.label}</span>
                        </div>
                        <span className="text-sm tabular-nums">
                          <span className="font-semibold">{formatUsageValue(resource, data.used)}</span>
                          {data.limit !== null ? (
                            <span className="text-muted-foreground"> / {formatUsageValue(resource, data.limit)}</span>
                          ) : (
                            <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded">{t('unlimited')}</span>
                          )}
                        </span>
                      </div>
                      {data.limit !== null && (
                        <div className="space-y-1">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isAt ? 'bg-red-500' : isNear ? 'bg-yellow-500' : 'bg-violet-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-right">{percent}%</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {usageData.alerts.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="size-4 text-yellow-600" />
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">{t('usageAlerts')}</h3>
                  </div>
                  <div className="space-y-1">
                    {usageData.alerts.map((alert) => (
                      <p key={alert.id} className="text-sm text-yellow-700 dark:text-yellow-400">
                        {USAGE_RESOURCE_META[alert.resource]?.label ?? alert.resource} — {alert.threshold}% {t('alertThreshold')}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={showSuspendDialog}
        onOpenChange={setShowSuspendDialog}
        title={practice.isSuspended ? t('activate') : t('suspend')}
        description={practice.isSuspended ? t('activateConfirm') : t('suspendConfirm')}
        confirmLabel={practice.isSuspended ? t('activate') : t('suspend')}
        cancelLabel={t('cancel')}
        onConfirm={handleToggleSuspension}
        variant={practice.isSuspended ? 'default' : 'destructive'}
      />
    </div>
  );
}
