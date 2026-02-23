'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function VerifyEmailContent() {
  const t = useTranslations('verifyEmail');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setStatus(res.ok ? 'success' : 'error');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="text-center space-y-4">
      {status === 'loading' && (
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      )}
      {status === 'success' && (
        <>
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <p className="text-sm text-muted-foreground">{t('success')}</p>
          <Button asChild>
            <Link href="/login">{t('backToLogin')}</Link>
          </Button>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-sm text-destructive">{t('error')}</p>
          <Button variant="outline" asChild>
            <Link href="/login">{t('backToLogin')}</Link>
          </Button>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  const t = useTranslations('verifyEmail');

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.02]" aria-hidden="true" />

      <Card className="relative w-full max-w-md shadow-[var(--shadow-lg)] animate-scale-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl tracking-tight">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />}>
            <VerifyEmailContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
