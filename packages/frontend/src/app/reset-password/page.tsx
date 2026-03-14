'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/auth-layout';
import { PasswordInput } from '@/components/auth/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function ResetPasswordForm() {
  const t = useTranslations('resetPassword');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        setError(t('invalidToken'));
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('genericError'));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-destructive">{t('invalidToken')}</p>
        <Button variant="outline" asChild>
          <Link href="/forgot-password">{t('requestNew')}</Link>
        </Button>
      </div>
    );
  }

  return success ? (
    <div className="text-center space-y-4">
      <p className="text-sm text-muted-foreground">{t('success')}</p>
      <Button asChild>
        <Link href="/login">{t('backToLogin')}</Link>
      </Button>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{t('newPassword')}</Label>
        <PasswordInput
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          required
          minLength={8}
          autoComplete="new-password"
        />
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
      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t('resetting') : t('submit')}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations('resetPassword');

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthLayout>
  );
}
