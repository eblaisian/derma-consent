'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, Check, Search, Pill } from 'lucide-react';

interface MedicationTagsProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  brandColor?: string;
}

// Common medications in dermatology contexts (offline fallback)
const COMMON_MEDICATIONS = [
  'Aspirin', 'Ibuprofen', 'Warfarin', 'Methotrexate',
  'Prednisolone', 'Isotretinoin', 'Tretinoin',
  'Cyclosporine', 'Metformin', 'Levothyroxine',
  'Lisinopril', 'Metoprolol', 'Omeprazole',
  'Sertraline', 'Hormonal contraceptives',
];

/**
 * Medication tag builder with autocomplete.
 * - "No medications" shortcut for the common case
 * - Type-ahead search via NIH RxTerms API
 * - Fallback to local common medications list
 * - Tags are removable chips
 */
export function MedicationTags({
  name,
  value,
  onChange,
  brandColor,
}: MedicationTagsProps) {
  const t = useTranslations('medicalFields');
  const tOpt = useTranslations('medicalOptions');

  const [gate, setGate] = useState<'none' | 'yes' | null>(() => {
    if (!value) return null;
    if (value === 'none') return 'none';
    return 'yes';
  });
  const [tags, setTags] = useState<string[]>(() => {
    if (!value || value === 'none') return [];
    return value.split(',').filter(Boolean);
  });
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync to form value
  useEffect(() => {
    if (gate === 'none') {
      onChange('none');
    } else if (gate === 'yes') {
      onChange(tags.length > 0 ? tags.join(',') : '');
    }
  }, [gate, tags, onChange]);

  const searchMedications = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(term)}&maxList=7`,
        { signal: AbortSignal.timeout(3000) },
      );
      if (res.ok) {
        const data = await res.json();
        // RxTerms API returns [count, names, extras, codes]
        const names: string[] = data[1] || [];
        setSuggestions(names.filter((n) => !tags.includes(n)));
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback to local list
      const lower = term.toLowerCase();
      setSuggestions(
        COMMON_MEDICATIONS.filter(
          (m) => m.toLowerCase().includes(lower) && !tags.includes(m),
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [tags]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchMedications(val), 300);
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        addTag(suggestions[0]);
      } else if (query.trim().length >= 2) {
        addTag(query.trim());
      }
    }
    if (e.key === 'Backspace' && query === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleGate = (choice: 'none' | 'yes') => {
    setGate(choice);
    if (choice === 'none') {
      setTags([]);
      setQuery('');
    }
    if (choice === 'yes') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const activeStyle = brandColor
    ? { borderColor: brandColor, backgroundColor: `${brandColor}10`, color: brandColor }
    : undefined;

  return (
    <div className="space-y-3">
      {/* Gate */}
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
          {t('noMedications' as keyof IntlMessages['medicalFields'])}
        </button>
        <button
          type="button"
          onClick={() => handleGate('yes')}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all ${
            gate === 'yes'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
          }`}
          style={gate === 'yes' && brandColor ? activeStyle : undefined}
        >
          {gate === 'yes' && <Check className="h-4 w-4" />}
          {t('yesTakingMeds' as keyof IntlMessages['medicalFields'])}
        </button>
      </div>

      {/* Tag builder */}
      {gate === 'yes' && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-medium"
                  style={brandColor ? { backgroundColor: `${brandColor}15`, color: brandColor } : undefined}
                >
                  <Pill className="h-3 w-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={t('searchMedication' as keyof IntlMessages['medicalFields'])}
              className="flex h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm"
              autoComplete="off"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && (suggestions.length > 0 || loading) && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg animate-in fade-in slide-in-from-top-1 duration-100">
                {loading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {t('searching' as keyof IntlMessages['medicalFields'])}
                  </div>
                )}
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addTag(s)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors"
                  >
                    <Pill className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
