'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { API_URL, fetcher } from '@/lib/api';
import { useVault } from '@/hooks/use-vault';
import { getFormFields, type ConsentType } from '@/components/consent-form/form-fields';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EncryptionBadge } from '@/components/ui/encryption-badge';
import Link from 'next/link';
import { User } from 'lucide-react';

interface DecryptedFormViewerProps {
  token: string;
  onClose: () => void;
  patientName?: string;
  patientId?: string;
}

export function DecryptedFormViewer({ token, onClose, patientName, patientId }: DecryptedFormViewerProps) {
  const t = useTranslations('decryptedViewer');
  const tFields = useTranslations('medicalFields');
  const tOptions = useTranslations('medicalOptions');
  const tTypes = useTranslations('consentTypes');
  const tConsent = useTranslations('consent');
  const { decryptForm, isUnlocked } = useVault();
  const decryptFormRef = useRef(decryptForm);
  useEffect(() => { decryptFormRef.current = decryptForm; }, [decryptForm]);
  const [decryptedData, setDecryptedData] = useState<Record<string, unknown> | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const { data: consent, error: fetchError, isLoading: isFetching } = useSWR(
    token ? `${API_URL}/api/consent/${token}` : null,
    fetcher,
  );

  useEffect(() => {
    // Guard: skip if data not ready, vault locked, already decrypted, currently decrypting, or errored
    if (!consent || !isUnlocked || decryptedData || isDecrypting || decryptError) return;

    const encrypted = consent.encryptedResponses;
    const sessionKey = consent.encryptedSessionKey;

    if (!encrypted || !sessionKey) {
      setDecryptError(t('noData'));
      return;
    }

    let cancelled = false;
    setIsDecrypting(true);
    decryptFormRef.current({
      encryptedSessionKey: sessionKey,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
    })
      .then((data) => {
        if (!cancelled) setDecryptedData(data as Record<string, unknown>);
      })
      .catch(() => {
        if (!cancelled) setDecryptError(t('decryptionFailed'));
      })
      .finally(() => {
        if (!cancelled) setIsDecrypting(false);
      });
    return () => { cancelled = true; };
  }, [consent, isUnlocked, decryptedData, decryptError, t]);

  const consentType = consent?.type as ConsentType | undefined;
  const fields = consentType ? getFormFields(consentType) : [];

  const resolveFieldLabel = (labelKey: string): string => {
    return tFields.has(labelKey as keyof IntlMessages['medicalFields'])
      ? tFields(labelKey as keyof IntlMessages['medicalFields'])
      : labelKey;
  };

  const resolveOptionValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? tConsent('yes') : tConsent('no');
    if (Array.isArray(value)) {
      return value.map((v) => {
        const key = String(v);
        return tOptions.has(key as keyof IntlMessages['medicalOptions'])
          ? tOptions(key as keyof IntlMessages['medicalOptions'])
          : key;
      }).join(', ');
    }
    const strVal = String(value);
    return tOptions.has(strVal as keyof IntlMessages['medicalOptions'])
      ? tOptions(strVal as keyof IntlMessages['medicalOptions'])
      : strVal;
  };

  const isLoading = isFetching || isDecrypting;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {consentType && tTypes.has(consentType) ? tTypes(consentType) : consentType || ''} - {t('title')}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {t('description')}
            <EncryptionBadge />
          </DialogDescription>
        </DialogHeader>

        {patientId && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <User className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('patient')}:</span>
            <Link href={`/patients/${patientId}`} onClick={onClose} className="text-sm font-medium text-primary hover:underline underline-offset-4">
              {patientName || patientId.slice(0, 8)}
            </Link>
          </div>
        )}

        {fetchError && (
          <p className="text-sm text-destructive">{t('fetchError')}</p>
        )}

        {decryptError && (
          <p className="text-sm text-destructive">{decryptError}</p>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {decryptedData && (
          <div className="space-y-3">
            {fields.map((field) => {
              const value = decryptedData[field.name];
              if (value === undefined && !field.required) return null;
              return (
                <div key={field.name}>
                  <Label className="text-xs text-muted-foreground">{resolveFieldLabel(field.labelKey)}</Label>
                  <p className="text-sm mt-0.5">{resolveOptionValue(value)}</p>
                </div>
              );
            })}

            {typeof decryptedData.signatureData === 'string' && (
              <>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">{t('signature')}</Label>
                  <img
                    src={decryptedData.signatureData as string}
                    alt={t('signatureAlt')}
                    className="mt-1 border rounded max-h-32"
                  />
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
