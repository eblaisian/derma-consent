'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthFetch } from '@/lib/auth-fetch';
import { useVault } from '@/hooks/use-vault';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { PhotoType, BodyRegion } from '@/lib/types';
import type { Practice } from '@/lib/types';

const PHOTO_TYPES: PhotoType[] = ['BEFORE', 'AFTER'];
const BODY_REGIONS: BodyRegion[] = [
  'FOREHEAD', 'GLABELLA', 'PERIORBITAL', 'CHEEKS', 'NASOLABIAL',
  'LIPS', 'CHIN', 'JAWLINE', 'NECK', 'DECOLLETE', 'HANDS', 'SCALP', 'OTHER',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  practice: Practice;
  onUploaded: () => void;
}

export function PhotoUploadDialog({ open, onOpenChange, patientId, practice, onUploaded }: Props) {
  const t = useTranslations('photos');
  const tRegions = useTranslations('bodyRegions');
  const authFetch = useAuthFetch();
  const { encryptPhoto } = useVault();

  const [type, setType] = useState<PhotoType>('BEFORE');
  const [bodyRegion, setBodyRegion] = useState<BodyRegion>('FOREHEAD');
  const [takenAt, setTakenAt] = useState(new Date().toISOString().slice(0, 10));
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const encrypted = await encryptPhoto(arrayBuffer, practice.publicKey);

      const formData = new FormData();
      formData.append('file', new Blob([encrypted.encryptedBlob]), 'photo.enc');
      formData.append('patientId', patientId);
      formData.append('type', type);
      formData.append('bodyRegion', bodyRegion);
      formData.append('encryptedSessionKey', encrypted.encryptedSessionKey);
      formData.append('takenAt', new Date(takenAt).toISOString());
      formData.append('encryptedMetadata', JSON.stringify({ iv: encrypted.iv, ciphertext: '' }));

      await authFetch('/api/photos', { method: 'POST', body: formData });
      toast.success(t('uploaded'));
      onUploaded();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('uploadTitle')}</DialogTitle>
          <DialogDescription>{t('uploadDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t('file')}</Label>
            <Input ref={fileRef} type="file" accept="image/*" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('photoType')}</Label>
              <Select value={type} onValueChange={(v) => setType(v as PhotoType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHOTO_TYPES.map((pt) => (
                    <SelectItem key={pt} value={pt}>{t(pt as keyof IntlMessages['photos'])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('bodyRegion')}</Label>
              <Select value={bodyRegion} onValueChange={(v) => setBodyRegion(v as BodyRegion)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BODY_REGIONS.map((br) => (
                    <SelectItem key={br} value={br}>{tRegions(br as keyof IntlMessages['bodyRegions'])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{t('takenAt')}</Label>
            <Input
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? t('uploading') : t('upload')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
