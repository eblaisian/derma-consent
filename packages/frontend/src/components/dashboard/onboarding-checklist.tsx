'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Check, Lock, Image, UserPlus, FileSignature, X } from 'lucide-react';
import Link from 'next/link';

interface OnboardingChecklistProps {
  hasConsents: boolean;
  teamCount: number;
  hasLogo: boolean;
  hasKeypair: boolean;
  onDismiss: () => void;
  onVaultSetup?: () => void;
}

export function OnboardingChecklist({ hasConsents, teamCount, hasLogo, hasKeypair, onDismiss, onVaultSetup }: OnboardingChecklistProps) {
  const t = useTranslations('onboarding');

  const steps = [
    { id: 'vault', icon: Lock, labelKey: 'step_vault' as const, timeKey: 'time_vault' as const, complete: hasKeypair, href: '#', actionKey: 'action_vault' as const, useCallback: true },
    { id: 'logo', icon: Image, labelKey: 'step_logo' as const, timeKey: 'time_logo' as const, complete: hasLogo, href: '/settings', actionKey: 'action_logo' as const, useCallback: false },
    { id: 'team', icon: UserPlus, labelKey: 'step_team' as const, timeKey: 'time_team' as const, complete: teamCount > 1, href: '/team', actionKey: 'action_team' as const, useCallback: false },
    { id: 'consent', icon: FileSignature, labelKey: 'step_consent' as const, timeKey: 'time_consent' as const, complete: hasConsents, href: '/dashboard', actionKey: 'action_consent' as const, useCallback: false },
  ];

  const done = steps.filter((s) => s.complete).length;
  const allComplete = done === steps.length;

  if (allComplete) return null;

  const nextStep = steps.find((s) => !s.complete);

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/[0.06]">
            <FileSignature className="size-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">{t('checklistTitle')}</h3>
            <p className="text-xs text-muted-foreground">{t('stepsComplete', { done, total: steps.length })}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={t('dismiss')}
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-4">
        <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${(done / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps — vertical timeline */}
      <div className="px-5 pb-5">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isNext = step.id === nextStep?.id;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.id} className="flex gap-3">
              {/* Timeline column */}
              <div className="flex flex-col items-center">
                {step.complete ? (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-white">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    isNext ? 'border-primary bg-primary/[0.06]' : 'border-muted bg-background'
                  }`}>
                    <Icon className={`size-3.5 ${isNext ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                )}
                {!isLast && (
                  <div className={`w-0.5 flex-1 my-1 rounded-full ${
                    step.complete ? 'bg-success/40' : 'bg-border'
                  }`} />
                )}
              </div>

              {/* Content column */}
              <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-4'}`}>
                <div className="flex items-center justify-between gap-2 min-h-7">
                  <div className="min-w-0">
                    <p className={`text-sm leading-tight ${
                      step.complete
                        ? 'text-muted-foreground line-through'
                        : isNext ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}>
                      {t(step.labelKey)}
                    </p>
                    {isNext && (
                      <p className="text-xs text-muted-foreground mt-0.5">{t(step.timeKey)}</p>
                    )}
                  </div>
                  {isNext && (
                    step.useCallback && onVaultSetup ? (
                      <Button size="sm" onClick={onVaultSetup} className="shrink-0">
                        {t(step.actionKey)}
                      </Button>
                    ) : (
                      <Button size="sm" asChild className="shrink-0">
                        <Link href={step.href}>{t(step.actionKey)}</Link>
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
