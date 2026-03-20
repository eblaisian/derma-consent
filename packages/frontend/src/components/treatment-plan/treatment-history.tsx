'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useVault } from '@/hooks/use-vault';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VaultLockedPlaceholder } from '@/components/vault/vault-locked-placeholder';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClipboardList, Eye, Trash2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { TreatmentSummary } from './treatment-summary';
import { AftercareDialog } from './aftercare-dialog';
import type { TreatmentPlanSummary } from '@/lib/types';

interface Props {
  plans: TreatmentPlanSummary[];
  onRefresh: () => void;
  patientEmail?: string | null;
}

export function TreatmentHistory({ plans, onRefresh, patientEmail }: Props) {
  const t = useTranslations('treatmentPlan');
  const tTypes = useTranslations('consentTypes');
  const format = useFormatter();
  const authFetch = useAuthFetch();
  const { isUnlocked, requestUnlock } = useVault();
  const [viewingPlan, setViewingPlan] = useState<TreatmentPlanSummary | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deletingPlanId) return;
    setIsDeleting(true);
    try {
      await authFetch(`/api/treatment-plans/${deletingPlanId}`, { method: 'DELETE' });
      toast.success(t('deleted'));
      setDeletingPlanId(null);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSummaryDelete = () => {
    if (!viewingPlan) return;
    setViewingPlan(null);
    setDeletingPlanId(viewingPlan.id);
  };

  return (
    <>
      <div className="space-y-2 stagger-children">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex items-center justify-between border rounded-lg p-3 transition-default hover:bg-muted/30 hover:border-border/80 animate-fade-in-up"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
              <Badge variant="outline">{tTypes(plan.type as keyof IntlMessages['consentTypes'])}</Badge>
              <span className="text-sm text-muted-foreground tabular-nums">
                {format.dateTime(new Date(plan.createdAt), { dateStyle: 'medium' })}
              </span>
              {plan.performedAt && (
                <Badge variant="secondary" className="text-xs">
                  {t('performed')}: {format.dateTime(new Date(plan.performedAt), { dateStyle: 'medium' })}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <AftercareDialog treatmentType={plan.type} patientEmail={patientEmail} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleView(plan)}
                    aria-label={t('viewDetails')}
                  >
                    <Eye className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('viewDetails')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingPlanId(plan.id)}
                    aria-label={t('deletePlan')}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('deletePlan')}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!viewingPlan} onOpenChange={(open) => !open && setViewingPlan(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('planDetails')}</DialogTitle>
          </DialogHeader>
          {viewingPlan && isUnlocked ? (
            <TreatmentSummary
              plan={viewingPlan}
              onDelete={handleSummaryDelete}
            />
          ) : viewingPlan && !isUnlocked ? (
            <VaultLockedPlaceholder size="lg" />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingPlanId}
        onOpenChange={(open) => !open && setDeletingPlanId(null)}
        title={t('deleteConfirmTitle')}
        description={t('deleteConfirmDescription')}
        confirmLabel={isDeleting ? t('deleting') : t('deletePlan')}
        cancelLabel={t('cancel')}
        onConfirm={handleDelete}
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
}
