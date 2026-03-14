'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { useAuthFetch } from '@/lib/auth-fetch';
import { AuthLayout } from '@/components/auth/auth-layout';
import { PasswordInput } from '@/components/auth/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SetupPage() {
  const t = useTranslations('setup');
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { generatePracticeKeys, isLoading: vaultLoading } = useVault();
  const authFetch = useAuthFetch();

  const [name, setName] = useState('');
  const [dsgvoContact, setDsgvoContact] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPractice = !!session?.user?.practiceId;
  useEffect(() => {
    if (hasPractice) {
      router.push('/dashboard');
    }
  }, [hasPractice, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !dsgvoContact.trim() || !password) {
      setError(t('requiredFields'));
      return;
    }

    if (password !== passwordConfirm) {
      setError(t('passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { publicKeyJwk, encryptedPrivateKey } =
        await generatePracticeKeys(password);

      const practice = await authFetch('/api/practice', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          dsgvoContact: dsgvoContact.trim(),
          publicKey: publicKeyJwk,
          encryptedPrivKey: encryptedPrivateKey,
        }),
      });

      await updateSession({ practiceId: practice.id });
      toast.success(t('success'));
      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('genericError'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = isSubmitting || vaultLoading;

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('practiceName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('practiceNamePlaceholder')}
              required
              autoComplete="organization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dsgvoContact">{t('dsgvoContact')}</Label>
            <Input
              id="dsgvoContact"
              type="email"
              value={dsgvoContact}
              onChange={(e) => setDsgvoContact(e.target.value)}
              placeholder={t('dsgvoContactPlaceholder')}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('masterPassword')}</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('masterPasswordPlaceholder')}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">{t('confirmPassword')}</Label>
            <PasswordInput
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm text-warning-foreground">
            <strong>{t('important')}</strong> {t('passwordWarning')}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('generatingKeys')}
              </span>
            ) : (
              t('submit')
            )}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
