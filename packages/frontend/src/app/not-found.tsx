import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-muted-foreground">{t('title')}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t('description')}</p>
      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href="/dashboard">{t('dashboard')}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">{t('home')}</Link>
        </Button>
      </div>
    </div>
  );
}
