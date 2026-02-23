'use client';

import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { pointsToSelectedAreas, getAreaDefinition } from './treatment-area-definitions';
import type { InjectionPoint } from '@/lib/types';

interface Props {
  points: InjectionPoint[];
}

export function TreatmentAreasSummary({ points }: Props) {
  const t = useTranslations('treatmentPlan');
  const tAreas = useTranslations('treatmentAreas');
  const tTech = useTranslations('techniques');

  const areas = pointsToSelectedAreas(points);
  const totalUnits = areas.reduce((sum, a) => sum + a.totalUnits, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {areas.map((area) => {
          const def = getAreaDefinition(area.definitionId);
          const label = def
            ? tAreas(def.nameKey as keyof IntlMessages['treatmentAreas'])
            : area.definitionId;

          return (
            <div key={area.definitionId} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {area.siteCount} sites &middot; {area.totalUnits}{def?.consentType === 'FILLER' ? 'ml' : 'U'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {area.product} &middot; {tTech(area.technique as keyof IntlMessages['techniques'])}
                {area.batchNumber ? ` \u00b7 ${t('batchNumber')}: ${area.batchNumber}` : ''}
              </p>
            </div>
          );
        })}
      </div>
      <Separator />
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{t('totalUnits')}</span>
        <span>{Math.round(totalUnits * 100) / 100}</span>
      </div>
    </div>
  );
}
