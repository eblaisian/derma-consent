'use client';

import { useTranslations } from 'next-intl';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { NoShowRisk } from '@/lib/types';

const RISK_STYLES: Record<NoShowRisk, string> = {
  LOW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

interface NoShowRiskBadgeProps {
  risk: NoShowRisk;
}

export function NoShowRiskBadge({ risk }: NoShowRiskBadgeProps) {
  const t = useTranslations('noShowRisk');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${RISK_STYLES[risk]}`}
          role="status"
          aria-label={t(risk)}
        >
          {t(risk)}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs">
        {t(`tooltip${risk}`)}
      </TooltipContent>
    </Tooltip>
  );
}
