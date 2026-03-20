'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Check, Lock, Image, UserPlus, FileSignature, ArrowRight } from 'lucide-react';
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
    { id: 'vault', icon: Lock, labelKey: 'step_vault' as const, complete: hasKeypair, href: '#', actionKey: 'action_vault' as const, useCallback: true },
    { id: 'logo', icon: Image, labelKey: 'step_logo' as const, complete: hasLogo, href: '/settings', actionKey: 'action_logo' as const, useCallback: false },
    { id: 'team', icon: UserPlus, labelKey: 'step_team' as const, complete: teamCount > 1, href: '/team', actionKey: 'action_team' as const, useCallback: false },
    { id: 'consent', icon: FileSignature, labelKey: 'step_consent' as const, complete: hasConsents, href: '/dashboard', actionKey: 'action_consent' as const, useCallback: false },
  ];

  const done = steps.filter((s) => s.complete).length;
  const allComplete = done === steps.length;

  if (allComplete) return null;

  // Find first incomplete step to highlight
  const nextStep = steps.find((s) => !s.complete);

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)] p-5">
      {/* Top row: title + progress dots */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">{t('checklistTitle')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('stepsComplete', { done, total: steps.length })}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`size-2 rounded-full transition-colors duration-300 ${
                step.complete ? 'bg-success' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${(done / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps as horizontal cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isNext = step.id === nextStep?.id;

          if (step.complete) {
            return (
              <div
                key={step.id}
                className="flex items-center gap-2.5 rounded-lg border border-success/20 bg-success/[0.04] px-3 py-2.5"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/20">
                  <Check className="size-3 text-success" strokeWidth={3} />
                </div>
                <span className="text-xs text-muted-foreground line-through truncate">
                  {t(step.labelKey)}
                </span>
              </div>
            );
          }

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                isNext
                  ? 'border-primary/30 bg-primary/[0.03]'
                  : 'border-border/50 bg-muted/20'
              }`}
            >
              <div className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                isNext ? 'bg-primary/10' : 'bg-muted/60'
              }`}>
                <Icon className={`size-3 ${isNext ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-xs truncate flex-1 ${isNext ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {t(step.labelKey)}
              </span>
              {isNext && (
                step.useCallback && onVaultSetup ? (
                  <Button size="icon-xs" variant="ghost" onClick={onVaultSetup} className="shrink-0 size-6">
                    <ArrowRight className="size-3" />
                  </Button>
                ) : (
                  <Button size="icon-xs" variant="ghost" asChild className="shrink-0 size-6">
                    <Link href={step.href}>
                      <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
