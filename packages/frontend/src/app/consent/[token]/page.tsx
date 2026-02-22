'use client';

import { use, useCallback, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { ConsentForm } from '@/components/consent-form/consent-form';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useVault } from '@/hooks/use-vault';
import { Shield, CheckCircle, FileSignature } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConsentType } from '@/components/consent-form/form-fields';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Consent form not found or expired');
  return res.json();
});

export default function ConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const t = useTranslations('consent');
  const { encryptForPractice } = useVault();
  const [submitted, setSubmitted] = useState(false);
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);

  const { data, error, isLoading } = useSWR(
    `${API_URL}/api/consent/${token}`,
    fetcher,
  );

  const handleSubmit = useCallback(
    async (submission: {
      formData: Record<string, unknown>;
      signatureData: string;
      comprehensionScore?: number;
      comprehensionAnswers?: Array<{ questionId: string; selectedIndex: number; correct: boolean }>;
    }) => {
      if (!data?.practice?.publicKey) {
        throw new Error('Practice public key not available');
      }

      const encrypted = await encryptForPractice(
        {
          ...submission.formData,
          signatureData: submission.signatureData,
        },
        data.practice.publicKey,
      );

      const response = await fetch(`${API_URL}/api/consent/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedResponses: {
            iv: encrypted.iv,
            ciphertext: encrypted.ciphertext,
          },
          encryptedSessionKey: encrypted.encryptedSessionKey,
          signatureData: submission.signatureData,
          ...(submission.comprehensionScore !== undefined && {
            comprehensionScore: submission.comprehensionScore,
          }),
          ...(submission.comprehensionAnswers && {
            comprehensionAnswers: submission.comprehensionAnswers,
          }),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Submission failed');
      }

      const result = await response.json();

      if (result.checkoutUrl) {
        setStripeUrl(result.checkoutUrl);
        window.location.href = result.checkoutUrl;
      } else {
        setSubmitted(true);
      }
    },
    [data, token, encryptForPractice],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[680px] mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-1 w-full rounded-full" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3 max-w-md px-4">
          <FileSignature className="h-12 w-12 text-muted-foreground mx-auto" strokeWidth={1.5} />
          <h1 className="text-xl font-semibold">{t('error')}</h1>
          <p className="text-foreground-secondary">
            {t('notFoundOrExpired')}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <CheckCircle className="h-16 w-16 text-success mx-auto" strokeWidth={1.5} />
          <h1 className="text-xl font-semibold">{t('thankYou')}</h1>
          <p className="text-foreground-secondary">
            {t('successMessage')}
          </p>
        </div>
      </div>
    );
  }

  if (stripeUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-foreground-secondary">
            {t('redirectingToPayment')}
          </p>
        </div>
      </div>
    );
  }

  const brandColor = data.brandColor as string | null;
  const logoUrl = data.logoUrl as string | null;
  const videoUrl = data.videoUrl as string | null;

  return (
    <div
      className="min-h-screen bg-background"
      style={brandColor ? { '--brand-color': brandColor } as React.CSSProperties : undefined}
    >
      {/* Minimal header */}
      <header className="border-b">
        <div className="max-w-[680px] mx-auto px-4 md:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt={data.practice?.name || 'Practice'} className="h-8 w-auto" />
            ) : (
              <FileSignature className="h-5 w-5 text-primary" />
            )}
            <span className="text-sm font-medium">{data.practice?.name || 'DermaConsent'}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Form content */}
      <div className="max-w-[680px] mx-auto px-4 md:px-6 py-8">
        <ConsentForm
          consentType={data.type as ConsentType}
          practiceName={data.practice?.name || 'Praxis'}
          onSubmit={handleSubmit}
          brandColor={brandColor ?? undefined}
          videoUrl={videoUrl ?? undefined}
        />
      </div>

      {/* Security / GDPR footer */}
      <footer className="border-t py-6">
        <div className="max-w-[680px] mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-success" />
              {t('footerEncrypted')}
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-success" />
              {t('footerGdpr')}
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-success" />
              {t('footerEu')}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
