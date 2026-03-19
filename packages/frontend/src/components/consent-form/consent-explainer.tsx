'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ListTree,
  AlignLeft,
} from 'lucide-react';
import type { ConsentType } from './form-fields';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ConsentExplainerProps {
  consentType: ConsentType;
  token: string;
}

type Status = 'idle' | 'loading' | 'done' | 'error';
type ExplainMode = 'full' | 'summary';

export function ConsentExplainer({ token }: ConsentExplainerProps) {
  const t = useTranslations('consent');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [mode, setMode] = useState<ExplainMode>('full');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const fetchedLocaleRef = useRef<string | null>(null);
  const fetchedModeRef = useRef<ExplainMode>('full');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const fetchExplanation = useCallback(async (fetchMode?: ExplainMode) => {
    const targetMode = fetchMode ?? mode;
    setStatus('loading');
    setErrorMsg(null);
    setCopied(false);
    stopSpeaking();
    try {
      const res = await fetch(`${API_URL}/api/consent/${token}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, mode: targetMode }),
      });

      if (!res.ok) {
        throw new Error(`${res.status}`);
      }

      const data = await res.json();
      setExplanation(data.explanation);
      setStatus('done');
      fetchedLocaleRef.current = locale;
      fetchedModeRef.current = targetMode;
    } catch {
      setErrorMsg(t('explainerError'));
      setStatus('error');
    }
  }, [token, locale, mode, t]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      if (status === 'idle' || fetchedLocaleRef.current !== locale) {
        fetchExplanation();
      }
    } else {
      stopSpeaking();
    }
  };

  const handleToggleMode = useCallback(() => {
    const newMode: ExplainMode = mode === 'full' ? 'summary' : 'full';
    setMode(newMode);
    fetchExplanation(newMode);
  }, [mode, fetchExplanation]);

  // If locale changes while dialog is open, re-fetch
  useEffect(() => {
    if (open && status === 'done' && fetchedLocaleRef.current !== locale) {
      fetchExplanation();
    }
  }, [locale, open, status, fetchExplanation]);

  const handleCopy = useCallback(async () => {
    if (!explanation) return;
    const plainText = explanation
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => (line.startsWith('•') ? line : `• ${line}`))
      .join('\n');
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [explanation]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const handleSpeak = useCallback(() => {
    if (!explanation || typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speaking) {
      stopSpeaking();
      return;
    }

    const plainText = explanation
      .split('\n')
      .map((line) => line.replace(/^•\s*/, '').trim())
      .filter((line) => line.length > 0)
      .join('. ');

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = localeToSpeechLang(locale);
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [explanation, locale, speaking, stopSpeaking]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const bulletPoints = explanation
    ? explanation
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    : [];

  const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-sm"
        >
          <Sparkles className="h-4 w-4" />
          {t('explainerButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('explainerTitle')}</DialogTitle>
          <DialogDescription>{t('explainerSubtitle')}</DialogDescription>
          {/* Summary / Full toggle */}
          {(status === 'done' || status === 'loading') && (
            <div className="flex gap-1 pt-1">
              <Button
                variant={mode === 'summary' ? 'default' : 'outline'}
                size="xs"
                onClick={mode !== 'summary' ? handleToggleMode : undefined}
                className="gap-1.5 text-xs"
                disabled={status === 'loading'}
              >
                <AlignLeft className="h-3 w-3" />
                {t('explainerSummary')}
              </Button>
              <Button
                variant={mode === 'full' ? 'default' : 'outline'}
                size="xs"
                onClick={mode !== 'full' ? handleToggleMode : undefined}
                className="gap-1.5 text-xs"
                disabled={status === 'loading'}
              >
                <ListTree className="h-3 w-3" />
                {t('explainerFull')}
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
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

          {/* Done state */}
          {status === 'done' && mode === 'summary' && explanation && (
            <p className="text-sm leading-relaxed text-foreground">
              {explanation}
            </p>
          )}
          {status === 'done' && mode === 'full' && bulletPoints.length > 0 && (
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
              <Button variant="outline" size="sm" onClick={() => fetchExplanation()} className="gap-2">
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

        {/* Action bar — copy, read aloud, regenerate */}
        {status === 'done' && (
          <div className="flex items-center gap-2 border-t pt-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? t('explainerCopied') : t('explainerCopy')}
            </Button>

            {hasSpeechSynthesis && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSpeak}
                className="gap-1.5"
              >
                {speaking ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {speaking ? t('explainerStopReading') : t('explainerReadAloud')}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchExplanation()}
              className="gap-1.5 ml-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('explainerRegenerate')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Map i18n locale code to BCP-47 speech synthesis language tag */
function localeToSpeechLang(locale: string): string {
  const map: Record<string, string> = {
    de: 'de-DE',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    ar: 'ar-SA',
    tr: 'tr-TR',
    pl: 'pl-PL',
    ru: 'ru-RU',
  };
  return map[locale] || 'de-DE';
}
