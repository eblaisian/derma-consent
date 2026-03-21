'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Lock, FileSignature } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConsent: () => void;
}

const STEP_ICONS = [Shield, Lock, FileSignature] as const;

export function WelcomeModal({ open, onOpenChange, onCreateConsent }: WelcomeModalProps) {
  const t = useTranslations('onboarding');
  const [step, setStep] = useState(0);

  const steps = [
    { titleKey: 'welcomeTitle', descriptionKey: 'welcomeDescription', Icon: STEP_ICONS[0] },
    { titleKey: 'vaultTitle', descriptionKey: 'vaultDescription', Icon: STEP_ICONS[1] },
    { titleKey: 'firstConsentTitle', descriptionKey: 'firstConsentDescription', Icon: STEP_ICONS[2] },
  ] as const;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  const handleClose = () => {
    setStep(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="px-8 pt-10 pb-8 text-center animate-fade-in-up" key={step}>
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/[0.08]">
            <current.Icon className="size-7 text-primary" strokeWidth={1.5} />
          </div>
          <DialogTitle className="font-display text-xl font-semibold tracking-tight text-balance">
            {t(current.titleKey)}
          </DialogTitle>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed text-pretty max-w-sm mx-auto">
            {t(current.descriptionKey)}
          </p>
        </div>

        <div className="border-t border-border/50 px-8 py-5 space-y-4">
          <div className="flex items-center justify-between">
            {isFirst ? (
              <div />
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                {t('back')}
              </Button>
            )}

            {isLast ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  {t('skipWelcome')}
                </Button>
                <Button size="sm" onClick={() => { handleClose(); onCreateConsent(); }}>
                  {t('createFirst')}
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                {t('next')}
              </Button>
            )}
          </div>

          <div className="flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
