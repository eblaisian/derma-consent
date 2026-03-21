'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, PenLine } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (data: string | null) => void;
}

export function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const t = useTranslations('consent');
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = sigRef.current?.getCanvas();
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = container.offsetWidth * ratio;
    canvas.height = 192 * ratio;
    const ctx = canvas.getContext('2d');
    ctx?.scale(ratio, ratio);
  }, []);

  const handleEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      const data = sigRef.current.toDataURL('image/png');
      onSignatureChange(data);
      setHasDrawn(true);
    }
  }, [onSignatureChange]);

  const handleBegin = useCallback(() => {
    setHasDrawn(true);
  }, []);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onSignatureChange(null);
    setHasDrawn(false);
  }, [onSignatureChange]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">
        {t('signature')}
      </label>
      <div
        ref={containerRef}
        className="relative border-2 border-dashed border-border/60 rounded-xl bg-white touch-none overflow-hidden transition-colors focus-within:border-primary/40"
      >
        {/* Placeholder overlay */}
        <AnimatePresence>
          {!hasDrawn && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PenLine className="size-6 text-muted-foreground/30 mb-2" />
              <span className="text-sm text-muted-foreground/40 font-medium">
                {t('signaturePlaceholder')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Signature line */}
        <div className="absolute bottom-10 left-6 right-6 border-b border-muted-foreground/10 pointer-events-none" />

        <SignatureCanvas
          ref={sigRef}
          penColor="#1a1a1a"
          minWidth={1.5}
          maxWidth={3}
          canvasProps={{
            className: 'w-full cursor-crosshair relative z-20',
            style: { height: '192px' },
          }}
          onEnd={handleEnd}
          onBegin={handleBegin}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={handleClear} className="gap-1.5">
          <Eraser className="size-3.5" />
          {t('clearSignature')}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t('signatureHint')}
        </span>
      </div>
    </div>
  );
}
