'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-filled email address */
  defaultEmail?: string;
  /** Title shown in the dialog header */
  title?: string;
  /** Description shown below the title */
  description?: string;
  /** Whether the send is in progress (controlled externally) */
  loading?: boolean;
  /** Called when user confirms send */
  onSend: (email: string) => void | Promise<void>;
}

export function SendMessageDialog({
  open,
  onOpenChange,
  defaultEmail = '',
  title,
  description,
  loading = false,
  onSend,
}: SendMessageDialogProps) {
  const t = useTranslations('sendDialog');
  const [email, setEmail] = useState(defaultEmail);

  // Sync defaultEmail when it changes (e.g., from vault decrypt)
  if (defaultEmail && !email) setEmail(defaultEmail);

  const handleSend = async () => {
    if (!email.trim()) return;
    await onSend(email.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title || t('title')}</DialogTitle>
          <DialogDescription>{description || t('description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="send-msg-email" className="text-sm">{t('emailLabel')}</Label>
            <Input
              id="send-msg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@example.com"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button size="sm" onClick={handleSend} disabled={loading || !email.trim()}>
              {loading ? (
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="size-3.5 mr-1.5" />
              )}
              {t('send')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
