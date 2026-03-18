'use client';

import { useTranslations } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VaultUnlockBannerProps {
  className?: string;
}

export function VaultUnlockBanner({ className }: VaultUnlockBannerProps) {
  const t = useTranslations('vault');
  const { isUnlocked, requestUnlock } = useVault();

  if (isUnlocked) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.04] to-transparent px-4 py-3',
        className,
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Lock className="size-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{t('unlockBannerTitle')}</p>
        <p className="text-xs text-muted-foreground">{t('unlockBannerDescription')}</p>
      </div>
      <Button size="sm" onClick={() => requestUnlock()}>
        {t('unlockAction')}
      </Button>
    </div>
  );
}
