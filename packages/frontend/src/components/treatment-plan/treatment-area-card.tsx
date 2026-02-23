'use client';

import { useTranslations } from 'next-intl';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PRODUCTS, TECHNIQUES } from './injection-point-edit-fields';
import type { TreatmentAreaDefinition, SelectedTreatmentArea } from './treatment-area-definitions';
import type { ConsentType } from '@/lib/types';

interface Props {
  definition: TreatmentAreaDefinition;
  selected: boolean;
  areaState?: SelectedTreatmentArea;
  onToggle: () => void;
  onUpdate: (area: SelectedTreatmentArea) => void;
  consentType: ConsentType;
}

export function TreatmentAreaCard({
  definition, selected, areaState, onToggle, onUpdate, consentType,
}: Props) {
  const t = useTranslations('treatmentPlan');
  const tAreas = useTranslations('treatmentAreas');
  const tTech = useTranslations('techniques');

  const unitLabel = consentType === 'FILLER' ? 'ml' : 'U';
  const displayUnits = areaState?.totalUnits ?? definition.defaultUnits;

  return (
    <div
      className={`rounded-lg border p-3 transition-colors cursor-pointer ${
        selected
          ? 'border-s-4 border-s-primary bg-primary/5 border-border'
          : 'border-border hover:border-muted-foreground/30'
      }`}
      onClick={(e) => {
        // Don't toggle when clicking on inputs/selects inside expanded section
        if ((e.target as HTMLElement).closest('[data-area-fields]')) return;
        onToggle();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selected && (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
              <Check className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
          )}
          <span className="text-sm font-medium">{tAreas(definition.nameKey as keyof IntlMessages['treatmentAreas'])}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{definition.siteCount} sites</span>
          <span>&middot;</span>
          <span>{displayUnits}{unitLabel}</span>
          {selected && (
            <ChevronUp className="h-3 w-3 ms-1" />
          )}
          {!selected && (
            <ChevronDown className="h-3 w-3 ms-1" />
          )}
        </div>
      </div>

      {/* Subtitle when selected but not expanded details */}
      {selected && areaState && (
        <p className="text-xs text-muted-foreground mt-1 ms-6">
          {areaState.product} &middot; {tTech(areaState.technique as keyof IntlMessages['techniques'])}
        </p>
      )}

      {/* Expanded fields */}
      {selected && areaState && (
        <div data-area-fields className="mt-3 ms-6 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
          <div>
            <Label className="text-xs">{t('product')}</Label>
            <Select value={areaState.product} onValueChange={(v) => onUpdate({ ...areaState, product: v })}>
              <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t('technique')}</Label>
            <Select value={areaState.technique} onValueChange={(v) => onUpdate({ ...areaState, technique: v })}>
              <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TECHNIQUES.map((tech) => (
                  <SelectItem key={tech} value={tech}>{tTech(tech as keyof IntlMessages['techniques'])}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t('units')}</Label>
            <Input
              type="number"
              className="h-7 text-xs"
              value={areaState.totalUnits}
              onChange={(e) => onUpdate({ ...areaState, totalUnits: Number(e.target.value) })}
              step={consentType === 'FILLER' ? 0.1 : 1}
              min={0}
            />
          </div>
          <div>
            <Label className="text-xs">{t('batchNumber')}</Label>
            <Input
              className="h-7 text-xs"
              value={areaState.batchNumber}
              onChange={(e) => onUpdate({ ...areaState, batchNumber: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
