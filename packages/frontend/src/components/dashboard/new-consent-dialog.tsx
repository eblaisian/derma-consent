'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthFetch } from '@/lib/auth-fetch';
import type { ConsentType } from '@/components/consent-form/form-fields';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const consentTypes: ConsentType[] = ['BOTOX', 'FILLER', 'LASER', 'CHEMICAL_PEEL', 'MICRONEEDLING', 'PRP'];

interface NewConsentDialogProps {
  onCreated: () => void;
}

export function NewConsentDialog({ onCreated }: NewConsentDialogProps) {
  const t = useTranslations('newConsent');
  const tTypes = useTranslations('consentTypes');
  const authFetch = useAuthFetch();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ConsentType | ''>('');
  const [patientEmail, setPatientEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [consentLink, setConsentLink] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!type) return;

    setIsCreating(true);
    try {
      const data = await authFetch('/api/consent', {
        method: 'POST',
        body: JSON.stringify({
          type,
          ...(patientEmail.trim() && { patientEmail: patientEmail.trim() }),
        }),
      });

      const link = `${window.location.origin}/consent/${data.token}`;
      setConsentLink(link);
      onCreated();
      toast.success(t('created'));
    } catch {
      toast.error(t('createError'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!consentLink) return;
    await navigator.clipboard.writeText(consentLink);
    toast.success(t('created'));
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setType('');
      setPatientEmail('');
      setConsentLink(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>{t('button')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {consentLink ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('consentLink')}</Label>
              <div className="flex gap-2">
                <Input value={consentLink} readOnly />
                <Button variant="outline" onClick={handleCopy}>
                  {t('copy')}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('linkInfo')}
            </p>
            <Button variant="outline" className="w-full" onClick={() => handleClose(false)}>
              {t('close')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('treatmentType')}</Label>
              <Select value={type} onValueChange={(v) => setType(v as ConsentType)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTreatment')} />
                </SelectTrigger>
                <SelectContent>
                  {consentTypes.map((key) => (
                    <SelectItem key={key} value={key}>
                      {tTypes(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('patientEmail')}</Label>
              <Input
                type="email"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder={t('patientEmailPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('patientEmailInfo')}
              </p>
            </div>

            <Button className="w-full" onClick={handleCreate} disabled={!type || isCreating}>
              {isCreating ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('creating')}
                </span>
              ) : (
                t('create')
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
