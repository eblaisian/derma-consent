'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VaultLockedPlaceholder } from '@/components/vault/vault-locked-placeholder';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClipboardList, Eye } from 'lucide-react';
import { TreatmentSummary } from './treatment-summary';
import type { TreatmentPlanSummary } from '@/lib/types';

interface Props {
  plans: TreatmentPlanSummary[];
}

export function TreatmentHistory({ plans }: Props) {
  const t = useTranslations('treatmentPlan');
  const tTypes = useTranslations('consentTypes');
  const format = useFormatter();
  const { isUnlocked, requestUnlock } = useVault();
  const [viewingPlan, setViewingPlan] = useState<TreatmentPlanSummary | null>(null);

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={t('noPlans')}
        description={t('noPlansDescription')}
        className="py-12"
      />
    );
  }

  const handleView = (plan: TreatmentPlanSummary) => {
    if (isUnlocked) {
      setViewingPlan(plan);
    } else {
      requestUnlock(() => setViewingPlan(plan));
    }
  };

  return (
    <>
      <div className="space-y-2">
        {plans.map((plan) => (
          <div key={plan.id} className="flex items-center justify-between border rounded-md p-3 hover:bg-muted/30 transition-colors">
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
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleView(plan)}
              aria-label={t('viewDetails')}
            >
              <Eye className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!viewingPlan} onOpenChange={(open) => !open && setViewingPlan(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('planDetails')}</DialogTitle>
          </DialogHeader>
          {viewingPlan && isUnlocked ? (
            <TreatmentSummary plan={viewingPlan} />
          ) : viewingPlan && !isUnlocked ? (
            <VaultLockedPlaceholder size="lg" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
