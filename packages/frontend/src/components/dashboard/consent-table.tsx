'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useAuthFetch } from '@/lib/auth-fetch';
import type { ConsentFormSummary, ConsentStatus } from '@/lib/types';
import type { ConsentType } from '@/components/consent-form/form-fields';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const statusVariants: Record<ConsentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  FILLED: 'secondary',
  SIGNED: 'default',
  PAID: 'default',
  COMPLETED: 'secondary',
  EXPIRED: 'outline',
  REVOKED: 'destructive',
};

interface ConsentTableProps {
  consents: ConsentFormSummary[];
  isVaultUnlocked: boolean;
  onRefresh: () => void;
}

export function ConsentTable({ consents, isVaultUnlocked, onRefresh }: ConsentTableProps) {
  const t = useTranslations('consentTable');
  const tStatus = useTranslations('consentStatus');
  const tTypes = useTranslations('consentTypes');
  const format = useFormatter();
  const authFetch = useAuthFetch();
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

  const canDecrypt = (status: ConsentStatus) =>
    isVaultUnlocked &&
    (status === 'SIGNED' || status === 'PAID' || status === 'COMPLETED');

  if (consents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('noConsents')}
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('type')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead>{t('createdAt')}</TableHead>
            <TableHead>{t('validUntil')}</TableHead>
            <TableHead className="text-right">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consents.map((consent) => {
            const variant = statusVariants[consent.status];
            return (
              <TableRow key={consent.id}>
                <TableCell className="font-medium">
                  {tTypes.has(consent.type as ConsentType) ? tTypes(consent.type as ConsentType) : consent.type}
                </TableCell>
                <TableCell>
                  <Badge variant={variant}>
                    {tStatus.has(consent.status) ? tStatus(consent.status) : consent.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format.dateTime(new Date(consent.createdAt), {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Europe/Berlin',
                  })}
                </TableCell>
                <TableCell>
                  {format.dateTime(new Date(consent.expiresAt), {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Europe/Berlin',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(consent.token)}
                    >
                      {t('link')}
                    </Button>

                    {canDecrypt(consent.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDecryptToken(consent.token)}
                      >
                        {t('decrypt')}
                      </Button>
                    )}

                    {canRevoke(consent.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setRevokeToken(consent.token)}
                      >
                        {t('revoke')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
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
