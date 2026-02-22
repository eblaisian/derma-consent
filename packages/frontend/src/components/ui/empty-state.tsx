import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-20 px-4 animate-fade-in-up surface-inset',
      className
    )}>
      <Icon className="h-12 w-12 text-muted-foreground mb-5" strokeWidth={1.25} />
      <h3 className="text-section-head">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-foreground-secondary text-center max-w-[360px] leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
