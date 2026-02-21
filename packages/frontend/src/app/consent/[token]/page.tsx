'use client';

import { use, useCallback, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { ConsentForm } from '@/components/consent-form/consent-form';
import { useVault } from '@/hooks/use-vault';
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
    async (submission: { formData: Record<string, unknown>; signatureData: string }) => {
      if (!data?.practice?.publicKey) {
        throw new Error('Practice public key not available');
      }

      // Client-side encryption before sending to server
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
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Submission failed');
      }

      const result = await response.json();

      // If there's a Stripe checkout URL, redirect
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">{t('error')}</h1>
          <p className="text-muted-foreground">
            {t('notFoundOrExpired')}
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-4xl">✓</div>
          <h1 className="text-xl font-semibold">{t('thankYou')}</h1>
          <p className="text-muted-foreground">
            {t('successMessage')}
          </p>
        </div>
      </div>
    );
  }

  if (stripeUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">
            {t('redirectingToPayment')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConsentForm
      consentType={data.type as ConsentType}
      practiceName={data.practice?.name || 'Praxis'}
      onSubmit={handleSubmit}
    />
  );
}
