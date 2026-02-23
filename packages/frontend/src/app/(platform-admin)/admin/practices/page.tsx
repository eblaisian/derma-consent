'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Practice {
  id: string;
  name: string;
  isSuspended: boolean;
  createdAt: string;
  usersCount: number;
  consentsCount: number;
  plan: string | null;
  subscriptionStatus: string | null;
  ownerEmail: string | null;
}

interface PracticeListResponse {
  items: Practice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminPracticesPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'suspend' | 'activate' } | null>(null);

  const { data, isLoading, error, mutate } = useSWR<PracticeListResponse>(
    `/api/admin/practices?page=${page}&limit=25&search=${encodeURIComponent(debouncedSearch)}`,
    (url: string) => authFetch(url),
  );

  const handleSuspend = async (id: string) => {
    try {
      await authFetch(`/api/admin/practices/${id}/suspend`, { method: 'POST' });
      toast.success(t('suspended'));
      mutate();
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await authFetch(`/api/admin/practices/${id}/activate`, { method: 'POST' });
      toast.success(t('active'));
      mutate();
    } catch {
      toast.error(t('saveFailed'));
    }
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'suspend') {
      handleSuspend(confirmAction.id);
    } else {
      handleActivate(confirmAction.id);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('practices')}</h1>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={`${t('practiceName')}...`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 flex items-center justify-between">
          <span>{t('errorLoading')}</span>
          <button onClick={() => mutate()} className="rounded border px-3 py-1 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900">
            {t('retry')}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-5 py-3 font-medium">{t('practiceName')}</th>
              <th className="px-5 py-3 font-medium">{t('ownerEmail')}</th>
              <th className="px-5 py-3 font-medium">{t('plan')}</th>
              <th className="px-5 py-3 font-medium">{t('consentsCount')}</th>
              <th className="px-5 py-3 font-medium">{t('status')}</th>
              <th className="px-5 py-3 font-medium">{t('createdDate')}</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  {t('noPracticesFound')}
                </td>
              </tr>
            ) : (
              data?.items.map((practice) => (
                <tr
                  key={practice.id}
                  className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/admin/practices/${practice.id}`)}
                >
                  <td className="px-5 py-3 font-medium">{practice.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{practice.ownerEmail ?? '-'}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {practice.plan ?? t('notApplicable')}
                    </span>
                  </td>
                  <td className="px-5 py-3">{practice.consentsCount}</td>
                  <td className="px-5 py-3">
                    {practice.isSuspended ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">
                        {t('suspended')}
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                        {t('active')}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(practice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmAction({
                          id: practice.id,
                          type: practice.isSuspended ? 'activate' : 'suspend',
                        });
                      }}
                      className={`rounded px-3 py-1 text-xs font-medium ${
                        practice.isSuspended
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {practice.isSuspended ? t('activate') : t('suspend')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {data.total} {t('practices').toLowerCase()}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >
              {t('previous')}
            </button>
            <span className="flex items-center px-2">
              {page} / {data.totalPages}
            </span>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title={confirmAction?.type === 'suspend' ? t('suspend') : t('activate')}
        description={confirmAction?.type === 'suspend' ? t('suspendConfirm') : t('activateConfirm')}
        confirmLabel={confirmAction?.type === 'suspend' ? t('suspend') : t('activate')}
        cancelLabel={t('cancel')}
        onConfirm={handleConfirm}
        variant={confirmAction?.type === 'suspend' ? 'destructive' : 'default'}
      />
    </div>
  );
}
