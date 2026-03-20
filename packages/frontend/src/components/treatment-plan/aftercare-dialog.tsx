'use client';

import { useState, useCallback, useRef } from 'react';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Sparkles,
  Copy,
  Check,
  Printer,
  ArrowUpRight,
  WandSparkles,
  Send,
  Loader2,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useAiStatus } from '@/hooks/use-ai-status';
import { AftercareEditor, type AftercareEditorHandle } from './aftercare-editor';

interface AftercareDialogProps {
  treatmentType: string;
  bodyRegion?: string;
  patientEmail?: string | null;
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
          <Link
            href="/billing"
            className="block text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {tp('learnMore')}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AftercareDialog({
  treatmentType,
  bodyRegion,
  patientEmail,
}: AftercareDialogProps) {
  const t = useTranslations('aftercare');
  const authFetch = useAuthFetch();
  const locale = useLocale();
  const { features, premiumFeatures } = useAiStatus();

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const editorRef = useRef<AftercareEditorHandle>(null);

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
      setIsEdited(false);
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

  const handleRegenerate = () => {
    if (isEdited) {
      setShowRegenerateConfirm(true);
      return;
    }
    generate();
  };

  const confirmRegenerate = () => {
    setShowRegenerateConfirm(false);
    generate();
  };

  const handleCopy = async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const html = editor.getHTML();
    const plainText = editor.getText();

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(plainText);
    }

    setCopied(true);
    toast.success(t('copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const html = editor.getHTML();
    const now = new Date().toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${t('dialogTitle')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 680px;
      margin: 0 auto;
      padding: 48px 32px;
      color: #1a1a1a;
      line-height: 1.6;
    }
    .header {
      border-bottom: 2px solid #e5e5e5;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .header .date {
      font-size: 13px;
      color: #666;
    }
    .content h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 20px 0 8px;
    }
    .content h3 {
      font-size: 14px;
      font-weight: 600;
      margin: 16px 0 6px;
    }
    .content p {
      font-size: 14px;
      margin-bottom: 8px;
    }
    .content ol, .content ul {
      font-size: 14px;
      padding-left: 24px;
      margin-bottom: 12px;
    }
    .content li {
      margin-bottom: 6px;
    }
    .content strong {
      font-weight: 600;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e5e5;
      font-size: 11px;
      color: #999;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 2cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${t('dialogTitle')}</h1>
    <div class="date">${now}</div>
  </div>
  <div class="content">${html}</div>
  <div class="footer">${t('printDisclaimer')}</div>
</body>
</html>`);
    win.document.close();
    win.print();
  };

  const openSendDialog = () => {
    setSendEmail(patientEmail || '');
    setShowSendDialog(true);
  };

  const handleSend = async () => {
    const editor = editorRef.current;
    if (!editor || !sendEmail.trim()) return;

    setSending(true);
    try {
      await authFetch('/api/treatment-plans/aftercare/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent: editor.getHTML(),
          subject: t('dialogTitle'),
          channel: 'email',
          recipientEmail: sendEmail.trim(),
          locale,
        }),
      });
      toast.success(t('sendSuccess'));
      setShowSendDialog(false);
    } catch {
      toast.error(t('sendError'));
    } finally {
      setSending(false);
    }
  };

  if (!features.aftercare && premiumFeatures.aftercare) {
    return <AftercareUpgradeDialog />;
  }

  if (!features.aftercare) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            {t('generate')}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <div className="flex items-center gap-2">
              <DialogTitle>{t('dialogTitle')}</DialogTitle>
              {content && !loading && !isEdited && (
                <Badge variant="secondary" className="text-xs font-normal gap-1">
                  <Sparkles className="size-3" />
                  {t('aiGenerated')}
                </Badge>
              )}
            </div>
            <DialogDescription>{t('editHint')}</DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="space-y-2 py-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-9/12" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
            </div>
          )}

          {content && !loading && (
            <AftercareEditor
              ref={editorRef}
              content={content}
              onEdit={() => setIsEdited(true)}
            />
          )}

          {/* Action bar — pinned at bottom */}
          {content && !loading && (
            <div className="shrink-0 flex items-center gap-2 border-t pt-3">
              {/* Secondary actions — icon-only with tooltips */}
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      className="size-8"
                      aria-label={t('copy')}
                    >
                      {copied ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{copied ? t('copied') : t('copy')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrint}
                      className="size-8"
                      aria-label={t('print')}
                    >
                      <Printer className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('print')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRegenerate}
                      className="size-8"
                      aria-label={t('regenerate')}
                    >
                      <WandSparkles className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('regenerate')}</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex-1" />

              {/* Primary action */}
              {patientEmail ? (
                <Button
                  size="sm"
                  onClick={openSendDialog}
                  disabled={sending}
                  className="gap-2"
                >
                  {sending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {t('sendToPatient')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="gap-2"
                >
                  <Printer className="h-3.5 w-3.5" />
                  {t('print')}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showRegenerateConfirm}
        onOpenChange={setShowRegenerateConfirm}
        title={t('regenerateConfirmTitle')}
        description={t('regenerateConfirm')}
        confirmLabel={t('regenerate')}
        cancelLabel={t('cancel')}
        onConfirm={confirmRegenerate}
      />

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('sendConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('sendConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="send-email" className="text-sm font-medium">
              {t('sendEmailLabel')}
            </label>
            <input
              id="send-email"
              type="email"
              value={sendEmail}
              onChange={(e) => setSendEmail(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
              disabled={sending}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !sendEmail.trim()}
              className="gap-2"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {t('sendToPatient')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
