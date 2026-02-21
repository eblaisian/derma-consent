'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { usePractice } from '@/hooks/use-practice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/language-switcher';
import { toast } from 'sonner';

interface PracticeSettingsData {
  id: string;
  logoUrl: string | null;
  defaultConsentExpiry: number;
  enabledConsentTypes: string[];
  brandColor: string | null;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tLang = useTranslations('languages');
  const { data: session } = useSession();
  const authFetch = useAuthFetch();
  const { practice, mutate: mutatePractice } = usePractice();

  const { data: settings, mutate: mutateSettings } = useSWR<PracticeSettingsData>(
    session?.accessToken ? `${API_URL}/api/settings` : null,
    createAuthFetcher(session?.accessToken),
  );

  const [practiceName, setPracticeName] = useState('');
  const [dsgvoContact, setDsgvoContact] = useState('');
  const [expiry, setExpiry] = useState(7);
  const [brandColor, setBrandColor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (practice) {
      setPracticeName(practice.name);
      setDsgvoContact(practice.dsgvoContact);
    }
    if (settings) {
      setExpiry(settings.defaultConsentExpiry);
      setBrandColor(settings.brandColor || '');
    }
  }, [practice, settings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await authFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          defaultConsentExpiry: expiry,
          brandColor: brandColor || undefined,
        }),
      });
      mutateSettings();
      toast.success(t('saved'));
    } catch {
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/settings/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      mutateSettings();
      toast.success(t('logoUploaded'));
    } catch {
      toast.error(t('logoUploadError'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tLang('title')}</CardTitle>
          <CardDescription>{tLang('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>{tLang('label')}</Label>
            <LanguageSwitcher />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('practiceInfo')}</CardTitle>
          <CardDescription>{t('practiceInfoDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('practiceName')}</Label>
            <Input value={practiceName} onChange={(e) => setPracticeName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('dsgvoContact')}</Label>
            <Input type="email" value={dsgvoContact} onChange={(e) => setDsgvoContact(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('consentSettings')}</CardTitle>
          <CardDescription>{t('consentSettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('defaultExpiry')}</Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={expiry}
              onChange={(e) => setExpiry(parseInt(e.target.value, 10) || 7)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('brandColor')}</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={brandColor || '#0f172a'}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#0f172a"
              />
            </div>
          </div>

          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? t('saving') : t('save')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('logoTitle')}</CardTitle>
          <CardDescription>{t('logoDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings?.logoUrl && (
            <img
              src={settings.logoUrl}
              alt={t('logoAlt')}
              className="h-16 w-auto object-contain"
            />
          )}
          <div>
            <Label htmlFor="logo-upload">{t('logoUpload')}</Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
