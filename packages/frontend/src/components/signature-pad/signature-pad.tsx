'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';

interface SignaturePadProps {
  onSignatureChange: (data: string | null) => void;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const t = useTranslations('consent');
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Size the canvas internal bitmap to match the CSS rendered size at device pixel ratio
  // so toDataURL() exports a sharp, full-resolution image
  useEffect(() => {
    const canvas = sigRef.current?.getCanvas();
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2× — sufficient for PDF/display
    canvas.width = container.offsetWidth * ratio;
    canvas.height = 192 * ratio;
    const ctx = canvas.getContext('2d');
    ctx?.scale(ratio, ratio);
  }, []);

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
      <div ref={containerRef} className="border rounded-lg bg-white touch-none overflow-hidden">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            className: 'w-full cursor-crosshair',
            style: { height: '192px' },
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
