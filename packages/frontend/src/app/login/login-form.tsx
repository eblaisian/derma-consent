'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  enabledProviders: {
    google: boolean;
    'microsoft-entra-id': boolean;
    apple: boolean;
    credentials: boolean;
  };
}

export function LoginForm({ enabledProviders }: Props) {
  const t = useTranslations('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const anyOAuthEnabled = enabledProviders.google || enabledProviders['microsoft-entra-id'] || enabledProviders.apple;
  const anyEnabled = anyOAuthEnabled || enabledProviders.credentials;

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(t('invalidCredentials'));
      } else if (result?.ok) {
        window.location.href = '/dashboard';
      }
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!anyEnabled && (
            <Alert variant="destructive">
              <AlertTitle>{t('setupRequired')}</AlertTitle>
              <AlertDescription>
                {t('setupDescription')}
              </AlertDescription>
            </Alert>
          )}

          {enabledProviders.credentials && (
            <form onSubmit={handleCredentialsLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('signingIn') : t('signIn')}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t('noAccount')}{' '}
                <Link href="/register" className="text-primary underline underline-offset-4 hover:text-primary/80">
                  {t('createAccount')}
                </Link>
              </p>
            </form>
          )}

          {enabledProviders.credentials && anyOAuthEnabled && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('orContinueWith')}
                </span>
              </div>
            </div>
          )}

          {enabledProviders.google ? (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              <GoogleIcon />
              {t('signInWithGoogle')}
            </Button>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              <GoogleIcon />
              <span className="text-muted-foreground">
                {t('googleNotConfigured')}
              </span>
            </Button>
          )}

          {enabledProviders['microsoft-entra-id'] ? (
            <Button
              className="w-full"
              variant="outline"
              onClick={() =>
                signIn('microsoft-entra-id', { callbackUrl: '/dashboard' })
              }
            >
              <MicrosoftIcon />
              {t('signInWithMicrosoft')}
            </Button>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              <MicrosoftIcon />
              <span className="text-muted-foreground">
                {t('microsoftNotConfigured')}
              </span>
            </Button>
          )}

          {enabledProviders.apple ? (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => signIn('apple', { callbackUrl: '/dashboard' })}
            >
              <AppleIcon />
              {t('signInWithApple')}
            </Button>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              <AppleIcon />
              <span className="text-muted-foreground">
                {t('appleNotConfigured')}
              </span>
            </Button>
          )}

          <p className="pt-4 text-center text-xs text-muted-foreground">
            {t('privacyNotice')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
