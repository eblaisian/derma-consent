'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { useAuthFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

  // Redirect if already has practice
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

      // Refresh session to pick up the new practiceId
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('practiceName')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('practiceNamePlaceholder')}
                required
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('masterPassword')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('masterPasswordPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">
                {t('confirmPassword')}
              </Label>
              <Input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                required
              />
            </div>

            <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              <strong>{t('important')}</strong> {t('passwordWarning')}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
