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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LanguageSwitcher } from '@/components/language-switcher';
import { TwoFactorSetup } from '@/components/settings/two-factor-setup';
import { toast } from 'sonner';

interface PracticeSettingsData {
  id: string;
  logoUrl: string | null;
  defaultConsentExpiry: number;
  enabledConsentTypes: string[];
  brandColor: string | null;
  educationVideos: Record<string, string> | null;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tLang = useTranslations('languages');
  const tTypes = useTranslations('consentTypes');
  const t2FA = useTranslations('twoFactor');
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
  const [enabledTypes, setEnabledTypes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPractice, setIsSavingPractice] = useState(false);
  const [isSavingTypes, setIsSavingTypes] = useState(false);
  const [educationVideos, setEducationVideos] = useState<Record<string, string>>({});
  const [isSavingVideos, setIsSavingVideos] = useState(false);

  // Track original values for dirty-state detection
  const [originalPractice, setOriginalPractice] = useState({ name: '', dsgvoContact: '' });
  const [originalConsent, setOriginalConsent] = useState({ expiry: 7, brandColor: '' });
  const [originalTypes, setOriginalTypes] = useState<string[]>([]);
  const [originalVideos, setOriginalVideos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (practice) {
      setPracticeName(practice.name);
      setDsgvoContact(practice.dsgvoContact);
      setOriginalPractice({ name: practice.name, dsgvoContact: practice.dsgvoContact });
    }
    if (settings) {
      setExpiry(settings.defaultConsentExpiry);
      setBrandColor(settings.brandColor || '');
      setEnabledTypes(settings.enabledConsentTypes || []);
      setEducationVideos(settings.educationVideos || {});
      setOriginalConsent({ expiry: settings.defaultConsentExpiry, brandColor: settings.brandColor || '' });
      setOriginalTypes(settings.enabledConsentTypes || []);
      setOriginalVideos(settings.educationVideos || {});
    }
  }, [practice, settings]);

  const isPracticeDirty = practiceName !== originalPractice.name || dsgvoContact !== originalPractice.dsgvoContact;
  const isConsentDirty = expiry !== originalConsent.expiry || brandColor !== originalConsent.brandColor;
  const isTypesDirty = JSON.stringify([...enabledTypes].sort()) !== JSON.stringify([...originalTypes].sort());
  const isVideosDirty = JSON.stringify(educationVideos) !== JSON.stringify(originalVideos);

  const handleSavePractice = async () => {
    setIsSavingPractice(true);
    try {
      await authFetch('/api/practice', {
        method: 'PATCH',
        body: JSON.stringify({
          name: practiceName || undefined,
          dsgvoContact: dsgvoContact || undefined,
        }),
      });
      mutatePractice();
      toast.success(t('practiceInfoSaved'));
    } catch {
      toast.error(t('saveError'));
    } finally {
      setIsSavingPractice(false);
    }
  };

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

  const handleSaveConsentTypes = async () => {
    setIsSavingTypes(true);
    try {
      await authFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ enabledConsentTypes: enabledTypes }),
      });
      mutateSettings();
      toast.success(t('saved'));
    } catch {
      toast.error(t('saveError'));
    } finally {
      setIsSavingTypes(false);
    }
  };

  const handleSaveVideos = async () => {
    setIsSavingVideos(true);
    try {
      const filtered = Object.fromEntries(
        Object.entries(educationVideos).filter(([, url]) => url.trim()),
      );
      await authFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ educationVideos: filtered }),
      });
      mutateSettings();
      toast.success(t('saved'));
    } catch {
      toast.error(t('saveError'));
    } finally {
      setIsSavingVideos(false);
    }
  };

  const toggleConsentType = (type: string) => {
    setEnabledTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
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
        <h1 className="text-page-title">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {t('description')}
        </p>
      </div>

      <Tabs defaultValue="general" orientation="horizontal" className="w-full">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b">
          <TabsTrigger value="general">{t('practiceInfo')}</TabsTrigger>
          <TabsTrigger value="consent">{t('consentSettings')}</TabsTrigger>
          <TabsTrigger value="education">{t('educationVideos')}</TabsTrigger>
          <TabsTrigger value="security">{t2FA('title')}</TabsTrigger>
          <TabsTrigger value="language">{tLang('title')}</TabsTrigger>
        </TabsList>

        {/* General — Practice info + logo */}
        <TabsContent value="general" className="pt-6 space-y-6 animate-fade-in-up">
          <div className="surface-raised p-6 space-y-4">
            <div>
              <h3 className="text-section-head">{t('practiceInfo')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('practiceInfoDescription')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('practiceName')}</Label>
              <Input value={practiceName} onChange={(e) => setPracticeName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('dsgvoContact')}</Label>
              <Input type="email" value={dsgvoContact} onChange={(e) => setDsgvoContact(e.target.value)} />
            </div>
            <Button onClick={handleSavePractice} disabled={isSavingPractice || !isPracticeDirty}>
              {isSavingPractice ? t('saving') : t('savePracticeInfo')}
            </Button>
          </div>

          <div className="surface-raised p-6 space-y-4">
            <div>
              <h3 className="text-section-head">{t('logoTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('logoDescription')}</p>
            </div>
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
          </div>
        </TabsContent>

        {/* Consent — Expiry, brand color, consent types */}
        <TabsContent value="consent" className="pt-6 space-y-6 animate-fade-in-up">
          <div className="surface-raised p-6 space-y-4">
            <div>
              <h3 className="text-section-head">{t('consentSettings')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('consentSettingsDescription')}</p>
            </div>
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
            <Button onClick={handleSaveSettings} disabled={isSaving || !isConsentDirty}>
              {isSaving ? t('saving') : t('save')}
            </Button>
          </div>

          <div className="surface-raised p-6 space-y-4">
            <div>
              <h3 className="text-section-head">{t('consentTypes')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('consentTypesDescription')}</p>
            </div>
            <div className="space-y-2">
              {['BOTOX', 'FILLER', 'LASER', 'CHEMICAL_PEEL', 'MICRONEEDLING', 'PRP'].map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledTypes.includes(type)}
                    onChange={() => toggleConsentType(type)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">{tTypes(type as Parameters<typeof tTypes>[0])}</span>
                </label>
              ))}
            </div>
            <Button onClick={handleSaveConsentTypes} disabled={isSavingTypes || !isTypesDirty}>
              {isSavingTypes ? t('saving') : t('saveConsentTypes')}
            </Button>
          </div>
        </TabsContent>

        {/* Education Videos */}
        <TabsContent value="education" className="pt-6 animate-fade-in-up">
          <div className="surface-raised p-6 space-y-4">
            <div>
              <h3 className="text-section-head">{t('educationVideos')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('educationVideosDescription')}</p>
            </div>
            {['BOTOX', 'FILLER', 'LASER', 'CHEMICAL_PEEL', 'MICRONEEDLING', 'PRP'].map((type) => (
              <div key={type} className="space-y-1">
                <Label>{tTypes(type as Parameters<typeof tTypes>[0])}</Label>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={educationVideos[type] || ''}
                  onChange={(e) =>
                    setEducationVideos((prev) => ({ ...prev, [type]: e.target.value }))
                  }
                />
              </div>
            ))}
            <Button onClick={handleSaveVideos} disabled={isSavingVideos || !isVideosDirty}>
              {isSavingVideos ? t('saving') : t('save')}
            </Button>
          </div>
        </TabsContent>

        {/* Security — 2FA */}
        <TabsContent value="security" className="pt-6 animate-fade-in-up">
          <TwoFactorSetup />
        </TabsContent>

        {/* Language */}
        <TabsContent value="language" className="pt-6 animate-fade-in-up">
          <div className="surface-raised p-6 space-y-4">
            <div>
              <h3 className="text-section-head">{tLang('title')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{tLang('description')}</p>
            </div>
            <div className="space-y-2">
              <Label>{tLang('label')}</Label>
              <LanguageSwitcher />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
