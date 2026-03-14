'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useVault } from '@/hooks/use-vault';
import type { ConsentFormSummary, ConsentStatus } from '@/lib/types';
import type { ConsentType } from '@/components/consent-form/form-fields';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { DecryptedFormViewer } from './decrypted-form-viewer';
import { NoShowRiskBadge } from './no-show-risk-badge';
import { FileSignature, Link as LinkIcon, Eye, Ban } from 'lucide-react';

interface ConsentTableProps {
  consents: ConsentFormSummary[];
  onRefresh: () => void;
  onCreateConsent?: () => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export function ConsentTable({ consents, onRefresh, onCreateConsent, statusFilter: externalFilter, onStatusFilterChange }: ConsentTableProps) {
  const t = useTranslations('consentTable');
  const tStatus = useTranslations('consentStatus');
  const tTypes = useTranslations('consentTypes');
  const format = useFormatter();
  const authFetch = useAuthFetch();
  const { isUnlocked: isVaultUnlocked, requestUnlock } = useVault();
  const [revokeToken, setRevokeToken] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [decryptToken, setDecryptToken] = useState<string | null>(null);
  const [internalFilter, setInternalFilter] = useState<string>('ALL');
  const statusFilter = externalFilter ?? internalFilter;
  const setStatusFilter = onStatusFilterChange ?? setInternalFilter;

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/consent/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success(t('linkCopied'));
  };

  const handleRevoke = async () => {
    if (!revokeToken) return;

    setIsRevoking(true);
    try {
      await authFetch(`/api/consent/${revokeToken}/revoke`, {
        method: 'PATCH',
      });

      toast.success(t('revoked'));
      setRevokeToken(null);
      onRefresh();
    } catch {
      toast.error(t('revokeError'));
    } finally {
      setIsRevoking(false);
    }
  };

  const canRevoke = (status: ConsentStatus) =>
    status === 'SIGNED' || status === 'COMPLETED' || status === 'PAID';

  const hasDecryptableData = (status: ConsentStatus) =>
    status === 'SIGNED' || status === 'PAID' || status === 'COMPLETED';

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('daysAgo', { count: diffDays });
    return format.dateTime(date, { dateStyle: 'medium', timeZone: 'Europe/Berlin' });
  };

  if (consents.length === 0) {
    return (
      <EmptyState
        icon={FileSignature}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
        actionLabel={onCreateConsent ? t('emptyAction') : undefined}
        onAction={onCreateConsent}
      />
    );
  }

  const filteredConsents = statusFilter === 'ALL'
    ? consents
    : consents.filter((c) => c.status === statusFilter);

  const statuses = [...new Set(consents.map((c) => c.status))];

  return (
    <>
      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('allStatuses')}</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {tStatus.has(status) ? tStatus(status) : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-semibold text-foreground-secondary">{t('type')}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground-secondary">{t('status')}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground-secondary">{t('risk')}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground-secondary">{t('createdAt')}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground-secondary">{t('validUntil')}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground-secondary text-end">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="stagger-children">
          {filteredConsents.map((consent) => (
            <TableRow key={consent.id} className="border-border-subtle transition-default animate-fade-in-up">
              <TableCell className="font-medium">
                {tTypes.has(consent.type as ConsentType) ? tTypes(consent.type as ConsentType) : consent.type}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={consent.status}
                  label={tStatus.has(consent.status) ? tStatus(consent.status) : undefined}
                />
              </TableCell>
              <TableCell>
                {consent.noShowRisk && <NoShowRiskBadge risk={consent.noShowRisk} />}
              </TableCell>
              <TableCell
                className="text-foreground-secondary"
                title={format.dateTime(new Date(consent.createdAt), { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Berlin' })}
              >
                {formatRelativeDate(consent.createdAt)}
              </TableCell>
              <TableCell
                className="text-foreground-secondary"
                title={format.dateTime(new Date(consent.expiresAt), { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Berlin' })}
              >
                {format.dateTime(new Date(consent.expiresAt), { dateStyle: 'medium', timeZone: 'Europe/Berlin' })}
              </TableCell>
              <TableCell className="text-end">
                <div className="flex justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopyLink(consent.token)}
                        aria-label={t('link')}
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('link')}</TooltipContent>
                  </Tooltip>

                  {hasDecryptableData(consent.status) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            if (isVaultUnlocked) {
                              setDecryptToken(consent.token);
                            } else {
                              requestUnlock();
                            }
                          }}
                          aria-label={t('decrypt')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('decrypt')}</TooltipContent>
                    </Tooltip>
                  )}

                  {canRevoke(consent.status) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRevokeToken(consent.token)}
                          aria-label={t('revoke')}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('revoke')}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!revokeToken}
        onOpenChange={(open) => !open && setRevokeToken(null)}
        title={t('revokeTitle')}
        description={t('revokeDescription')}
        confirmLabel={isRevoking ? t('revoking') : t('revoke')}
        cancelLabel={t('cancel')}
        onConfirm={handleRevoke}
        variant="destructive"
        loading={isRevoking}
      />

      {decryptToken && (
        <DecryptedFormViewer
          token={decryptToken}
          onClose={() => setDecryptToken(null)}
        />
      )}
    </>
  );
}
