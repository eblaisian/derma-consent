'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useFormatter } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Download, ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
}

interface AuditResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const auditActionKeys = [
  'CONSENT_CREATED',
  'CONSENT_SUBMITTED',
  'CONSENT_REVOKED',
  'CONSENT_VIEWED',
  'VAULT_UNLOCKED',
  'VAULT_LOCKED',
  'PATIENT_CREATED',
  'PATIENT_VIEWED',
  'TEAM_MEMBER_INVITED',
  'TEAM_MEMBER_REMOVED',
  'TEAM_MEMBER_ROLE_CHANGED',
  'PRACTICE_SETTINGS_UPDATED',
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_CANCELLED',
  'DATA_EXPORTED',
  'DATA_DELETED',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'ACCOUNT_LOCKED',
  'PHOTO_VIEWED',
  'TREATMENT_PLAN_CREATED',
  'TREATMENT_PLAN_VIEWED',
  'CONSENT_EXPLAINER_REQUESTED',
] as const;

function isSignificantIp(ip: string | null): boolean {
  if (!ip || ip === '—') return false;
  if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return false;
  return true;
}

function getActionBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (action.includes('REVOKED') || action.includes('REMOVED') || action.includes('DELETED') || action.includes('FAILED') || action.includes('LOCKED') || action.includes('CANCELLED')) {
    return 'destructive';
  }
  if (action.includes('CREATED') || action.includes('SUBMITTED') || action.includes('SUCCESS') || action.includes('UNLOCKED')) {
    return 'default';
  }
  if (action.includes('UPDATED') || action.includes('CHANGED') || action.includes('INVITED')) {
    return 'secondary';
  }
  return 'outline';
}

export default function AuditPage() {
  const t = useTranslations('audit');
  const tActions = useTranslations('auditActions');
  const tActionLabels = useTranslations('auditActionLabels');
  const format = useFormatter();
  const { data: session } = useSession();
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', '25');
  if (actionFilter) queryParams.set('action', actionFilter);
  if (startDate) queryParams.set('startDate', startDate);
  if (endDate) queryParams.set('endDate', endDate);

  const { data, isLoading } = useSWR<AuditResponse>(
    session?.accessToken ? `${API_URL}/api/audit?${queryParams}` : null,
    createAuthFetcher(session?.accessToken),
  );

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/api/audit/export`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('exportStarted'));
    } catch {
      toast.error(t('exportError'));
    }
  };

  const hasSignificantIps = data?.items.some((e) => isSignificantIp(e.ipAddress)) ?? false;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title font-display font-light text-balance">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed text-pretty">
            {t('description')}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="size-4" />
          {t('exportCsv')}
        </Button>
      </div>

      {/* Filter toolbar */}
      <div className="surface-raised p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5 min-w-48">
            <Label className="text-xs text-muted-foreground">{t('actionFilter')}</Label>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('allActions')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allActions')}</SelectItem>
                {auditActionKeys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {tActionLabels.has(key) ? tActionLabels(key) : key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('dateFrom')}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('dateTo')}</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* Entries table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('entries')}</CardTitle>
              <CardDescription>{t('totalEntries', { count: data?.total || 0 })}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">{t('timestamp')}</TableHead>
                <TableHead>{t('action')}</TableHead>
                <TableHead className="w-32">{t('entity')}</TableHead>
                {hasSignificantIps && (
                  <TableHead className="w-36">{t('ip')}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  {hasSignificantIps && (
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  )}
                </TableRow>
              ))}
              {data?.items.map((entry) => {
                const actor = entry.user?.name || entry.user?.email || t('unknownUser');
                return (
                  <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors duration-150">
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {format.dateTime(new Date(entry.createdAt), {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'Europe/Berlin',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getActionBadgeVariant(entry.action)} className="text-xs font-normal">
                          {entry.action.split('_').slice(0, 2).join('_')}
                        </Badge>
                        <span className="text-sm">
                          {tActions.has(entry.action as typeof auditActionKeys[number])
                            ? tActions(entry.action as typeof auditActionKeys[number], { actor })
                            : `${actor}: ${entry.action}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.entityType || '—'}
                    </TableCell>
                    {hasSignificantIps && (
                      <TableCell className="text-sm text-muted-foreground font-mono text-xs">
                        {isSignificantIp(entry.ipAddress) ? entry.ipAddress : ''}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {!isLoading && (!data?.items || data.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={hasSignificantIps ? 4 : 3} className="h-48">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <ScrollText className="size-5 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{t('noEntries')}</p>
                        <p className="text-xs text-muted-foreground">
                          {actionFilter || startDate || endDate
                            ? t('description')
                            : t('description')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground">
                {t('pageOf', { page: data.page, totalPages: data.totalPages })}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  aria-label={t('previous')}
                  className="gap-1"
                >
                  <ChevronLeft className="size-4" />
                  {t('previous')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.totalPages}
                  aria-label={t('next')}
                  className="gap-1"
                >
                  {t('next')}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
