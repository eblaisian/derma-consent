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
import { Upload } from 'lucide-react';
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
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [practicePhone, setPracticePhone] = useState('');
  const [practiceEmail, setPracticeEmail] = useState('');
  const [practiceWebsite, setPracticeWebsite] = useState('');
  const [expiry, setExpiry] = useState(7);
  const [brandColor, setBrandColor] = useState('');
  const [enabledTypes, setEnabledTypes] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPractice, setIsSavingPractice] = useState(false);
  const [isSavingTypes, setIsSavingTypes] = useState(false);
  const [educationVideos, setEducationVideos] = useState<Record<string, string>>({});
  const [isSavingVideos, setIsSavingVideos] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Track original values for dirty-state detection
  const [originalPractice, setOriginalPractice] = useState({
    name: '', dsgvoContact: '', street: '', houseNumber: '', postalCode: '',
    city: '', state: '', phone: '', email: '', website: '',
  });
  const [originalConsent, setOriginalConsent] = useState({ expiry: 7, brandColor: '' });
  const [originalTypes, setOriginalTypes] = useState<string[]>([]);
  const [originalVideos, setOriginalVideos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (practice) {
      setPracticeName(practice.name);
      setDsgvoContact(practice.dsgvoContact);
      setStreet(practice.street || '');
      setHouseNumber(practice.houseNumber || '');
      setPostalCode(practice.postalCode || '');
      setCity(practice.city || '');
      setState(practice.state || '');
      setPracticePhone(practice.phone || '');
      setPracticeEmail(practice.practiceEmail || '');
      setPracticeWebsite(practice.website || '');
      setOriginalPractice({
        name: practice.name, dsgvoContact: practice.dsgvoContact,
        street: practice.street || '', houseNumber: practice.houseNumber || '',
        postalCode: practice.postalCode || '', city: practice.city || '',
        state: practice.state || '', phone: practice.phone || '',
        email: practice.practiceEmail || '', website: practice.website || '',
      });
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

  const isPracticeDirty =
    practiceName !== originalPractice.name || dsgvoContact !== originalPractice.dsgvoContact ||
    street !== originalPractice.street || houseNumber !== originalPractice.houseNumber ||
    postalCode !== originalPractice.postalCode || city !== originalPractice.city ||
    state !== originalPractice.state || practicePhone !== originalPractice.phone ||
    practiceEmail !== originalPractice.email || practiceWebsite !== originalPractice.website;
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
          street: street || undefined,
          houseNumber: houseNumber || undefined,
          postalCode: postalCode || undefined,
          city: city || undefined,
          state: state || undefined,
          phone: practicePhone || undefined,
          practiceEmail: practiceEmail || undefined,
          website: practiceWebsite || undefined,
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

  const handleLogoFile = async (file: File) => {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-page-title font-display font-light text-balance">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed text-pretty">
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

            {/* Practice Address */}
            <div className="pt-4 border-t border-border/50 mt-2">
              <h4 className="text-sm font-medium mb-3">{t('address')}</h4>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t('street')}</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Kurfürstendamm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('houseNumber')}</Label>
                  <Input value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} placeholder="42" />
                </div>
              </div>
              <div className="grid grid-cols-[120px_1fr_1fr] gap-3 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t('postalCode')}</Label>
                  <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="10719" maxLength={5} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('city')}</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Berlin" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('state')}</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Berlin" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t('phone')}</Label>
                  <Input value={practicePhone} onChange={(e) => setPracticePhone(e.target.value)} placeholder="+49 30 1234567" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('practiceEmail')}</Label>
                  <Input type="email" value={practiceEmail} onChange={(e) => setPracticeEmail(e.target.value)} placeholder="info@praxis.de" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('website')}</Label>
                  <Input value={practiceWebsite} onChange={(e) => setPracticeWebsite(e.target.value)} placeholder="https://praxis.de" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSavePractice} disabled={isSavingPractice || !isPracticeDirty}>
                {isSavingPractice ? t('saving') : t('savePracticeInfo')}
              </Button>
              {!isPracticeDirty && !isSavingPractice && (
                <p className="text-xs text-muted-foreground">{t('noChanges')}</p>
              )}
            </div>
          </div>

          <div className="surface-raised p-6 space-y-4">
            <div>
              <h3 className="text-section-head">{t('logoTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t('logoDescription')}</p>
            </div>
            <label
              htmlFor="logo-upload"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleLogoFile(file);
              }}
            >
              {settings?.logoUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={settings.logoUrl} alt={t('logoAlt')} className="h-16 w-auto object-contain" />
                  <span className="text-xs text-muted-foreground">{t('logoReplace')}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="size-8" />
                  <span className="text-sm">{t('logoDragHint')}</span>
                  <span className="text-xs">{t('logoFormatHint')}</span>
                </div>
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleLogoFile(file); }}
                className="sr-only"
              />
            </label>
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
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={brandColor || '#0f172a'}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="size-9 cursor-pointer rounded-lg border border-border/50 p-0.5"
                  />
                </div>
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#0f172a"
                  className="font-mono text-sm"
                />
                {brandColor && (
                  <div
                    className="size-6 shrink-0 rounded-md border border-border/50"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSaveSettings} disabled={isSaving || !isConsentDirty}>
                {isSaving ? t('saving') : t('save')}
              </Button>
              {!isConsentDirty && !isSaving && (
                <p className="text-xs text-muted-foreground">{t('noChanges')}</p>
              )}
            </div>
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
                    className="size-4 rounded border-input"
                  />
                  <span className="text-sm">{tTypes(type as Parameters<typeof tTypes>[0])}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSaveConsentTypes} disabled={isSavingTypes || !isTypesDirty}>
                {isSavingTypes ? t('saving') : t('saveConsentTypes')}
              </Button>
              {!isTypesDirty && !isSavingTypes && (
                <p className="text-xs text-muted-foreground">{t('noChanges')}</p>
              )}
            </div>
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
              <div key={type} className="space-y-2">
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
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSaveVideos} disabled={isSavingVideos || !isVideosDirty}>
                {isSavingVideos ? t('saving') : t('save')}
              </Button>
              {!isVideosDirty && !isSavingVideos && (
                <p className="text-xs text-muted-foreground">{t('noChanges')}</p>
              )}
            </div>
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
