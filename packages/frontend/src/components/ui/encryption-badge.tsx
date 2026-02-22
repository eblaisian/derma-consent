import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EncryptionBadge({ className }: { className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-medium text-success bg-success-subtle px-1.5 py-0.5 rounded-full',
      className
    )}>
      <Shield className="h-3 w-3" />
      Encrypted
    </span>
  );
}
