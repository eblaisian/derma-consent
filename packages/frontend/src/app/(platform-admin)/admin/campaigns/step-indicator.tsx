'use client';

import { Check } from 'lucide-react';

const STEPS = [
  { key: 'upload', label: 'Upload', num: 1 },
  { key: 'template', label: 'Template', num: 2 },
  { key: 'review', label: 'Review & Send', num: 3 },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];

export function StepIndicator({ current }: { current: StepKey }) {
  const currentIdx = STEPS.findIndex((x) => x.key === current);

  return (
    <nav aria-label="Campaign steps" className="hidden sm:flex items-center gap-1">
      {STEPS.map((s, i) => {
        const isActive = s.key === current;
        const isPast = currentIdx > i;
        return (
          <div key={s.key} className="flex items-center gap-1">
            {i > 0 && (
              <div className={`h-px w-4 transition-colors ${isPast ? 'bg-teal-400' : 'bg-border'}`} />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : isPast
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                      : 'bg-muted text-muted-foreground'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isPast ? <Check className="size-3" /> : s.num}
              </div>
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
