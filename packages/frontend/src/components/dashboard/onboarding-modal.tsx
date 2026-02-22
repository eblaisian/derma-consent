'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreateConsent: () => void;
}

export function OnboardingModal({ open, onClose, onCreateConsent }: Props) {
  const t = useTranslations('onboarding');
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: t('welcomeTitle'),
      description: t('welcomeDescription'),
    },
    {
      title: t('vaultTitle'),
      description: t('vaultDescription'),
    },
    {
      title: t('firstConsentTitle'),
      description: t('firstConsentDescription'),
    },
  ];

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{steps[step].title}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">{steps[step].description}</p>
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-muted-foreground">
            {step + 1} / {steps.length}
          </span>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                {t('back')}
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>{t('next')}</Button>
            ) : (
              <Button
                onClick={() => {
                  handleClose();
                  onCreateConsent();
                }}
              >
                {t('createFirst')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
