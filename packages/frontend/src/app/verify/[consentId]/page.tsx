'use client';

import { use } from 'react';
import useSWR from 'swr';
import { useTranslations, useFormatter } from 'next-intl';
import { Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Not found');
  return res.json();
});

interface VerificationData {
  practiceName: string;
  consentType: string;
  dateSigned: string | null;
  status: string;
  pdfSignatureHash: string | null;
  isValid: boolean;
}

export default function VerifyPage({
  params,
}: {
  params: Promise<{ consentId: string }>;
}) {
  const { consentId } = use(params);
  const t = useTranslations('verify');
  const tTypes = useTranslations('consentTypes');
  const tStatus = useTranslations('consentStatus');
  const format = useFormatter();

  const { data, error, isLoading } = useSWR<VerificationData>(
    `${API_URL}/api/verify/${consentId}`,
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <ShieldX className="size-16 mx-auto text-destructive" />
          <h1 className="text-xl font-semibold">{t('notFound')}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          {data.isValid ? (
            <ShieldCheck className="size-16 mx-auto text-emerald-500" />
          ) : (
            <Shield className="size-16 mx-auto text-muted-foreground" />
          )}
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Verification card */}
        <div className="surface-raised rounded-xl p-6 space-y-4">
          {data.isValid && (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2">
              <ShieldCheck className="size-4" />
              {t('verified')}
            </div>
          )}

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('practiceName')}</dt>
              <dd className="font-medium text-end">{data.practiceName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('consentType')}</dt>
              <dd className="font-medium">{tTypes.has(data.consentType as keyof IntlMessages['consentTypes']) ? tTypes(data.consentType as keyof IntlMessages['consentTypes']) : data.consentType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('dateSigned')}</dt>
              <dd className="font-medium">
                {data.dateSigned
                  ? format.dateTime(new Date(data.dateSigned), { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Berlin' })
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-muted-foreground">{t('status')}</dt>
              <dd>
                <StatusBadge
                  status={data.status as import('@/lib/types').ConsentStatus}
                  label={tStatus.has(data.status as keyof IntlMessages['consentStatus']) ? tStatus(data.status as keyof IntlMessages['consentStatus']) : undefined}
                />
              </dd>
            </div>
            {data.pdfSignatureHash && (
              <div>
                <dt className="text-muted-foreground mb-1">{t('documentHash')}</dt>
                <dd className="font-mono text-xs break-all bg-muted/50 rounded px-2 py-1">
                  {data.pdfSignatureHash}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {t('disclaimer')}
        </p>
      </div>
    </div>
  );
}
