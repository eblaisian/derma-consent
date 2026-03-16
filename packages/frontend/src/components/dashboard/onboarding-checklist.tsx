'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Lock, Image, UserPlus, FileSignature, X } from 'lucide-react';
import Link from 'next/link';

interface OnboardingChecklistProps {
  hasConsents: boolean;
  teamCount: number;
  hasLogo: boolean;
  hasKeypair: boolean;
  onDismiss: () => void;
}

interface Step {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  complete: boolean;
  href: string;
  actionKey: string;
}

export function OnboardingChecklist({ hasConsents, teamCount, hasLogo, hasKeypair, onDismiss }: OnboardingChecklistProps) {
  const t = useTranslations('onboarding');

  const steps: Step[] = [
    { id: 'vault', icon: Lock, labelKey: 'step_vault', complete: hasKeypair, href: '#', actionKey: 'action_vault' },
    { id: 'logo', icon: Image, labelKey: 'step_logo', complete: hasLogo, href: '/settings', actionKey: 'action_logo' },
    { id: 'team', icon: UserPlus, labelKey: 'step_team', complete: teamCount > 1, href: '/team', actionKey: 'action_team' },
    { id: 'consent', icon: FileSignature, labelKey: 'step_consent', complete: hasConsents, href: '/dashboard', actionKey: 'action_consent' },
  ];

  const done = steps.filter((s) => s.complete).length;
  const allComplete = done === steps.length;
  const progress = (done / steps.length) * 100;

  if (allComplete) return null;

  return (
    <Card className="rounded-xl border border-primary/20 bg-primary/[0.02] shadow-[var(--shadow-sm)]">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="space-y-1.5">
          <CardTitle className="text-lg text-balance">{t('checklistTitle')}</CardTitle>
          <CardDescription className="text-pretty">{t('stepsComplete', { done, total: steps.length })}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onDismiss} aria-label={t('dismiss')} className="shrink-0">
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
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
                </div>
                {!step.complete && (
                  <Button size="sm" asChild>
                    <Link href={step.href}>
                      {t(step.actionKey as keyof IntlMessages['onboarding'])}
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
