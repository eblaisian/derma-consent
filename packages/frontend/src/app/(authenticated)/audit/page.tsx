'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useFormatter } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

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
] as const;

export default function AuditPage() {
  const t = useTranslations('audit');
  const tActions = useTranslations('auditActions');
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

  const { data } = useSWR<AuditResponse>(
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          {t('exportCsv')}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{t('actionFilter')}</Label>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('allActions')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allActions')}</SelectItem>
                  {auditActionKeys.map((key) => (
                    <SelectItem key={key} value={key}>{tActions(key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('dateFrom')}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('dateTo')}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('entries')}</CardTitle>
          <CardDescription>{t('totalEntries', { count: data?.total || 0 })}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('timestamp')}</TableHead>
                <TableHead>{t('action')}</TableHead>
                <TableHead>{t('user')}</TableHead>
                <TableHead>{t('entity')}</TableHead>
                <TableHead>{t('ip')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">
                    {format.dateTime(new Date(entry.createdAt), {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Europe/Berlin',
                    })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {tActions.has(entry.action as typeof auditActionKeys[number])
                      ? tActions(entry.action as typeof auditActionKeys[number])
                      : entry.action}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.user?.name || entry.user?.email || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.entityType ? `${entry.entityType}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.ipAddress || '—'}
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t('noEntries')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                {t('previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('pageOf', { page: data.page, totalPages: data.totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= data.totalPages}
              >
                {t('next')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
