'use client';

import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useAuthFetch } from '@/lib/auth-fetch';
import {
  Building2,
  Users,
  FileSignature,
  CreditCard,
} from 'lucide-react';

interface DashboardData {
  totalPractices: number;
  totalUsers: number;
  totalConsents: number;
  activeSubscriptions: number;
  totalRevenueCents: number;
  statusBreakdown: Record<string, number>;
  planDistribution: Record<string, number>;
  recentSignups: Array<{
    id: string;
    name: string;
    createdAt: string;
    _count: { users: number; consentForms: number };
    subscription: { plan: string; status: string } | null;
  }>;
}

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const authFetch = useAuthFetch();
  const { data, isLoading, error, mutate } = useSWR<DashboardData>(
    '/api/admin/dashboard',
    (url: string) => authFetch(url),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-sm text-muted-foreground">{t('errorLoading')}</p>
        <button
          onClick={() => mutate()}
          className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  const statCards = [
    { label: t('totalPractices'), value: data.totalPractices, icon: Building2, color: 'text-blue-600' },
    { label: t('totalUsers'), value: data.totalUsers, icon: Users, color: 'text-green-600' },
    { label: t('totalConsents'), value: data.totalConsents, icon: FileSignature, color: 'text-orange-600' },
    { label: t('activeSubscriptions'), value: data.activeSubscriptions, icon: CreditCard, color: 'text-violet-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('dashboard')}</h1>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan Distribution */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">{t('planDistribution')}</h2>
          <div className="space-y-3">
            {Object.entries(data.planDistribution).map(([plan, count]) => {
              const total = data.activeSubscriptions || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{plan}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(data.planDistribution).length === 0 && (
              <p className="text-sm text-muted-foreground">{t('noActiveSubscriptions')}</p>
            )}
          </div>
        </div>

        {/* Consent Status Breakdown */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">{t('consentBreakdown')}</h2>
          <div className="space-y-2">
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span className="capitalize">{status.toLowerCase()}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(data.statusBreakdown).length === 0 && (
              <p className="text-sm text-muted-foreground">{t('noConsentFormsYet')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="rounded-lg border bg-card">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold">{t('recentSignups')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">{t('practiceName')}</th>
                <th className="px-5 py-3 font-medium">{t('plan')}</th>
                <th className="px-5 py-3 font-medium">{t('totalUsers')}</th>
                <th className="px-5 py-3 font-medium">{t('consentsCount')}</th>
                <th className="px-5 py-3 font-medium">{t('createdDate')}</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSignups.map((practice) => (
                <tr key={practice.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium">{practice.name}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {practice.subscription?.plan ?? t('notApplicable')}
                    </span>
                  </td>
                  <td className="px-5 py-3">{practice._count.users}</td>
                  <td className="px-5 py-3">{practice._count.consentForms}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(practice.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {data.recentSignups.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    {t('noPracticesYet')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
