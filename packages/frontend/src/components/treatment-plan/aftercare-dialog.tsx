'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthFetch } from '@/lib/auth-fetch';
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
import { toast } from 'sonner';
import { Sparkles, Copy, Check, Printer, ArrowUpRight } from 'lucide-react';
import { useAiStatus } from '@/hooks/use-ai-status';

interface AftercareDialogProps {
  treatmentType: string;
  bodyRegion?: string;
}

function AftercareUpgradeDialog() {
  const t = useTranslations('aftercare');
  const tp = useTranslations('premiumGate');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {t('generate')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{tp('aftercareTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <Sparkles className="size-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {tp('aftercareDescription')}
          </p>
          <Button className="w-full" asChild>
            <Link href="/billing">
              {tp('upgradeCta')} <ArrowUpRight className="size-4 ml-1" />
            </Link>
          </Button>
          <Link href="/billing" className="block text-sm text-muted-foreground underline-offset-4 hover:underline">
            {tp('learnMore')}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AftercareDialog({ treatmentType, bodyRegion }: AftercareDialogProps) {
  const t = useTranslations('aftercare');
  const authFetch = useAuthFetch();
  const locale = useLocale();
  const { features, premiumFeatures } = useAiStatus();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setContent('');
    try {
      const data = await authFetch('/api/treatment-plans/aftercare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: treatmentType, bodyRegion, locale }),
      });
      setContent(data.content);
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  }, [treatmentType, bodyRegion, locale, authFetch, t]);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !content) generate();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success(t('copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<pre style="font-family: sans-serif; white-space: pre-wrap; max-width: 600px; margin: 40px auto;">${content}</pre>`);
      win.document.close();
      win.print();
    }
  };

  if (!features.aftercare && premiumFeatures.aftercare) {
    return <AftercareUpgradeDialog />;
  }

  if (!features.aftercare) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          {t('generate')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>{t('editHint')}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-9/12" />
            </div>
          )}

          {content && !loading && (
            <>
              <textarea
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                rows={12}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t('copied') : t('copy')}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                  <Printer className="h-3.5 w-3.5" />
                  {t('print')}
                </Button>
                <Button size="sm" onClick={generate} className="gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('regenerate')}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
