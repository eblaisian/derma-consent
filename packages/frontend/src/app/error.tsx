'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle className="mt-4">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{t('description')}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={reset}>{t('tryAgain')}</Button>
            <Button variant="outline" asChild>
              <Link href="/">{t('goHome')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
