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
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <Icon className="h-16 w-16 text-muted-foreground mb-4" strokeWidth={1.5} />
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-foreground-secondary text-center max-w-[360px]">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
