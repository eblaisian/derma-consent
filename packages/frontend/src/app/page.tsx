'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const t = useTranslations('landing');

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t('title')}</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/login">{t('login')}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">{t('toDashboard')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
