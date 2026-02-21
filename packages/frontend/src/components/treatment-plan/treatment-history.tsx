'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TreatmentSummary } from './treatment-summary';
import type { TreatmentPlanSummary } from '@/lib/types';

interface Props {
  plans: TreatmentPlanSummary[];
}

export function TreatmentHistory({ plans }: Props) {
  const t = useTranslations('treatmentPlan');
  const tTypes = useTranslations('consentTypes');
  const format = useFormatter();
  const { isUnlocked } = useVault();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (plans.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        {t('noPlans')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {plans.map((plan) => {
        const isExpanded = expandedId === plan.id;
        return (
          <div key={plan.id} className="border rounded-md">
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : plan.id)}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline">{tTypes(plan.type as keyof IntlMessages['consentTypes'])}</Badge>
                <span className="text-sm text-muted-foreground">
                  {format.dateTime(new Date(plan.createdAt), { dateStyle: 'medium' })}
                </span>
                {plan.performedAt && (
                  <span className="text-xs text-muted-foreground">
                    ({t('performed')}: {format.dateTime(new Date(plan.performedAt), { dateStyle: 'short' })})
                  </span>
                )}
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isExpanded && isUnlocked && (
              <div className="border-t p-3">
                <TreatmentSummary plan={plan} />
              </div>
            )}
            {isExpanded && !isUnlocked && (
              <div className="border-t p-3 text-sm text-muted-foreground text-center">
                {t('vaultLocked')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
