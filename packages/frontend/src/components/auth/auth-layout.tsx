'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck, Lock, FileCheck, Languages } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const t = useTranslations('login');
  const tLanding = useTranslations('landing');

  return (
    <div className="relative flex min-h-dvh">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-md xl:w-lg shrink-0 flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-7" strokeWidth={1.75} />
            <span className="text-xl font-semibold tracking-tight">DermaConsent</span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-balance text-2xl font-semibold leading-snug tracking-tight">
            {t('brandTagline')}
          </h2>
          <div className="space-y-4">
            <TrustItem icon={Lock} text={t('trustEncryption')} />
            <TrustItem icon={FileCheck} text={t('trustCompliance')} />
            <TrustItem icon={Languages} text={t('trustLanguages')} />
          </div>
        </div>

        <p className="text-pretty text-sm text-primary-foreground/60">
          {tLanding('copyright')}
        </p>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        {/* Language switcher — top-right corner */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        {/* Mobile logo — shown only on small screens */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <ShieldCheck className="size-6 text-primary" strokeWidth={1.75} />
          <span className="text-lg font-semibold tracking-tight">DermaConsent</span>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

function TrustItem({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
        <Icon className="size-4" />
      </div>
      <span className="text-sm text-primary-foreground/80">{text}</span>
    </div>
  );
}
