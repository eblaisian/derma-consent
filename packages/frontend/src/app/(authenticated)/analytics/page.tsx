'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations, useFormatter } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { AiInsightsCard } from '@/components/analytics/ai-insights-card';
import { FileSignature, Clock, CheckCircle, User, CreditCard, TrendingUp, PieChart as PieChartIcon, Activity, BarChart3 } from 'lucide-react';

const CHART_COLORS = [
  'oklch(0.50 0.12 185)',   // primary teal
  'oklch(0.60 0.15 155)',   // success green
  'oklch(0.70 0.12 80)',    // warm yellow
  'oklch(0.55 0.12 210)',   // cool blue
  'oklch(0.577 0.200 25)',  // warm red
  'oklch(0.60 0.10 300)',   // soft purple
];

interface Overview {
  total: number;
  pending: number;
  signed: number;
  completed: number;
  revoked: number;
  patients: number;
}

interface ByType {
  type: string;
  count: number;
}

interface ByPeriod {
  date: string;
  created: number;
  signed: number;
}

interface Conversion {
  total: number;
  signed: number;
  conversionRate: number;
}

interface Revenue {
  totalRevenue: number;
  transactionCount: number;
  averageTransaction: number;
}

type DateRange = '7d' | '30d' | '90d';

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const tTypes = useTranslations('consentTypes');
  const format = useFormatter();
  const router = useRouter();
  const { data: session } = useSession();
  const authFetcher = createAuthFetcher(session?.accessToken);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const daysMap: Record<DateRange, number> = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[dateRange];

  const { data: overview } = useSWR<Overview>(
    session?.accessToken ? `${API_URL}/api/analytics/overview` : null,
    authFetcher,
  );

  const { data: byType } = useSWR<ByType[]>(
    session?.accessToken ? `${API_URL}/api/analytics/by-type` : null,
    authFetcher,
  );

  const { data: byPeriod } = useSWR<ByPeriod[]>(
    session?.accessToken ? `${API_URL}/api/analytics/by-period?days=${days}` : null,
    authFetcher,
  );

  const { data: conversion } = useSWR<Conversion>(
    session?.accessToken ? `${API_URL}/api/analytics/conversion` : null,
    authFetcher,
  );

  const { data: revenue, isLoading: revenueLoading } = useSWR<Revenue>(
    session?.accessToken ? `${API_URL}/api/analytics/revenue` : null,
    authFetcher,
  );

  const isLoading = !overview && !byType && !byPeriod && !conversion && !revenue;

  const typeData = byType?.map((item) => ({
    name: tTypes.has(item.type as Parameters<typeof tTypes>[0]) ? tTypes(item.type as Parameters<typeof tTypes>[0]) : item.type,
    value: item.count,
  })) || [];

  if (!isLoading && overview?.total === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-page-title font-display font-light text-balance">{t('title')}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
            {t('description')}
          </p>
        </div>
        <EmptyState
          icon={BarChart3}
          title={t('noDataYetTitle')}
          description={t('noDataYetDescription')}
          actionLabel={t('noDataYetAction')}
          onAction={() => router.push('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title font-display font-light text-balance">{t('title')}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
            {t('description')}
          </p>
        </div>
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/50 p-0.5">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                dateRange === range
                  ? 'bg-card text-foreground shadow-[var(--shadow-sm)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setDateRange(range)}
            >
              {range === '7d' ? t('last7Days') : range === '30d' ? t('last30Days') : t('last90Days')}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 stagger-children">
        {isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[110px] rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              title={t('total')}
              value={overview?.total ?? '—'}
              icon={<FileSignature className="size-4" />}
              accent="primary"
            />
            <StatCard
              title={t('pending')}
              value={overview?.pending ?? '—'}
              icon={<Clock className="size-4" />}
              accent="warning"
            />
            <StatCard
              title={t('signed')}
              value={overview?.signed ?? '—'}
              icon={<CheckCircle className="size-4" />}
              accent="success"
            />
            <StatCard
              title={t('patients')}
              value={overview?.patients ?? '—'}
              icon={<User className="size-4" />}
              accent="info"
            />
          </>
        )}
      </div>

      <AiInsightsCard />

      {/* Revenue & Conversion side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue */}
        <Card className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/[0.06]">
                <CreditCard className="size-4 text-primary" />
              </span>
              <div>
                <CardTitle className="text-base">{t('revenue')}</CardTitle>
                <CardDescription className="text-xs">{t('revenueDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <>
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-4 w-56 mt-2" />
              </>
            ) : revenue?.totalRevenue === 0 && revenue?.transactionCount === 0 ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                  <CreditCard className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium text-muted-foreground">{t('noRevenue')}</p>
                <p className="mt-1 text-xs text-muted-foreground/70 max-w-[240px] mx-auto leading-relaxed">{t('noRevenueDescription')}</p>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold tabular-nums tracking-tight">
                  <span className="text-sm font-normal text-muted-foreground">EUR</span>{' '}
                  {revenue?.totalRevenue?.toFixed(2) ?? '0.00'}
                </p>
                <p className="text-sm text-muted-foreground mt-1 tabular-nums">
                  {revenue?.transactionCount ?? 0} {t('transactions')} | {t('avg')} EUR {revenue?.averageTransaction?.toFixed(2) ?? '0.00'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Conversion */}
        {conversion ? (
          <Card className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-success/[0.06]">
                  <TrendingUp className="size-4 text-success" />
                </span>
                <div>
                  <CardTitle className="text-base">{t('conversionRate')}</CardTitle>
                  <CardDescription className="text-xs">
                    {t('conversionDescription', {
                      signed: conversion.signed,
                      total: conversion.total,
                      rate: conversion.conversionRate,
                    })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-3xl font-bold tabular-nums tracking-tight">
                  {conversion.conversionRate.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground pb-1">
                  {conversion.signed} / {conversion.total}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all duration-500"
                  style={{ width: `${conversion.conversionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)]">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-20 mt-2" />
              <Skeleton className="h-3 w-full mt-4 rounded-full" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Type */}
        <Card className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/[0.06]">
                <PieChartIcon className="size-4 text-primary" />
              </span>
              <CardTitle className="text-base">{t('byType')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      dataKey="value"
                      label={false}
                      strokeWidth={2}
                      stroke="oklch(0.985 0.005 80)"
                    >
                      {typeData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid oklch(0.90 0.005 80)',
                        boxShadow: '0 4px 6px oklch(0.20 0.01 80 / 0.08)',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                  {typeData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="truncate max-w-[120px]">{entry.name}</span>
                      <span className="tabular-nums font-medium text-foreground">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                  <PieChartIcon className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{t('noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Period */}
        <Card className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-info/[0.06]">
                <Activity className="size-4 text-info" />
              </span>
              <CardTitle className="text-base">
                {dateRange === '7d' ? t('last7Days') : dateRange === '30d' ? t('last30Days') : t('last90Days')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {byPeriod && byPeriod.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={byPeriod}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 80)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format.dateTime(new Date(d), { day: '2-digit', month: '2-digit' })}
                    tick={{ fontSize: 12, fill: 'oklch(0.55 0.01 80)' }}
                    axisLine={{ stroke: 'oklch(0.90 0.005 80)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'oklch(0.55 0.01 80)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    labelFormatter={(d) => format.dateTime(new Date(d as string), { dateStyle: 'medium' })}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid oklch(0.90 0.005 80)',
                      boxShadow: '0 4px 6px oklch(0.20 0.01 80 / 0.08)',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="oklch(0.50 0.12 185)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    name={t('created')}
                  />
                  <Line
                    type="monotone"
                    dataKey="signed"
                    stroke="oklch(0.60 0.15 155)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    name={t('signed')}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                  <Activity className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{t('noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
