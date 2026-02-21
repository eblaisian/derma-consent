'use client';

import { useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  onSignatureChange: (data: string | null) => void;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const t = useTranslations('consent');
  const sigRef = useRef<SignatureCanvas>(null);

  const handleEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const data = sigRef.current.toDataURL('image/png');
      onSignatureChange(data);
    }
  }, [onSignatureChange]);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onSignatureChange(null);
  }, [onSignatureChange]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t('signature')}
      </label>
      <div className="border rounded-md bg-white touch-none">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            className: 'w-full h-48',
            style: { width: '100%', height: '192px' },
          }}
          onEnd={handleEnd}
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleClear}>
        {t('clearSignature')}
      </Button>
    </div>
  );
}
