'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useVault } from '@/hooks/use-vault';
import { usePractice } from '@/hooks/use-practice';
import { useAuthFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';

interface Props {
  onCreated: () => void;
}

export function CreatePatientDialog({ onCreated }: Props) {
  const t = useTranslations('patients');
  const { isUnlocked, encryptForPractice } = useVault();
  const { practice } = usePractice();
  const authFetch = useAuthFetch();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !practice?.publicKey) return;
    if (!isUnlocked) {
      toast.error(t('vaultRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Encrypt each field separately
      const encryptedNamePayload = await encryptForPractice(
        name.trim(),
        practice.publicKey as JsonWebKey,
      );
      const encryptedName = JSON.stringify(encryptedNamePayload);

      let encryptedDob: string | undefined;
      if (dob) {
        const encDobPayload = await encryptForPractice(dob, practice.publicKey as JsonWebKey);
        encryptedDob = JSON.stringify(encDobPayload);
      }

      let encryptedEmail: string | undefined;
      if (email.trim()) {
        const encEmailPayload = await encryptForPractice(email.trim(), practice.publicKey as JsonWebKey);
        encryptedEmail = JSON.stringify(encEmailPayload);
      }

      // Generate lookup hash (SHA-256 of normalized name + dob)
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        encoder.encode(`${name.trim().toLowerCase()}:${dob}`),
      );
      const lookupHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      await authFetch('/api/patients', {
        method: 'POST',
        body: JSON.stringify({
          encryptedName,
          encryptedDob,
          encryptedEmail,
          lookupHash,
        }),
      });

      toast.success(t('created'));
      setOpen(false);
      setName('');
      setDob('');
      setEmail('');
      onCreated();
    } catch {
      toast.error(t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('newPatient')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('newPatientTitle')}</DialogTitle>
          <DialogDescription>{t('newPatientDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('name')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('dateOfBirth')}</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('email')}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
            />
          </div>
          {!isUnlocked && (
            <p className="text-sm text-destructive">{t('vaultRequired')}</p>
          )}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!name.trim() || !isUnlocked || isSubmitting}
          >
            {isSubmitting ? t('creating') : t('create')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
