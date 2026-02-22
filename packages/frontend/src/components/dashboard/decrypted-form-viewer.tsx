'use client';

import { useEffect, useState } from 'react';
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
import { EncryptionBadge } from '@/components/ui/encryption-badge';

interface DecryptedFormViewerProps {
  token: string;
  onClose: () => void;
}

export function DecryptedFormViewer({ token, onClose }: DecryptedFormViewerProps) {
  const t = useTranslations('decryptedViewer');
  const tFields = useTranslations('medicalFields');
  const tOptions = useTranslations('medicalOptions');
  const tTypes = useTranslations('consentTypes');
  const tConsent = useTranslations('consent');
  const { decryptForm, isUnlocked } = useVault();
  const [decryptedData, setDecryptedData] = useState<Record<string, unknown> | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const { data: consent, error: fetchError } = useSWR(
    token ? `${API_URL}/api/consent/${token}` : null,
    fetcher,
  );

  useEffect(() => {
    if (!consent || !isUnlocked || decryptedData || isDecrypting) return;

    const encrypted = consent.encryptedResponses;
    const sessionKey = consent.encryptedSessionKey;

    if (!encrypted || !sessionKey) {
      setDecryptError(t('noData'));
      return;
    }

    setIsDecrypting(true);
    decryptForm({
      encryptedSessionKey: sessionKey,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
    })
      .then((data) => {
        setDecryptedData(data as Record<string, unknown>);
      })
      .catch(() => {
        setDecryptError(t('decryptionFailed'));
      })
      .finally(() => {
        setIsDecrypting(false);
      });
  }, [consent, isUnlocked, decryptForm, decryptedData, isDecrypting, t]);

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

        {fetchError && (
          <p className="text-sm text-destructive">{t('fetchError')}</p>
        )}

        {decryptError && (
          <p className="text-sm text-destructive">{decryptError}</p>
        )}

        {isDecrypting && (
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
