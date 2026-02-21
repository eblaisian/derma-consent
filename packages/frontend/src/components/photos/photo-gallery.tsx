'use client';

import { useTranslations } from 'next-intl';
import { useFormatter } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { Badge } from '@/components/ui/badge';
import { EncryptedPhotoViewer } from './encrypted-photo-viewer';
import type { TreatmentPhotoSummary, BodyRegion } from '@/lib/types';

interface Props {
  photos: TreatmentPhotoSummary[];
  onPhotoClick?: (photo: TreatmentPhotoSummary) => void;
}

export function PhotoGallery({ photos, onPhotoClick }: Props) {
  const t = useTranslations('photos');
  const tRegions = useTranslations('bodyRegions');
  const format = useFormatter();
  const { isUnlocked } = useVault();

  if (photos.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        {t('noPhotos')}
      </p>
    );
  }

  // Group by body region
  const grouped = photos.reduce<Record<string, TreatmentPhotoSummary[]>>((acc, photo) => {
    const key = photo.bodyRegion;
    if (!acc[key]) acc[key] = [];
    acc[key].push(photo);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([region, regionPhotos]) => (
        <div key={region}>
          <h4 className="text-sm font-medium mb-2">{tRegions(region as keyof IntlMessages['bodyRegions'])}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {regionPhotos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                className="relative group text-left"
                onClick={() => onPhotoClick?.(photo)}
              >
                {isUnlocked ? (
                  <EncryptedPhotoViewer photo={photo} className="h-32 w-full" />
                ) : (
                  <div className="h-32 w-full bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                    {t('locked')}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {t(photo.type as keyof IntlMessages['photos'])}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {format.dateTime(new Date(photo.takenAt), { dateStyle: 'short' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
