'use client';

import { useState, useCallback } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EncryptedPhotoViewer } from './encrypted-photo-viewer';
import type { TreatmentPhotoSummary } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: TreatmentPhotoSummary[];
}

export function PhotoComparisonViewer({ open, onOpenChange, photos }: Props) {
  const t = useTranslations('photos');
  const format = useFormatter();

  const beforePhotos = photos.filter((p) => p.type === 'BEFORE');
  const afterPhotos = photos.filter((p) => p.type === 'AFTER');

  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(0);

  const before = beforePhotos[beforeIdx];
  const after = afterPhotos[afterIdx];

  const navigateBefore = useCallback((dir: 1 | -1) => {
    setBeforeIdx((i) => Math.max(0, Math.min(beforePhotos.length - 1, i + dir)));
  }, [beforePhotos.length]);

  const navigateAfter = useCallback((dir: 1 | -1) => {
    setAfterIdx((i) => Math.max(0, Math.min(afterPhotos.length - 1, i + dir)));
  }, [afterPhotos.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('comparison')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          {/* Before column */}
          <ComparisonColumn
            label={t('BEFORE')}
            variant="before"
            photo={before}
            photos={beforePhotos}
            activeIdx={beforeIdx}
            onIdxChange={setBeforeIdx}
            onNavigate={navigateBefore}
            emptyLabel={t('noBeforePhotos')}
            format={format}
          />
          {/* After column */}
          <ComparisonColumn
            label={t('AFTER')}
            variant="after"
            photo={after}
            photos={afterPhotos}
            activeIdx={afterIdx}
            onIdxChange={setAfterIdx}
            onNavigate={navigateAfter}
            emptyLabel={t('noAfterPhotos')}
            format={format}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComparisonColumn({
  label, variant, photo, photos, activeIdx, onIdxChange, onNavigate, emptyLabel, format,
}: {
  label: string;
  variant: 'before' | 'after';
  photo: TreatmentPhotoSummary | undefined;
  photos: TreatmentPhotoSummary[];
  activeIdx: number;
  onIdxChange: (i: number) => void;
  onNavigate: (dir: 1 | -1) => void;
  emptyLabel: string;
  format: ReturnType<typeof useFormatter>;
}) {
  return (
    <div className="space-y-3">
      <Badge
        variant={variant === 'before' ? 'secondary' : 'outline'}
        className="text-xs font-medium"
      >
        {label}
      </Badge>

      {photo ? (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden bg-muted">
            <EncryptedPhotoViewer photo={photo} className="h-72 w-full" />

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 size-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md disabled:hidden"
                  style={{ opacity: activeIdx > 0 ? undefined : 0 }}
                  disabled={activeIdx === 0}
                  onClick={() => onNavigate(-1)}
                  aria-label="Previous"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md disabled:hidden"
                  style={{ opacity: activeIdx < photos.length - 1 ? undefined : 0 }}
                  disabled={activeIdx === photos.length - 1}
                  onClick={() => onNavigate(1)}
                  aria-label="Next"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </>
            )}
          </div>

          {/* Date + pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {format.dateTime(new Date(photo.takenAt), { dateStyle: 'medium' })}
            </p>
            {photos.length > 1 && (
              <div className="flex items-center gap-1.5" role="tablist">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === activeIdx}
                    aria-label={`Photo ${i + 1}`}
                    className={`size-2.5 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                      i === activeIdx
                        ? 'bg-primary scale-110'
                        : 'bg-muted-foreground/25 hover:bg-muted-foreground/40'
                    }`}
                    onClick={() => onIdxChange(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-72 bg-muted/50 rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
