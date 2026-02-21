'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormatter } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('comparison')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">{t('BEFORE')}</p>
            {before ? (
              <>
                <EncryptedPhotoViewer photo={before} className="h-64 w-full" />
                <p className="text-xs text-muted-foreground mt-1">
                  {format.dateTime(new Date(before.takenAt), { dateStyle: 'medium' })}
                </p>
                {beforePhotos.length > 1 && (
                  <div className="flex gap-1 mt-2">
                    {beforePhotos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`h-2 w-2 rounded-full ${i === beforeIdx ? 'bg-primary' : 'bg-muted'}`}
                        onClick={() => setBeforeIdx(i)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-64 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                {t('noBeforePhotos')}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{t('AFTER')}</p>
            {after ? (
              <>
                <EncryptedPhotoViewer photo={after} className="h-64 w-full" />
                <p className="text-xs text-muted-foreground mt-1">
                  {format.dateTime(new Date(after.takenAt), { dateStyle: 'medium' })}
                </p>
                {afterPhotos.length > 1 && (
                  <div className="flex gap-1 mt-2">
                    {afterPhotos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`h-2 w-2 rounded-full ${i === afterIdx ? 'bg-primary' : 'bg-muted'}`}
                        onClick={() => setAfterIdx(i)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-64 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                {t('noAfterPhotos')}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
