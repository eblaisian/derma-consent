'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Sparkles, Copy, Check, Send } from 'lucide-react';
import { SendMessageDialog } from './send-message-dialog';

const CONTEXTS = [
  'CONSENT_REMINDER',
  'APPOINTMENT_CONFIRMATION',
  'APPOINTMENT_REMINDER',
  'FOLLOW_UP',
  'TREATMENT_PREPARATION',
  'RESULT_READY',
  'GENERAL',
] as const;

const LOCALES = ['de', 'en', 'es', 'fr', 'ar', 'tr', 'pl', 'ru'] as const;

const LOCALE_LABELS: Record<string, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
  tr: 'Türkçe',
  pl: 'Polski',
  ru: 'Русский',
};

export function MessageComposer() {
  const t = useTranslations('communications');
  const authFetch = useAuthFetch();
  const currentLocale = useLocale();

  const [context, setContext] = useState<string>('');
  const [locale, setLocale] = useState<string>(currentLocale);
  const [draft, setDraft] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  const handleGenerate = async () => {
    if (!context) return;
    setLoading(true);
    setDraft('');
    try {
      const data = await authFetch('/api/communications/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, locale }),
      });
      setDraft(data.draft);
    } catch {
      toast.error(t('errorUnavailable'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    toast.success(t('copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Context + Language pickers */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('contextLabel')}</label>
              <Select value={context} onValueChange={setContext}>
                <SelectTrigger>
                  <SelectValue placeholder={t('contextLabel')} />
                </SelectTrigger>
                <SelectContent>
                  {CONTEXTS.map((ctx) => (
                    <SelectItem key={ctx} value={ctx}>
                      {t(`contexts.${ctx}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('languageLabel')}</label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {LOCALE_LABELS[loc]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!context || loading}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? t('generating') : t('generateButton')}
          </Button>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-9/12" />
            </div>
          )}

          {/* Draft editor */}
          {draft && !loading && (
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('draftLabel')}</label>
              <textarea
                value={draft}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
                rows={8}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t('copied') : t('copyButton')}
                </Button>
                <Button size="sm" onClick={() => setSendOpen(true)} className="gap-2">
                  <Send className="h-3.5 w-3.5" />
                  {t('sendButton')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {sendOpen && (
        <SendMessageDialog
          message={draft}
          onClose={() => setSendOpen(false)}
        />
      )}
    </>
  );
}
