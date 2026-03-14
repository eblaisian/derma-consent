'use client';

import { useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import type { ConsentType } from './form-fields';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ConsentExplainerProps {
  consentType: ConsentType;
  token: string;
  brandColor?: string;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

export function ConsentExplainer({ token, brandColor }: ConsentExplainerProps) {
  const t = useTranslations('consent');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchExplanation = useCallback(async () => {
    setStatus('loading');
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/consent/${token}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      if (!res.ok) {
        throw new Error(`${res.status}`);
      }

      const data = await res.json();
      setExplanation(data.explanation);
      setStatus('done');
    } catch {
      setErrorMsg(t('explainerError'));
      setStatus('error');
    }
  }, [token, locale, t]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && status === 'idle') {
      fetchExplanation();
    }
  };

  const bulletPoints = explanation
    ? explanation
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-sm"
          style={brandColor ? { borderColor: brandColor, color: brandColor } : undefined}
        >
          <Sparkles className="h-4 w-4" />
          {t('explainerButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('explainerTitle')}</DialogTitle>
          <DialogDescription>{t('explainerSubtitle')}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Loading state */}
          {status === 'loading' && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-9/12" />
            </div>
          )}

          {/* Done state — bullet points */}
          {status === 'done' && bulletPoints.length > 0 && (
            <ul className="space-y-2.5 text-sm leading-relaxed text-foreground">
              {bulletPoints.map((point, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 mt-0.5 text-primary">
                    {point.startsWith('•') ? '' : '•'}
                  </span>
                  <span>{point.replace(/^•\s*/, '')}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <Button variant="outline" size="sm" onClick={fetchExplanation} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                {t('explainerRetry')}
              </Button>
            </div>
          )}

          {/* Disclaimer */}
          {(status === 'done' || status === 'loading') && (
            <p className="text-xs text-muted-foreground border-t pt-3 leading-relaxed">
              {t('explainerDisclaimer')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
