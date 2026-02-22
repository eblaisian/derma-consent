'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import type { EncryptedPrivateKey } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface VaultPanelProps {
  encryptedPrivKey: EncryptedPrivateKey;
}

export function VaultPanel({ encryptedPrivKey }: VaultPanelProps) {
  const t = useTranslations('vault');
  const { isUnlocked, isLoading, unlock, lock, error } = useVault();
  const [password, setPassword] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    try {
      await unlock(encryptedPrivKey, password);
      setPassword('');
      toast.success(t('unlocked'));
    } catch {
      toast.error(t('wrongPassword'));
    }
  };

  const handleLock = () => {
    lock();
    toast.info(t('locked'));
  };

  if (isUnlocked) {
    return (
      <Card className="border-l-4 border-l-success">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            {t('unlockedTitle')}
          </CardTitle>
          <CardDescription>
            {t('unlockedDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleLock}>
            {t('lock')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-warning" />
          {t('lockedTitle')}
        </CardTitle>
        <CardDescription>
          {t('lockedDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUnlock} className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="vault-password" className="sr-only">
              {t('masterPassword')}
            </Label>
            <Input
              id="vault-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('masterPassword')}
              required
            />
          </div>
          <Button type="submit" disabled={isLoading || !password}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </span>
            ) : (
              t('unlock')
            )}
          </Button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-destructive">
            {t.has(error as keyof IntlMessages['vault']) ? t(error as keyof IntlMessages['vault']) : error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
