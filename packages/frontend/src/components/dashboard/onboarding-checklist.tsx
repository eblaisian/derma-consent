'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Lock, Image, UserPlus, FileSignature, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface OnboardingChecklistProps {
  hasConsents: boolean;
  teamCount: number;
  hasLogo: boolean;
  hasKeypair: boolean;
  onDismiss: () => void;
  onVaultSetup?: () => void;
}

interface Step {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  timeKey: string;
  complete: boolean;
  href: string;
  actionKey: string;
}

export function OnboardingChecklist({ hasConsents, teamCount, hasLogo, hasKeypair, onDismiss, onVaultSetup }: OnboardingChecklistProps) {
  const t = useTranslations('onboarding');
  const [open, setOpen] = useState(true);

  const steps: Step[] = [
    { id: 'vault', icon: Lock, labelKey: 'step_vault', timeKey: 'time_vault', complete: hasKeypair, href: '#', actionKey: 'action_vault' },
    { id: 'logo', icon: Image, labelKey: 'step_logo', timeKey: 'time_logo', complete: hasLogo, href: '/settings', actionKey: 'action_logo' },
    { id: 'team', icon: UserPlus, labelKey: 'step_team', timeKey: 'time_team', complete: teamCount > 1, href: '/team', actionKey: 'action_team' },
    { id: 'consent', icon: FileSignature, labelKey: 'step_consent', timeKey: 'time_consent', complete: hasConsents, href: '/dashboard', actionKey: 'action_consent' },
  ];

  const done = steps.filter((s) => s.complete).length;
  const allComplete = done === steps.length;
  const progress = (done / steps.length) * 100;

  if (allComplete) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.02] shadow-[var(--shadow-sm)]">
      {/* Header — always visible, acts as toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left cursor-pointer group"
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{t('checklistTitle')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t('stepsComplete', { done, total: steps.length })}</p>
        </div>
        <div className="h-1.5 w-20 rounded-full bg-muted/60 overflow-hidden shrink-0">
          <div
            className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ChevronUp
          className={`size-4 text-muted-foreground shrink-0 motion-safe:transition-transform motion-safe:duration-200 ${
            open ? '' : 'rotate-180'
          }`}
        />
      </button>

      {/* Collapsible content — single animated container */}
      <div
        className="grid motion-safe:transition-[grid-template-rows] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 space-y-3">
            {/* Progress bar */}
            <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-1.5">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 motion-safe:transition-opacity motion-safe:duration-200 ${
                      step.complete ? 'opacity-50' : 'bg-muted/30'
                    }`}
                  >
                    {step.complete ? (
                      <CheckCircle2 className="size-5 shrink-0 text-success" />
                    ) : (
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/[0.06]">
                        <Icon className="size-3 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${step.complete ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                        {t(step.labelKey as keyof IntlMessages['onboarding'])}
                      </span>
                      {!step.complete && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {t(step.timeKey as keyof IntlMessages['onboarding'])}
                        </span>
                      )}
                    </div>
                    {!step.complete && (
                      step.id === 'vault' && onVaultSetup ? (
                        <Button size="sm" onClick={onVaultSetup}>
                          {t(step.actionKey as keyof IntlMessages['onboarding'])}
                        </Button>
                      ) : (
                        <Button size="sm" asChild>
                          <Link href={step.href}>
                            {t(step.actionKey as keyof IntlMessages['onboarding'])}
                          </Link>
                        </Button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
