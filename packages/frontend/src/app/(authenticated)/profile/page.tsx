'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useFormatter } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PasswordInput } from '@/components/auth/password-input';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

interface ProfileData {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const format = useFormatter();
  const { data: session } = useSession();
  const authFetch = useAuthFetch();

  const { data: profile, mutate } = useSWR<ProfileData>(
    session?.accessToken ? `${API_URL}/api/auth/account/profile` : null,
    createAuthFetcher(session?.accessToken),
  );

  const [name, setName] = useState('');
  const [nameInitialized, setNameInitialized] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  // Initialize name from profile data
  if (profile && !nameInitialized) {
    setName(profile.name || '');
    setNameInitialized(true);
  }

  const isNameDirty = nameInitialized && name !== (profile?.name || '');

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      await authFetch('/api/auth/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      mutate();
      toast.success(t('nameSaved'));
    } catch {
      toast.error(t('saveError'));
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }
    setIsChangingPassword(true);
    try {
      await authFetch('/api/auth/account/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('passwordChanged'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await authFetch('/api/auth/account/export', { method: 'GET' });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dermaconsent-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('saveError'));
    } finally {
      setIsExporting(false);
    }
  };

  const roleBadgeKey = `roleBadge_${profile?.role}` as
    | 'roleBadge_ADMIN'
    | 'roleBadge_ARZT'
    | 'roleBadge_EMPFANG';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {t('description')}
        </p>
      </div>

      {/* Profile Information */}
      <div className="surface-raised p-6 space-y-4">
        <h3 className="text-section-head">{t('title')}</h3>

        <div className="space-y-2">
          <Label htmlFor="profile-name">{t('nameLabel')}</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('emailLabel')}</Label>
          <Input value={profile?.email || ''} disabled />
        </div>

        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label>{t('roleLabel')}</Label>
            <div>
              {profile?.role && (
                <Badge variant="secondary">{t(roleBadgeKey)}</Badge>
              )}
            </div>
          </div>
        </div>

        {profile?.createdAt && (
          <p className="text-sm text-muted-foreground">
            {t('memberSince')}{' '}
            {format.dateTime(new Date(profile.createdAt), { dateStyle: 'medium' })}
          </p>
        )}

        <div>
          <Button onClick={handleSaveName} disabled={isSavingName || !isNameDirty}>
            {isSavingName ? t('saving') : t('saveName')}
          </Button>
        </div>
      </div>

      {/* Change Password */}
      <div className="surface-raised p-6 space-y-4">
        <h3 className="text-section-head">{t('changePasswordTitle')}</h3>

        <div className="space-y-2">
          <Label htmlFor="current-password">{t('currentPassword')}</Label>
          <PasswordInput
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">{t('newPassword')}</Label>
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div>
          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {isChangingPassword ? t('changingPassword') : t('changePasswordBtn')}
          </Button>
        </div>
      </div>

      {/* GDPR Data Export */}
      <div className="surface-raised p-6 space-y-4">
        <h3 className="text-section-head">{t('exportTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('exportDescription')}</p>
        <div>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download className="size-4 mr-2" />
            {isExporting ? t('exporting') : t('exportBtn')}
          </Button>
        </div>
      </div>
    </div>
  );
}
