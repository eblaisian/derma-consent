'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Lock, Image, UserPlus, FileSignature, X } from 'lucide-react';
import Link from 'next/link';

interface OnboardingChecklistProps {
  hasConsents: boolean;
  teamCount: number;
  hasLogo: boolean;
  hasKeypair: boolean;
  onDismiss: () => void;
  onVaultSetup?: () => void;
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const size = 72;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = done / total;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border/60"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-lg font-semibold tabular-nums">{done}/{total}</span>
      </div>
    </div>
  );
}

const STEP_ICONS = { vault: Lock, logo: Image, team: UserPlus, consent: FileSignature } as const;

export function OnboardingChecklist({ hasConsents, teamCount, hasLogo, hasKeypair, onDismiss, onVaultSetup }: OnboardingChecklistProps) {
  const t = useTranslations('onboarding');

  const steps = [
    { id: 'vault' as const, labelKey: 'step_vault' as const, timeKey: 'time_vault' as const, complete: hasKeypair, href: '#', actionKey: 'action_vault' as const, useCallback: true },
    { id: 'logo' as const, labelKey: 'step_logo' as const, timeKey: 'time_logo' as const, complete: hasLogo, href: '/settings', actionKey: 'action_logo' as const, useCallback: false },
    { id: 'team' as const, labelKey: 'step_team' as const, timeKey: 'time_team' as const, complete: teamCount > 1, href: '/team', actionKey: 'action_team' as const, useCallback: false },
    { id: 'consent' as const, labelKey: 'step_consent' as const, timeKey: 'time_consent' as const, complete: hasConsents, href: '/dashboard', actionKey: 'action_consent' as const, useCallback: false },
  ];

  const done = steps.filter((s) => s.complete).length;
  const allComplete = done === steps.length;

  if (allComplete) return null;

  const nextStep = steps.find((s) => !s.complete)!;
  const NextIcon = STEP_ICONS[nextStep.id];
  const remaining = steps.length - done;

  const cta = nextStep.useCallback && onVaultSetup ? (
    <Button size="sm" onClick={onVaultSetup}>
      {t(nextStep.actionKey)}
    </Button>
  ) : (
    <Button size="sm" asChild>
      <Link href={nextStep.href}>{t(nextStep.actionKey)}</Link>
    </Button>
  );

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)] max-w-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pr-3">
        <p className="text-xs font-medium text-muted-foreground">
          {remaining === 1 ? t('almostDone') : t('stepsRemaining', { count: remaining })}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
          aria-label={t('dismiss')}
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-6 px-6 pb-6 pt-3">
        <ProgressRing done={done} total={steps.length} />

        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <NextIcon className="size-4 text-primary shrink-0" strokeWidth={1.5} />
              <p className="text-[15px] font-medium text-foreground">{t(nextStep.labelKey)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-6">{t(nextStep.timeKey)}</p>
          </div>
          {cta}
        </div>
      </div>
    </div>
  );
}
