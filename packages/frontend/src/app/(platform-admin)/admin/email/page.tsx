'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { useAuthFetch } from '@/lib/auth-fetch';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Send, Eye, Loader2 } from 'lucide-react';

export default function AdminEmailPage() {
  const t = useTranslations('admin');
  const authFetch = useAuthFetch();

  const { data: fromConfig } = useSWR<{ key: string; value: string | null }>(
    '/api/admin/config/email.fromAddress',
    (url: string) => authFetch(url).then((r) => r.json()),
  );

  const DEFAULT_FROM = 'info@derma-consent.de';

  const [fromAddress, setFromAddress] = useState(DEFAULT_FROM);
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Override with platform config value if available
  useEffect(() => {
    if (fromConfig?.value) {
      setFromAddress(fromConfig.value);
    }
  }, [fromConfig?.value]);

  const recipientList = useMemo(() => {
    return recipients
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes('@'));
  }, [recipients]);

  const canSend = recipientList.length > 0 && subject.trim().length > 0 && htmlContent.trim().length > 0;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    try {
      const data = await authFetch('/api/admin/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: recipientList,
          subject: subject.trim(),
          html: htmlContent,
          fromAddress: fromAddress || DEFAULT_FROM,
        }),
      });
      toast.success(
        t('emailSentSuccess', { sent: data.sent, failed: data.failed }),
      );
    } catch (err) {
      toast.error(t('emailSentFailed', { error: err instanceof Error ? err.message : 'Unknown error' }));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('emailSender')}</h1>
        <p className="text-muted-foreground mt-1">{t('emailSenderDescription')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5 text-violet-500" />
              {t('emailCompose')}
            </CardTitle>
            <CardDescription>{t('emailComposeDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From */}
            <div className="space-y-1.5">
              <Label htmlFor="from">{t('emailFrom')}</Label>
              <Input
                id="from"
                type="email"
                value={fromAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromAddress(e.target.value)}
                placeholder={DEFAULT_FROM}
              />
            </div>

            {/* Recipients */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="recipients">{t('emailRecipients')}</Label>
                {recipientList.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t('emailRecipientCount', { count: recipientList.length })}
                  </span>
                )}
              </div>
              <Textarea
                id="recipients"
                value={recipients}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRecipients(e.target.value)}
                placeholder={t('emailRecipientsPlaceholder')}
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="subject">{t('emailSubject')}</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                placeholder={t('emailSubjectPlaceholder')}
              />
            </div>

            {/* HTML Content */}
            <div className="space-y-1.5">
              <Label htmlFor="html">{t('emailHtmlContent')}</Label>
              <Textarea
                id="html"
                value={htmlContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHtmlContent(e.target.value)}
                placeholder={t('emailHtmlPlaceholder')}
                rows={12}
                className="font-mono text-xs leading-relaxed max-h-[400px] overflow-y-auto resize-y"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSend}
                disabled={!canSend || sending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('emailSending')}
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    {t('emailSendButton')}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="lg:hidden"
              >
                <Eye className="size-4" />
                {t('emailPreview')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Preview */}
        <Card className={showPreview ? '' : 'hidden lg:block'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-5 text-violet-500" />
              {t('emailPreview')}
            </CardTitle>
            <CardDescription>{t('emailPreviewDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {htmlContent.trim() ? (
              <div className="rounded-lg border bg-white overflow-hidden">
                <iframe
                  srcDoc={htmlContent}
                  sandbox="allow-same-origin"
                  title="Email preview"
                  className="w-full border-0"
                  style={{ minHeight: '500px' }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 rounded-lg border border-dashed text-muted-foreground text-sm">
                {t('emailPreviewEmpty')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
