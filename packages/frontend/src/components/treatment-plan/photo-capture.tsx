'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X } from 'lucide-react';

interface PhotoResult {
  dataUrl: string;
  aspectRatio: number;
}

interface Props {
  onCapture: (result: PhotoResult) => void;
}

const MAX_WIDTH = 1200;

function resizeImage(source: HTMLVideoElement | HTMLImageElement): PhotoResult {
  const canvas = document.createElement('canvas');
  const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
  const scale = sw > MAX_WIDTH ? MAX_WIDTH / sw : 1;
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.85),
    aspectRatio: canvas.width / canvas.height,
  };
}

export function PhotoCapture({ onCapture }: Props) {
  const t = useTranslations('treatmentPlan');
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Wire srcObject once the <video> element mounts after stream state changes
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(`getUserMedia not available (secure context: ${window.isSecureContext}, protocol: ${location.protocol})`);
      return;
    }

    // Check permission state first for diagnostics
    try {
      const permStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (permStatus.state === 'denied') {
        setCameraError('Camera permission denied. Reset it in browser site settings (click lock icon in address bar).');
        return;
      }
    } catch {
      // permissions.query not supported for camera in all browsers — continue
    }

    // Try rear camera first, fall back to front, then any
    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
      { video: { facingMode: { ideal: 'user' } } },
      { video: true },
    ];

    let lastError: unknown;
    for (const constraint of constraints) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
        streamRef.current = mediaStream;
        setCameraError(null);
        setStream(mediaStream);
        return;
      } catch (err) {
        lastError = err;
        console.warn('[PhotoCapture] getUserMedia failed:', constraint, err);
      }
    }

    // All attempts failed — show the actual error
    const errMsg = lastError instanceof DOMException
      ? `${lastError.name}: ${lastError.message}`
      : String(lastError);
    setCameraError(errMsg);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const result = resizeImage(videoRef.current);
    stopStream();
    onCapture(result);
  }, [stopStream, onCapture]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const result = resizeImage(img);
      URL.revokeObjectURL(img.src);
      onCapture(result);
    };
    img.src = URL.createObjectURL(file);
  }, [onCapture]);

  if (stream) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={capturePhoto}>
            <Camera className="h-4 w-4 mr-2" />
            {t('takePhoto')}
          </Button>
          <Button variant="outline" onClick={stopStream}>
            <X className="h-4 w-4 mr-2" />
            {t('cancel')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed rounded-lg">
      <p className="text-sm text-muted-foreground">{t('captureInstructions')}</p>
      {cameraError && (
        <div className="text-center space-y-1">
          <p className="text-sm text-destructive">{t('cameraError')}</p>
          <p className="text-xs text-muted-foreground font-mono">{cameraError}</p>
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={startCamera}>
          <Camera className="h-4 w-4 mr-2" />
          {t('takePhoto')}
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          {t('uploadPhoto')}
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
