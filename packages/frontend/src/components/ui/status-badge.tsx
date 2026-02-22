'use client';

import { cn } from '@/lib/utils';

type ConsentStatus = 'PENDING' | 'FILLED' | 'SIGNED' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';

const statusConfig: Record<ConsentStatus, { bg: string; text: string; dot: string }> = {
  PENDING:   { bg: 'bg-warning-subtle',     text: 'text-status-pending',   dot: 'bg-status-pending'   },
  FILLED:    { bg: 'bg-info-subtle',         text: 'text-status-filled',    dot: 'bg-status-filled'    },
  SIGNED:    { bg: 'bg-primary-subtle',      text: 'text-status-signed',    dot: 'bg-status-signed'    },
  PAID:      { bg: 'bg-success-subtle',      text: 'text-status-completed', dot: 'bg-status-completed' },
  COMPLETED: { bg: 'bg-success-subtle',      text: 'text-status-completed', dot: 'bg-status-completed' },
  EXPIRED:   { bg: 'bg-muted',              text: 'text-status-expired',   dot: 'bg-status-expired'   },
  REVOKED:   { bg: 'bg-destructive-subtle',  text: 'text-status-revoked',   dot: 'bg-status-revoked'   },
};

interface StatusBadgeProps {
  status: ConsentStatus;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 h-[22px] px-2 text-xs font-medium rounded-full whitespace-nowrap',
      config.bg, config.text, className
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {label || status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export type { ConsentStatus };
