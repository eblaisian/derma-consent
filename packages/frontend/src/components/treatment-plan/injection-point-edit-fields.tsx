'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { InjectionPoint } from '@/lib/types';

export const PRODUCTS = ['Botox', 'Dysport', 'Xeomin', 'Juvederm Ultra', 'Juvederm Voluma', 'Restylane', 'Belotero'];
export const TECHNIQUES = ['bolus', 'linear_threading', 'fan', 'cross_hatching', 'serial_puncture', 'blanching', 'micro_droplet'];

interface Props {
  point: InjectionPoint;
  onUpdate: (point: InjectionPoint) => void;
  onRemove: () => void;
  onDone: () => void;
}

export function InjectionPointEditFields({ point, onUpdate, onRemove, onDone }: Props) {
  const t = useTranslations('treatmentPlan');
  const tTech = useTranslations('techniques');

  return (
    <div className="space-y-2 text-xs">
      <div>
        <Label className="text-xs">{t('product')}</Label>
        <Select value={point.product} onValueChange={(v) => onUpdate({ ...point, product: v })}>
          <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">{t('units')}</Label>
        <Input
          type="number"
          className="h-7 text-xs"
          value={point.units}
          onChange={(e) => onUpdate({ ...point, units: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label className="text-xs">{t('technique')}</Label>
        <Select value={point.technique} onValueChange={(v) => onUpdate({ ...point, technique: v })}>
          <SelectTrigger className="h-7 text-xs w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TECHNIQUES.map((tech) => (
              <SelectItem key={tech} value={tech}>{tTech(tech as keyof IntlMessages['techniques'])}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">{t('batchNumber')}</Label>
        <Input
          className="h-7 text-xs"
          value={point.batchNumber}
          onChange={(e) => onUpdate({ ...point, batchNumber: e.target.value })}
        />
      </div>
      <div className="flex justify-between">
        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onDone}>
          {t('done')}
        </Button>
        <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
