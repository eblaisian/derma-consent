'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { Mail, MessageSquare, Send } from 'lucide-react';

interface SendMessageDialogProps {
  message: string;
  onClose: () => void;
}

/** Extract unique [Placeholder] tokens from a message */
function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\[([^\]]+)\]/g) || [];
  return [...new Set(matches)];
}

export function SendMessageDialog({ message, onClose }: SendMessageDialogProps) {
  const t = useTranslations('communications');
  const authFetch = useAuthFetch();
  const { whatsappEnabled } = useFeatureFlags();

  const [channel, setChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);

  // Detect placeholders in the AI-generated draft
  const placeholders = useMemo(() => extractPlaceholders(message), [message]);
  const [replacements, setReplacements] = useState<Record<string, string>>(
    () => Object.fromEntries(placeholders.map((p) => [p, ''])),
  );

  const updateReplacement = (placeholder: string, value: string) => {
    setReplacements((prev) => ({ ...prev, [placeholder]: value }));
  };

  // Build the final message with placeholders replaced
  const finalMessage = useMemo(() => {
    let result = message;
    for (const [placeholder, value] of Object.entries(replacements)) {
      if (value.trim()) {
        result = result.replaceAll(placeholder, value.trim());
      }
    }
    return result;
  }, [message, replacements]);

  const hasUnfilledPlaceholders = placeholders.some(
    (p) => !replacements[p]?.trim() && finalMessage.includes(p),
  );

  const handleSend = async () => {
    if (!recipient.trim()) return;
    setSending(true);
    try {
      await authFetch('/api/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: finalMessage, channel, recipient: recipient.trim() }),
      });
      toast.success(t('sendSuccess'));
      onClose();
    } catch {
      toast.error(t('sendError'));
    } finally {
      setSending(false);
    }
  };

  // Clean label from [Patient Name] → Patient Name
  const labelFromPlaceholder = (p: string) => p.replace(/^\[/, '').replace(/\]$/, '');

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('sendDialogTitle')}</DialogTitle>
          <DialogDescription>{t('sendDialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Placeholder inputs */}
          {placeholders.length > 0 && (
            <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground">{t('fillPlaceholders')}</p>
              {placeholders.map((placeholder) => (
                <div key={placeholder} className="space-y-2">
                  <label className="text-sm font-medium">{labelFromPlaceholder(placeholder)}</label>
                  <Input
                    placeholder={labelFromPlaceholder(placeholder)}
                    value={replacements[placeholder] || ''}
                    onChange={(e) => updateReplacement(placeholder, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Channel toggle */}
          <div className="flex gap-2">
            <Button
              variant={channel === 'email' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setChannel('email')}
            >
              <Mail className="h-4 w-4" />
              {t('channelEmail')}
            </Button>
            <Button
              variant={channel === 'sms' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 gap-2"
              onClick={() => setChannel('sms')}
            >
              <MessageSquare className="h-4 w-4" />
              {t('channelSms')}
            </Button>
            <Button
              variant={channel === 'whatsapp' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 gap-2"
              disabled={!whatsappEnabled}
              onClick={() => setChannel('whatsapp')}
            >
              <MessageSquare className="h-4 w-4" />
              {whatsappEnabled ? t('channelWhatsApp') : (
                <span className="flex items-center gap-1">
                  {t('channelWhatsApp')}
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {t('comingSoon')}
                  </Badge>
                </span>
              )}
            </Button>
          </div>

          {/* Recipient input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('recipientLabel')}</label>
            <Input
              type={channel === 'email' ? 'email' : 'tel'}
              placeholder={channel === 'email' ? 'patient@example.com' : '+49 174 ...'}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          {/* Live preview with replacements applied */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
            {finalMessage.split(/(\[[^\]]+\])/).map((part, i) =>
              part.match(/^\[.*\]$/) ? (
                <span key={i} className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded px-0.5">{part}</span>
              ) : (
                <span key={i} className="text-muted-foreground">{part}</span>
              ),
            )}
          </div>

          {/* Send */}
          <Button
            onClick={handleSend}
            disabled={!recipient.trim() || sending || hasUnfilledPlaceholders}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            {sending ? t('sending') : t('sendAction')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
