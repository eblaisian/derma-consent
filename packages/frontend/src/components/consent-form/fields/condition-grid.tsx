'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Heart,
  Droplets,
  Shield,
  Baby,
  Pill,
  Scissors,
  Sparkles,
  CircleSlash,
  Check,
} from 'lucide-react';

interface ConditionGridProps {
  name: string;
  conditionKeys: string[];
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}

const CONDITION_ICONS: Record<string, typeof Heart> = {
  hypertension: Heart,
  heartDisease: Heart,
  diabetes: Droplets,
  thyroid: Droplets,
  eczema: Sparkles,
  psoriasis: Sparkles,
  rosacea: Sparkles,
  keloidScarring: Sparkles,
  coldSores: Sparkles,
  lupus: Shield,
  rheumatoidArthritis: Shield,
  immunosuppression: Shield,
  pregnant: Baby,
  breastfeeding: Baby,
  cancer: Pill,
  chemotherapy: Pill,
  organTransplant: Pill,
  pacemaker: Heart,
  bloodClotting: Scissors,
  noneOfAbove: CircleSlash,
};

/**
 * Condition card grid for medical history.
 * Replaces free-text textarea with tappable condition cards.
 * "None of the above" clears all selections.
 * Optional free-text escape hatch for unlisted conditions.
 *
 * Brand color theming is handled via CSS variable override at the consent form container level.
 */
export function ConditionGrid({
  name,
  conditionKeys,
  required,
  value,
  onChange,
}: ConditionGridProps) {
  const t = useTranslations('medicalOptions');
  const tFields = useTranslations('medicalFields');

  const [selected, setSelected] = useState<Set<string>>(() => {
    if (!value || value === 'none') return value === 'none' ? new Set(['noneOfAbove']) : new Set();
    return new Set(value.split(',').filter((v) => v && !v.startsWith('notes:')));
  });
  const [notes, setNotes] = useState(() => {
    if (!value) return '';
    const notesPart = value.split(',').find((p) => p.startsWith('notes:'));
    return notesPart ? notesPart.slice(6) : '';
  });

  useEffect(() => {
    if (selected.has('noneOfAbove')) {
      onChange('none');
    } else {
      const parts = Array.from(selected);
      if (notes.trim()) parts.push(`notes:${notes.trim()}`);
      onChange(parts.length > 0 ? parts.join(',') : required ? '' : 'none');
    }
  }, [selected, notes, onChange, required]);

  const toggleCondition = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (key === 'noneOfAbove') {
        if (next.has('noneOfAbove')) {
          next.delete('noneOfAbove');
        } else {
          next.clear();
          next.add('noneOfAbove');
        }
      } else {
        next.delete('noneOfAbove');
        if (next.has(key)) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  };

  const resolveLabel = (key: string): string => {
    return t.has(key as keyof IntlMessages['medicalOptions'])
      ? t(key as keyof IntlMessages['medicalOptions'])
      : key;
  };

  const isNone = selected.has('noneOfAbove');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {conditionKeys.map((key) => {
          const Icon = CONDITION_ICONS[key] || Sparkles;
          const isActive = selected.has(key);
          const isNoneCard = key === 'noneOfAbove';

          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleCondition(key)}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition-all active:scale-[0.97] ${
                isNoneCard && isActive
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : isActive
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/50'
              }`}
            >
              {isActive && (
                <div className="absolute top-1.5 right-1.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-xs font-medium leading-tight">{resolveLabel(key)}</span>
            </button>
          );
        })}
      </div>

      {/* Optional notes field (only when conditions are selected) */}
      {!isNone && selected.size > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={tFields('conditionNotes' as keyof IntlMessages['medicalFields'])}
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground/60"
          />
        </div>
      )}

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
