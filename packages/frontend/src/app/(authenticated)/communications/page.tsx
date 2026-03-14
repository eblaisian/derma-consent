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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  if (!features.communications) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">{t('pageTitle')}</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          {t('errorUnavailable')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">{t('pageTitle')}</h1>
        <p className="text-foreground-secondary mt-1">{t('pageSubtitle')}</p>
      </div>
      <MessageComposer />
    </div>
  );
}
