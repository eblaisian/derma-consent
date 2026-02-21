'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useVault } from '@/hooks/use-vault';
import { API_URL } from '@/lib/api';
import type { TreatmentPhotoSummary } from '@/lib/types';

interface Props {
  photo: TreatmentPhotoSummary;
  className?: string;
}

export function EncryptedPhotoViewer({ photo, className }: Props) {
  const { data: session } = useSession();
  const { isUnlocked, decryptPhoto } = useVault();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isUnlocked || !session?.accessToken) return;

    let revoke: string | null = null;

    const loadPhoto = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_URL}/api/photos/${photo.id}/download`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (!res.ok) throw new Error('Download failed');

        const encryptedBlob = await res.arrayBuffer();
        const iv = photo.encryptedMetadata?.iv ?? '';
        const decrypted = await decryptPhoto(encryptedBlob, iv, photo.encryptedSessionKey);
        const url = URL.createObjectURL(new Blob([decrypted], { type: 'image/jpeg' }));
        revoke = url;
        setObjectUrl(url);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadPhoto();

    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [isUnlocked, session?.accessToken, photo.id, photo.encryptedSessionKey, photo.encryptedMetadata?.iv, decryptPhoto]);

  if (!isUnlocked) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded text-xs text-muted-foreground ${className ?? 'h-40'}`}>
        Vault locked
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className ?? 'h-40'}`}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded text-xs text-muted-foreground ${className ?? 'h-40'}`}>
        Decryption failed
      </div>
    );
  }

  return (
    <img
      src={objectUrl}
      alt={`${photo.type} - ${photo.bodyRegion}`}
      className={`rounded object-cover ${className ?? 'h-40 w-full'}`}
    />
  );
}
