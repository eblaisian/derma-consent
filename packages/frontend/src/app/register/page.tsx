'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { PasswordInput } from '@/components/auth/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Only allow relative paths to prevent open-redirect attacks.
 *  NextAuth rewrites relative callbackUrls to absolute URLs, so we also
 *  accept full URLs and extract just the pathname (which is always relative). */
function getSafeCallbackUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  try {
    const path = new URL(raw).pathname;
    if (path.startsWith('/') && !path.startsWith('//')) return path;
  } catch {
    // Not a valid URL
  }
  return null;
}

export default function RegisterPage() {
  const t = useTranslations('register');
  const tLogin = useTranslations('login');
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'));
  const inviteEmail = searchParams.get('email') || '';
  const isInviteFlow = !!inviteEmail && !!callbackUrl?.startsWith('/invite/');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);

  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ];
  const passed = checks.filter(Boolean).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!checks.every(Boolean)) {
      setError(t('passwordRequirements'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined, password }),
      });

      if (res.status === 409) {
        setError(t('emailExists'));
        return;
      }

      if (!res.ok) {
        setError(t('genericError'));
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        window.location.href = callbackUrl || '/setup';
      } else {
        setError(t('genericError'));
      }
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {isInviteFlow ? t('inviteTitle') : t('title')}
          </h1>
          <p className="text-pretty text-sm text-muted-foreground">
            {isInviteFlow ? t('inviteDescription') : t('description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isInviteFlow && (
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder')}
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              autoComplete="email"
              readOnly={isInviteFlow}
              className={isInviteFlow ? 'opacity-60' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < passed
                          ? passed <= 1 ? 'bg-destructive' : passed <= 2 ? 'bg-yellow-500' : 'bg-green-500'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li className={checks[0] ? 'text-green-600' : ''}>{t('minLength')}</li>
                  <li className={checks[1] ? 'text-green-600' : ''}>{t('lowercase')}</li>
                  <li className={checks[2] ? 'text-green-600' : ''}>{t('uppercase')}</li>
                  <li className={checks[3] ? 'text-green-600' : ''}>{t('number')}</li>
                </ul>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="tos"
              checked={tosAccepted}
              onChange={(e) => setTosAccepted(e.target.checked)}
              className="mt-1 size-4 shrink-0 rounded border-input accent-primary"
            />
            <label htmlFor="tos" className="text-xs text-muted-foreground leading-snug cursor-pointer">
              {t('tosLabel')}{' '}
              <Link href="/datenschutz" className="underline underline-offset-4 hover:text-primary">
                {tLogin('privacyLink')}
              </Link>
            </label>
          </div>
          {error && (
            <p id="register-error" className="text-sm text-destructive" role="alert">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading || !tosAccepted}>
            {loading ? t('submitting') : t('submit')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t('hasAccount')}{' '}
            <Link href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/login'} className="text-primary underline underline-offset-4 hover:text-primary/80">
              {t('signIn')}
            </Link>
          </p>
        </form>

      </div>
    </AuthLayout>
  );
}
