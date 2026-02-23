'use client';

import { useTranslations } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VaultLockedPlaceholderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-32 text-xs gap-1.5',
  md: 'h-40 text-sm gap-2',
  lg: 'py-8 text-sm gap-2',
};

const iconSizes = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function VaultLockedPlaceholder({
  size = 'md',
  className,
}: VaultLockedPlaceholderProps) {
  const t = useTranslations('vault');
  const { requestUnlock } = useVault();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={requestUnlock}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          requestUnlock();
        }
      }}
      className={cn(
        'flex w-full flex-col items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-default hover:bg-muted hover:text-foreground cursor-pointer',
        sizeStyles[size],
        className,
      )}
    >
      <Lock className={iconSizes[size]} />
      <span>{t('clickToUnlock')}</span>
    </div>
  );
}
