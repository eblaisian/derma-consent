'use client';

import { use, useCallback, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { ConsentForm } from '@/components/consent-form/consent-form';
import type { PatientIdentity } from '@/components/consent-form/consent-form';
import { LanguageSwitcher } from '@/components/language-switcher';
import { importPublicKey, encryptFormData } from '@/lib/crypto';
import { Shield, CheckCircle, FileSignature, XCircle, Clock, Lock, Server } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ConsentType } from '@/components/consent-form/form-fields';

type ConsentStatus = 'PENDING' | 'FILLED' | 'SIGNED' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Consent form not found or expired');
  return res.json();
});

function StatusPage({
  icon,
  title,
  message,
  variant = 'neutral',
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  variant?: 'success' | 'error' | 'neutral';
}) {
  const ringColor = {
    success: 'ring-success/20 bg-success-subtle',
    error: 'ring-destructive/20 bg-destructive-subtle',
    neutral: 'ring-border bg-muted',
  }[variant];

  return (
    <div className="flex items-center justify-center min-h-dvh bg-background">
      <div className="text-center space-y-6 max-w-sm px-6">
        <div className={`mx-auto flex size-20 items-center justify-center rounded-full ring-1 ${ringColor}`}>
          {icon}
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function ConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const t = useTranslations('consent');
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
      patientIdentity: PatientIdentity;
      comprehensionScore?: number;
      comprehensionAnswers?: Array<{ questionId: string; selectedIndex: number; correct: boolean }>;
    }) => {
      if (!data?.practice?.publicKey) {
        throw new Error('Practice public key not available');
      }

      const publicKey = await importPublicKey(data.practice.publicKey);

      // Encrypt form data (medical questionnaire + signature)
      const encrypted = await encryptFormData(
        {
          ...submission.formData,
          signatureData: submission.signatureData,
        },
        publicKey,
      );

      // Compute patient lookup hash and encrypt identity fields
      const patientFields: Record<string, string> = {};
      const { fullName, dateOfBirth, email } = submission.patientIdentity;
      if (fullName.trim()) {
        const hashInput = fullName.trim().toLowerCase() + '|' + dateOfBirth;
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput));
        const lookupHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

        const encName = await encryptFormData({ value: fullName.trim() }, publicKey);
        patientFields.patientLookupHash = lookupHash;
        patientFields.encryptedPatientName = JSON.stringify({ iv: encName.iv, ciphertext: encName.ciphertext, encryptedSessionKey: encName.encryptedSessionKey });

        if (dateOfBirth) {
          const encDob = await encryptFormData({ value: dateOfBirth }, publicKey);
          patientFields.encryptedPatientDob = JSON.stringify({ iv: encDob.iv, ciphertext: encDob.ciphertext, encryptedSessionKey: encDob.encryptedSessionKey });
        }
        if (email.trim()) {
          const encEmail = await encryptFormData({ value: email.trim() }, publicKey);
          patientFields.encryptedPatientEmail = JSON.stringify({ iv: encEmail.iv, ciphertext: encEmail.ciphertext, encryptedSessionKey: encEmail.encryptedSessionKey });
        }
      }

      const response = await fetch(`${API_URL}/api/consent/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedResponses: {
            iv: encrypted.iv,
            ciphertext: encrypted.ciphertext,
          },
          encryptedSessionKey: encrypted.encryptedSessionKey,
          ...(submission.comprehensionScore !== undefined && {
            comprehensionScore: submission.comprehensionScore,
          }),
          ...(submission.comprehensionAnswers && {
            comprehensionAnswers: submission.comprehensionAnswers,
          }),
          ...patientFields,
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
    [data, token],
  );

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-background">
        <header className="border-b border-border-subtle">
          <div className="mx-auto max-w-2xl px-4 md:px-6 flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-4 md:px-6 py-10 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-1 w-full rounded-full" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <StatusPage
        icon={<FileSignature className="size-8 text-muted-foreground" strokeWidth={1.5} />}
        title={t('error')}
        message={t('notFoundOrExpired')}
        variant="neutral"
      />
    );
  }

  if (submitted) {
    return (
      <StatusPage
        icon={<CheckCircle className="size-8 text-success" strokeWidth={1.5} />}
        title={t('thankYou')}
        message={t('successMessage')}
        variant="success"
      />
    );
  }

  if (stripeUrl) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background">
        <div className="text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-subtle">
            <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground">{t('redirectingToPayment')}</p>
        </div>
      </div>
    );
  }

  const consentStatus = data?.status as ConsentStatus;

  if (consentStatus === 'REVOKED') {
    return (
      <StatusPage
        icon={<XCircle className="size-8 text-destructive" strokeWidth={1.5} />}
        title={t('revokedTitle')}
        message={t('revokedMessage')}
        variant="error"
      />
    );
  }

  if (consentStatus === 'EXPIRED' || (data?.expiresAt && new Date(data.expiresAt) < new Date())) {
    return (
      <StatusPage
        icon={<Clock className="size-8 text-muted-foreground" strokeWidth={1.5} />}
        title={t('expiredTitle')}
        message={t('expiredMessage')}
        variant="neutral"
      />
    );
  }

  if (consentStatus === 'SIGNED' || consentStatus === 'PAID' || consentStatus === 'COMPLETED') {
    return (
      <StatusPage
        icon={<CheckCircle className="size-8 text-success" strokeWidth={1.5} />}
        title={t('thankYou')}
        message={t('alreadyCompletedMessage')}
        variant="success"
      />
    );
  }

  const brandColor = data.brandColor as string | null;
  const logoUrl = data.logoUrl as string | null;
  const videoUrl = data.videoUrl as string | null;

  return (
    <div
      className="min-h-dvh bg-background flex flex-col"
      style={brandColor ? { '--brand-color': brandColor } as React.CSSProperties : undefined}
    >
      {/* Branded header */}
      <header className="border-b border-border-subtle bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-4 md:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={data.practice?.name || 'Practice'}
                className="h-9 w-auto rounded-lg"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <FileSignature className="size-4.5 text-primary" />
              </div>
            )}
            <span className="text-sm font-semibold tracking-tight">
              {data.practice?.name || 'DermaConsent'}
            </span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Form content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 md:px-6 py-10">
        <ConsentForm
          consentType={data.type as ConsentType}
          practiceName={data.practice?.name || 'Praxis'}
          token={token}
          onSubmit={handleSubmit}
          brandColor={brandColor ?? undefined}
          videoUrl={videoUrl ?? undefined}
        />
      </main>

      {/* Security trust bar */}
      <footer className="border-t border-border-subtle bg-card/30 py-5">
        <div className="mx-auto max-w-2xl px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5 text-success" />
              {t('footerEncrypted')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="size-3.5 text-success" />
              {t('footerGdpr')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Server className="size-3.5 text-success" />
              {t('footerEu')}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
