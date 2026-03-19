'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';

interface YesNoChipsProps {
  name: string;
  chipKeys: string[];
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Yes/No gate + chip selection field.
 * - "None" path: one tap, stores "none"
 * - "Yes" path: reveals chip grid, stores comma-separated selected keys
 * - Optional free-text "Other" input for edge cases
 *
 * Brand color theming is handled via CSS variable override at the consent form container level.
 */
export function YesNoChips({
  name,
  chipKeys,
  required,
  value,
  onChange,
}: YesNoChipsProps) {
  const t = useTranslations('medicalOptions');
  const tFields = useTranslations('medicalFields');

  const [gate, setGate] = useState<'none' | 'yes' | null>(() => {
    if (!value) return null;
    if (value === 'none') return 'none';
    return 'yes';
  });
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (!value || value === 'none') return new Set();
    return new Set(value.split(',').filter((v) => v && v !== 'other'));
  });
  const [otherText, setOtherText] = useState(() => {
    if (!value) return '';
    const parts = value.split(',');
    const otherPart = parts.find((p) => p.startsWith('other:'));
    return otherPart ? otherPart.slice(6) : '';
  });
  const [showOther, setShowOther] = useState(() => {
    return value?.includes('other:') ?? false;
  });

  // Sync to form value
  useEffect(() => {
    if (gate === 'none') {
      onChange('none');
    } else if (gate === 'yes') {
      const parts = Array.from(selected);
      if (showOther && otherText.trim()) {
        parts.push(`other:${otherText.trim()}`);
      }
      onChange(parts.length > 0 ? parts.join(',') : required ? '' : 'none');
    }
  }, [gate, selected, showOther, otherText, onChange, required]);

  const handleGate = (choice: 'none' | 'yes') => {
    setGate(choice);
    if (choice === 'none') {
      setSelected(new Set());
      setOtherText('');
      setShowOther(false);
    }
  };

  const toggleChip = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const resolveLabel = (key: string): string => {
    return t.has(key as keyof IntlMessages['medicalOptions'])
      ? t(key as keyof IntlMessages['medicalOptions'])
      : key;
  };

  return (
    <div className="space-y-3">
      {/* Gate cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleGate('none')}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all ${
            gate === 'none'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-400'
              : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
          }`}
        >
          {gate === 'none' && <Check className="h-4 w-4" />}
          {tFields('noneKnown' as keyof IntlMessages['medicalFields'])}
        </button>
        <button
          type="button"
          onClick={() => handleGate('yes')}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all ${
            gate === 'yes'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
          }`}
        >
          {gate === 'yes' && <Check className="h-4 w-4" />}
          {tFields('yesIHave' as keyof IntlMessages['medicalFields'])}
        </button>
      </div>

      {/* Chip grid (revealed when "Yes") */}
      {gate === 'yes' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap gap-2">
            {chipKeys.map((key) => {
              const isActive = selected.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleChip(key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all ${
                    isActive
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-muted'
                  }`}
                >
                  {isActive && <Check className="h-3.5 w-3.5" />}
                  {resolveLabel(key)}
                </button>
              );
            })}

            {/* "+ Other" chip */}
            <button
              type="button"
              onClick={() => setShowOther(!showOther)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all ${
                showOther
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-dashed border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              {showOther ? <X className="h-3.5 w-3.5" /> : '+'}
              {resolveLabel('addOther')}
            </button>
          </div>

          {/* Free-text for "Other" */}
          {showOther && (
            <input
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder={resolveLabel('otherPlaceholder')}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm animate-in fade-in slide-in-from-top-1 duration-150"
              autoFocus
            />
          )}
        </div>
      )}

      {/* Hidden input for form registration */}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
