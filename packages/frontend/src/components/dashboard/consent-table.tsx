'use client';

import { useState } from 'react';
import { useTranslations, useFormatter, useNow } from 'next-intl';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useVault } from '@/hooks/use-vault';
import type { ConsentFormSummary, ConsentStatus } from '@/lib/types';
import type { ConsentType } from '@/components/consent-form/form-fields';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DecryptedFormViewer } from './decrypted-form-viewer';
import { FileSignature, Link as LinkIcon, Eye, Ban } from 'lucide-react';

interface ConsentTableProps {
  consents: ConsentFormSummary[];
  onRefresh: () => void;
  onCreateConsent?: () => void;
}

export function ConsentTable({ consents, onRefresh, onCreateConsent }: ConsentTableProps) {
  const t = useTranslations('consentTable');
  const tStatus = useTranslations('consentStatus');
  const tTypes = useTranslations('consentTypes');
  const format = useFormatter();
  const authFetch = useAuthFetch();
  const { isUnlocked: isVaultUnlocked, requestUnlock } = useVault();
  const [revokeToken, setRevokeToken] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [decryptToken, setDecryptToken] = useState<string | null>(null);

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

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-semibold text-foreground-secondary">{t('type')}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground-secondary">{t('status')}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground-secondary">{t('createdAt')}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground-secondary">{t('validUntil')}</TableHead>
            <TableHead className="text-xs font-semibold text-foreground-secondary text-end">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="stagger-children">
          {consents.map((consent) => (
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
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleCopyLink(consent.token)}
                    title={t('link')}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </Button>

                  {hasDecryptableData(consent.status) && (
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
                      title={t('decrypt')}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  {canRevoke(consent.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRevokeToken(consent.token)}
                      title={t('revoke')}
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={!!revokeToken} onOpenChange={(open) => !open && setRevokeToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('revokeTitle')}</DialogTitle>
            <DialogDescription>
              {t('revokeDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRevokeToken(null)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={isRevoking}>
              {isRevoking ? t('revoking') : t('revoke')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decrypt Dialog */}
      {decryptToken && (
        <DecryptedFormViewer
          token={decryptToken}
          onClose={() => setDecryptToken(null)}
        />
      )}
    </>
  );
}
