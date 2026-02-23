'use client';

import { useState } from 'react';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { InjectionPointEditFields } from './injection-point-edit-fields';
import type { InjectionPoint } from '@/lib/types';

interface Props {
  point: InjectionPoint;
  readOnly?: boolean;
  onUpdate?: (point: InjectionPoint) => void;
  onRemove?: () => void;
}

export function PhotoPointMarker({ point, readOnly, onUpdate, onRemove }: Props) {
  const [open, setOpen] = useState(false);

  const marker = (
    <div
      className="absolute flex items-center justify-center w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-md border-2 border-white cursor-pointer select-none"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
    >
      {point.units}
    </div>
  );

  if (readOnly) {
    return (
      <>
        {marker}
        {point.muscle && (
          <div
            className="absolute -translate-x-1/2 text-[9px] text-muted-foreground pointer-events-none select-none whitespace-nowrap"
            style={{ left: `${point.x}%`, top: `${point.y + 3}%` }}
          >
            {point.muscle}
          </div>
        )}
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {marker}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" side="right" align="start">
        <InjectionPointEditFields
          point={point}
          onUpdate={(p) => onUpdate?.(p)}
          onRemove={() => onRemove?.()}
          onDone={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
