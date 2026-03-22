'use client';

import { use, useCallback, useState } from 'react';
import useSWR from 'swr';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
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
  children,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  variant?: 'success' | 'error' | 'neutral';
  children?: React.ReactNode;
}) {
  const ringColor = {
    success: 'ring-success/20 bg-success-subtle',
    error: 'ring-destructive/20 bg-destructive-subtle',
    neutral: 'ring-border bg-muted',
  }[variant];

  return (
    <div className="flex items-center justify-center min-h-dvh bg-muted/30">
      <motion.div
        className="text-center space-y-6 max-w-sm px-6"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="mx-auto rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-sm)] p-10">
          <motion.div
            className={`mx-auto flex size-20 items-center justify-center rounded-full ring-1 ${ringColor}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 15 }}
          >
            {icon}
          </motion.div>
          <motion.div
            className="space-y-2 mt-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{message}</p>
          </motion.div>
          {children}
        </div>
      </motion.div>
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
  const locale = useLocale();
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

      const encrypted = await encryptFormData(
        {
          ...submission.formData,
          signatureData: submission.signatureData,
        },
        publicKey,
      );

      const patientFields: Record<string, string> = {};
      const { fullName, dateOfBirth, email } = submission.patientIdentity;
      if (fullName.trim()) {
        const hashInput = fullName.trim().toLowerCase() + ':' + dateOfBirth;
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput));
        const lookupHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

        const encName = await encryptFormData(fullName.trim(), publicKey);
        patientFields.patientLookupHash = lookupHash;
        patientFields.encryptedPatientName = JSON.stringify(encName);

        if (dateOfBirth) {
          const encDob = await encryptFormData(dateOfBirth, publicKey);
          patientFields.encryptedPatientDob = JSON.stringify(encDob);
        }
        if (email.trim()) {
          const encEmail = await encryptFormData(email.trim(), publicKey);
          patientFields.encryptedPatientEmail = JSON.stringify(encEmail);
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
          locale,
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
            <Skeleton className="h-12 w-full rounded-lg animate-pulse" />
            <Skeleton className="h-12 w-full rounded-lg animate-pulse [animation-delay:100ms]" />
            <Skeleton className="h-12 w-full rounded-lg animate-pulse [animation-delay:200ms]" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl animate-pulse [animation-delay:300ms]" />
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
      >
        {data?.logoUrl && (
          <motion.img
            src={data.logoUrl as string}
            alt={data?.practice?.name || 'Practice'}
            className="h-10 w-auto mx-auto mt-6 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          />
        )}
        <motion.div
          className="mt-6 rounded-lg bg-muted/50 border border-border/30 p-4 text-left space-y-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <p className="text-sm font-medium">{t('successNext')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('successNextDetail')}</p>
          <p className="text-xs text-muted-foreground">{t('successClose')}</p>
        </motion.div>
      </StatusPage>
    );
  }

  if (stripeUrl) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-subtle"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
          </motion.div>
          <p className="text-sm text-muted-foreground">{t('redirectingToPayment')}</p>
        </motion.div>
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
      className="min-h-dvh bg-muted flex flex-col"
      style={brandColor ? {
        '--brand-color': brandColor,
        '--primary': brandColor,
        '--ring': brandColor,
        '--primary-hover': brandColor,
        '--primary-active': brandColor,
        '--primary-subtle': `${brandColor}18`,
      } as React.CSSProperties : undefined}
    >
      {/* Branded header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
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
          <LanguageSwitcher compact />
        </div>
      </header>

      {/* Form content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 md:px-6 py-8">
        <motion.div
          className="rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-md)] px-6 py-8 md:px-10 md:py-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <ConsentForm
            consentType={data.type as ConsentType}
            practiceName={data.practice?.name || 'Praxis'}
            token={token}
            onSubmit={handleSubmit}
            videoUrl={videoUrl ?? undefined}
          />
        </motion.div>
      </main>

      {/* Security trust bar */}
      <footer className="border-t border-border/50 bg-background/60 backdrop-blur-sm py-5">
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
