'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TreatmentAreaCard } from './treatment-area-card';
import {
  getAreasForConsentType,
  getCombosForConsentType,
  getAreaDefinition,
  createDefaultSelectedArea,
  type SelectedTreatmentArea,
} from './treatment-area-definitions';
import type { ConsentType } from '@/lib/types';

interface Props {
  consentType: ConsentType;
  selectedAreas: SelectedTreatmentArea[];
  onSelectedAreasChange: (areas: SelectedTreatmentArea[]) => void;
}

export function TreatmentAreasBuilder({ consentType, selectedAreas, onSelectedAreasChange }: Props) {
  const t = useTranslations('treatmentPlan');
  const tCombos = useTranslations('treatmentAreaCombos');

  const areas = getAreasForConsentType(consentType);
  const combos = getCombosForConsentType(consentType);

  const unitLabel = consentType === 'FILLER' ? 'ml' : 'U';
  const totalUnits = selectedAreas.reduce((sum, a) => sum + a.totalUnits, 0);

  const isAreaSelected = useCallback(
    (defId: string) => selectedAreas.some((a) => a.definitionId === defId),
    [selectedAreas],
  );

  const handleToggle = useCallback((defId: string) => {
    if (isAreaSelected(defId)) {
      onSelectedAreasChange(selectedAreas.filter((a) => a.definitionId !== defId));
    } else {
      const def = getAreaDefinition(defId);
      if (!def) return;
      onSelectedAreasChange([...selectedAreas, createDefaultSelectedArea(def)]);
    }
  }, [selectedAreas, onSelectedAreasChange, isAreaSelected]);

  const handleUpdate = useCallback((updated: SelectedTreatmentArea) => {
    onSelectedAreasChange(
      selectedAreas.map((a) => (a.definitionId === updated.definitionId ? updated : a)),
    );
  }, [selectedAreas, onSelectedAreasChange]);

  const handleComboToggle = useCallback((comboId: string) => {
    const combo = combos.find((c) => c.id === comboId);
    if (!combo) return;

    const allSelected = combo.areaIds.every((id) => isAreaSelected(id));
    if (allSelected) {
      // Deselect all combo areas
      onSelectedAreasChange(selectedAreas.filter((a) => !combo.areaIds.includes(a.definitionId)));
    } else {
      // Select missing areas with defaults
      const toAdd = combo.areaIds
        .filter((id) => !isAreaSelected(id))
        .map((id) => {
          const def = getAreaDefinition(id);
          return def ? createDefaultSelectedArea(def) : null;
        })
        .filter((a): a is SelectedTreatmentArea => a !== null);
      onSelectedAreasChange([...selectedAreas, ...toAdd]);
    }
  }, [combos, selectedAreas, onSelectedAreasChange, isAreaSelected]);

  const isComboActive = useCallback((comboId: string) => {
    const combo = combos.find((c) => c.id === comboId);
    if (!combo) return false;
    return combo.areaIds.every((id) => isAreaSelected(id));
  }, [combos, isAreaSelected]);

  return (
    <div className="space-y-3">
      {/* Combo preset chips */}
      {combos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {combos.map((combo) => {
            const active = isComboActive(combo.id);
            const comboTotal = combo.areaIds.reduce((sum, id) => {
              const def = getAreaDefinition(id);
              return sum + (def?.defaultUnits ?? 0);
            }, 0);
            return (
              <button key={combo.id} type="button" onClick={() => handleComboToggle(combo.id)}>
                <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer">
                  {tCombos(combo.nameKey as keyof IntlMessages['treatmentAreaCombos'])}
                  <span className="opacity-70">({comboTotal}{unitLabel})</span>
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {/* Area card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {areas.map((def) => {
          const areaState = selectedAreas.find((a) => a.definitionId === def.id);
          return (
            <TreatmentAreaCard
              key={def.id}
              definition={def}
              selected={!!areaState}
              areaState={areaState}
              onToggle={() => handleToggle(def.id)}
              onUpdate={handleUpdate}
              consentType={consentType}
            />
          );
        })}
      </div>

      {/* Summary bar */}
      <Separator />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {selectedAreas.length > 0
            ? t('areasCount', { count: selectedAreas.length })
            : t('noAreasSelected')}
        </span>
        {selectedAreas.length > 0 && (
          <span className="font-medium">
            {Math.round(totalUnits * 100) / 100}{unitLabel} {t('totalUnits').toLowerCase()}
          </span>
        )}
      </div>
    </div>
  );
}
