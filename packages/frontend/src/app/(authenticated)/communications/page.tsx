'use client';

import { useTranslations } from 'next-intl';
import { useAiStatus } from '@/hooks/use-ai-status';
import { MessageComposer } from '@/components/communications/message-composer';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

export default function CommunicationsPage() {
  const t = useTranslations('communications');
  const { features, isLoading } = useAiStatus();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="surface-raised p-6 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 rounded-md" />
            <Skeleton className="h-10 rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>
    );
  }

  if (!features.communications) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-page-title font-display font-light text-balance">{t('pageTitle')}</h1>
          <p className="text-foreground-secondary mt-1 text-sm text-pretty">{t('pageSubtitle')}</p>
        </div>
        <div className="surface-raised p-8 sm:p-12 flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary-subtle mb-6">
            <Sparkles className="size-7 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-balance">{t('pageTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed text-pretty">
            {t('errorUnavailable')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-display font-light text-balance">{t('pageTitle')}</h1>
        <p className="text-foreground-secondary mt-1 text-sm text-pretty">{t('pageSubtitle')}</p>
      </div>
      <MessageComposer />
    </div>
  );
}
