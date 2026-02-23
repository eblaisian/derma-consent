'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import { usePractice } from '@/hooks/use-practice';
import type { EncryptedPrivateKey } from '@/lib/crypto';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function VaultUnlockModal() {
  const t = useTranslations('vault');
  const { isUnlocked, isLoading, isModalOpen, closeModal, unlock, lock, error } = useVault();
  const { practice } = usePractice();
  const [password, setPassword] = useState('');
  const [shaking, setShaking] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isModalOpen && !isUnlocked) {
      // Small delay to wait for dialog animation
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, isUnlocked]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setPassword('');
      setShaking(false);
      setSuccess(false);
    }
  }, [isModalOpen]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !practice?.encryptedPrivKey) return;

    try {
      await unlock(
        practice.encryptedPrivKey as unknown as EncryptedPrivateKey,
        password,
      );
      setPassword('');
      setSuccess(true);
      toast.success(t('unlockSuccess'));
      // Auto-close after brief success animation
      setTimeout(() => {
        closeModal();
        setSuccess(false);
      }, 500);
    } catch {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  const handleLock = () => {
    lock();
    toast.info(t('locked'));
    closeModal();
  };

  if (!practice?.encryptedPrivKey) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md">
        {isUnlocked && !success ? (
          // Already unlocked — show status + lock button
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <DialogTitle className="text-center">{t('unlockedTitle')}</DialogTitle>
              <DialogDescription className="text-center">
                {t('unlockedDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLock}>
                <Lock className="mr-2 h-4 w-4" />
                {t('lock')}
              </Button>
            </div>
          </>
        ) : (
          // Locked — show unlock form
          <>
            <DialogHeader>
              <div
                className={cn(
                  'mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300',
                  success
                    ? 'bg-success-subtle animate-vault-success'
                    : 'bg-primary-subtle',
                )}
              >
                {success ? (
                  <Shield className="h-6 w-6 text-success" />
                ) : (
                  <Shield className="h-6 w-6 text-primary" />
                )}
              </div>
              <DialogTitle className="text-center">{t('modalTitle')}</DialogTitle>
              <DialogDescription className="text-center">
                {t('modalDescription')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUnlock} className={cn(shaking && 'animate-shake')}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vault-modal-password" className="sr-only">
                    {t('masterPassword')}
                  </Label>
                  <Input
                    ref={inputRef}
                    id="vault-modal-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('masterPassword')}
                    disabled={isLoading || success}
                    autoComplete="current-password"
                  />
                  {error && !success && (
                    <p className="text-sm text-destructive">
                      {t('wrongPassword')}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !password || success}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </span>
                  ) : (
                    t('unlock')
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {t('keyboardShortcut')}
                </p>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
