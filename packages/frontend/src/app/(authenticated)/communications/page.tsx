'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAiStatus } from '@/hooks/use-ai-status';
import { PremiumFeatureGate } from '@/components/premium-feature-gate';
import { MessageComposer } from '@/components/communications/message-composer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, MessageSquare, Languages, Send, ArrowUpRight } from 'lucide-react';

function CommunicationsUpsell() {
  const t = useTranslations('communications');
  const tp = useTranslations('premiumGate');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-display font-light text-balance">{t('pageTitle')}</h1>
        <p className="text-foreground-secondary mt-1 text-sm text-pretty">{t('pageSubtitle')}</p>
      </div>

      <div className="surface-raised rounded-xl overflow-hidden">
        {/* Blurred mock preview */}
        <div className="relative">
          <div className="p-6 space-y-5 select-none pointer-events-none" aria-hidden="true">
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted/60" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-10 rounded-md bg-muted/80" />
              <div className="h-10 rounded-md bg-muted/80" />
            </div>
            <div className="h-24 rounded-md bg-muted/60" />
            <div className="h-10 w-36 rounded-md bg-muted/80" />
          </div>
          <div className="absolute inset-0 backdrop-blur-[6px] bg-card/60 dark:bg-card/70" />
        </div>

        {/* Upgrade CTA */}
        <div className="py-8 px-6 text-center border-t">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
            <Sparkles className="size-7 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-balance">{tp('communicationsTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed text-pretty">
            {tp('communicationsDescription')}
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-4">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="size-4" /> {tp('communicationsFeature1')}
            </span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Languages className="size-4" /> {tp('communicationsFeature2')}
            </span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Send className="size-4" /> {tp('communicationsFeature3')}
            </span>
          </div>
          <Button className="mt-6" asChild>
            <Link href="/billing">
              {tp('upgradeCta')} <ArrowUpRight className="size-4 ml-1" />
            </Link>
          </Button>
          <div className="mt-3">
            <Link href="/billing" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              {tp('learnMore')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunicationsPage() {
  const t = useTranslations('communications');
  const { isLoading } = useAiStatus();

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

  return (
    <PremiumFeatureGate feature="communications" fallback={<CommunicationsUpsell />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-page-title font-display font-light text-balance">{t('pageTitle')}</h1>
          <p className="text-foreground-secondary mt-1 text-sm text-pretty">{t('pageSubtitle')}</p>
        </div>
        <MessageComposer />
      </div>
    </PremiumFeatureGate>
  );
}
