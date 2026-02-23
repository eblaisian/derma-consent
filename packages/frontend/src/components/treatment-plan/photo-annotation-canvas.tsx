'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PhotoPointMarker } from './photo-point-marker';
import type { InjectionPoint, ConsentType } from '@/lib/types';

interface Props {
  photoDataUrl: string;
  points: InjectionPoint[];
  onPointAdd?: (point: InjectionPoint) => void;
  onPointUpdate?: (point: InjectionPoint) => void;
  onPointRemove?: (id: string) => void;
  readOnly?: boolean;
  consentType?: ConsentType;
}

export function PhotoAnnotationCanvas({
  photoDataUrl,
  points,
  onPointAdd,
  onPointUpdate,
  onPointRemove,
  readOnly = false,
  consentType,
}: Props) {
  const t = useTranslations('treatmentPlan');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly || !onPointAdd) return;

      // Don't add point when clicking existing markers or popover content
      const target = e.target as HTMLElement;
      if (target.closest('[data-radix-popper-content-wrapper]') || target.closest('[data-point-marker]')) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const isFiller = consentType === 'FILLER';
      const point: InjectionPoint = {
        id: crypto.randomUUID(),
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        product: isFiller ? 'Juvederm Ultra' : 'Botox',
        units: isFiller ? 0.1 : 4,
        batchNumber: '',
        technique: isFiller ? 'linear_threading' : 'bolus',
        notes: '',
      };

      onPointAdd(point);
    },
    [readOnly, onPointAdd, consentType],
  );

  return (
    <div className="space-y-1">
      {!readOnly && (
        <p className="text-xs text-muted-foreground">{t('photoAnnotationHint')}</p>
      )}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden cursor-crosshair select-none"
        onClick={handleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoDataUrl}
          alt=""
          className="w-full h-auto block"
          draggable={false}
        />
        {points.map((point) => (
          <div key={point.id} data-point-marker>
            <PhotoPointMarker
              point={point}
              readOnly={readOnly}
              onUpdate={onPointUpdate}
              onRemove={() => onPointRemove?.(point.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
