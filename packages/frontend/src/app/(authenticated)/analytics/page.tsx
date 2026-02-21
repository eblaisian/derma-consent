'use client';

import { useSession } from 'next-auth/react';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const tTypes = useTranslations('consentTypes');
  const locale = useLocale();
  const format = useFormatter();
  const { data: session } = useSession();
  const authFetcher = createAuthFetcher(session?.accessToken);

  const { data: overview } = useSWR<Overview>(
    session?.accessToken ? `${API_URL}/api/analytics/overview` : null,
    authFetcher,
  );

  const { data: byType } = useSWR<ByType[]>(
    session?.accessToken ? `${API_URL}/api/analytics/by-type` : null,
    authFetcher,
  );

  const { data: byPeriod } = useSWR<ByPeriod[]>(
    session?.accessToken ? `${API_URL}/api/analytics/by-period?days=30` : null,
    authFetcher,
  );

  const { data: conversion } = useSWR<Conversion>(
    session?.accessToken ? `${API_URL}/api/analytics/conversion` : null,
    authFetcher,
  );

  const typeData = byType?.map((item) => ({
    name: tTypes.has(item.type as Parameters<typeof tTypes>[0]) ? tTypes(item.type as Parameters<typeof tTypes>[0]) : item.type,
    value: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('total')}</CardDescription>
            <CardTitle className="text-3xl">{overview?.total ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('pending')}</CardDescription>
            <CardTitle className="text-3xl">{overview?.pending ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('signed')}</CardDescription>
            <CardTitle className="text-3xl">{overview?.signed ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('patients')}</CardDescription>
            <CardTitle className="text-3xl">{overview?.patients ?? '—'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Conversion */}
      {conversion && (
        <Card>
          <CardHeader>
            <CardTitle>{t('conversionRate')}</CardTitle>
            <CardDescription>
              {t('conversionDescription', {
                signed: conversion.signed,
                total: conversion.total,
                rate: conversion.conversionRate,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${conversion.conversionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* By Type */}
        <Card>
          <CardHeader>
            <CardTitle>{t('byType')}</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {typeData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">{t('noData')}</p>
            )}
          </CardContent>
        </Card>

        {/* By Period */}
        <Card>
          <CardHeader>
            <CardTitle>{t('last30Days')}</CardTitle>
          </CardHeader>
          <CardContent>
            {byPeriod && byPeriod.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={byPeriod}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format.dateTime(new Date(d), { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(d) => format.dateTime(new Date(d as string), { dateStyle: 'medium' })}
                  />
                  <Line type="monotone" dataKey="created" stroke="#8884d8" name={t('created')} />
                  <Line type="monotone" dataKey="signed" stroke="#82ca9d" name={t('signed')} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">{t('noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
