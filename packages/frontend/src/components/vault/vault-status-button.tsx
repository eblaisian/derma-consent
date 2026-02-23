'use client';

import { useTranslations } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { Button } from '@/components/ui/button';
import { Lock, Shield } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

export function VaultStatusButton() {
  const t = useTranslations('vault');
  const tSidebar = useTranslations('sidebar');
  const { isUnlocked, autoLockRemaining, requestUnlock, lock } = useVault();

  const handleLock = () => {
    lock();
    toast.info(t('locked'));
  };

  if (!isUnlocked) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={requestUnlock}
        title={t('lockedTitle')}
        className="relative"
      >
        <Lock className="h-4 w-4" />
        <span className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-warning" />
        <span className="sr-only">{t('lockedTitle')}</span>
      </Button>
    );
  }

  const minutes = autoLockRemaining != null ? Math.ceil(autoLockRemaining / 60) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={t('unlockedTitle')}
          className="relative"
        >
          <Shield className="h-4 w-4" />
          <span className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-success" />
          <span className="sr-only">{t('unlockedTitle')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-success shrink-0" />
            <span className="text-sm font-medium">{t('unlockedTitle')}</span>
          </div>
          {minutes != null && (
            <p className="text-xs text-muted-foreground">
              {tSidebar('autoLockIn', { minutes })}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLock}
          >
            <Lock className="mr-2 h-3.5 w-3.5" />
            {t('lock')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
