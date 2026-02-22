'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { API_URL, createAuthFetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, ShieldOff } from 'lucide-react';

interface TwoFactorStatus {
  twoFactorEnabled: boolean;
}

export function TwoFactorSetup() {
  const t = useTranslations('twoFactor');
  const { data: session } = useSession();
  const authFetch = useAuthFetch();
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: status, mutate } = useSWR<TwoFactorStatus>(
    session?.accessToken ? `${API_URL}/api/auth/2fa/status` : null,
    createAuthFetcher(session?.accessToken),
  );

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const data = await authFetch('/api/auth/2fa/setup', { method: 'POST' });
      setSetupData(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('setupError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!code || code.length !== 6) return;
    setIsLoading(true);
    try {
      await authFetch('/api/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ token: code }),
      });
      toast.success(t('enabled'));
      setSetupData(null);
      setCode('');
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('invalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length !== 6) return;
    setIsLoading(true);
    try {
      await authFetch('/api/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ token: disableCode }),
      });
      toast.success(t('disabled'));
      setDisableCode('');
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('invalidCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const isEnabled = status?.twoFactorEnabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? (
            <Shield className="h-5 w-5 text-success" />
          ) : (
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
          )}
          {t('title')}
        </CardTitle>
        <CardDescription>
          {isEnabled ? t('enabledDescription') : t('disabledDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEnabled && !setupData && (
          <Button onClick={handleSetup} disabled={isLoading}>
            {isLoading ? t('settingUp') : t('setup')}
          </Button>
        )}

        {!isEnabled && setupData && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('scanQrCode')}</p>
            <div className="flex justify-center">
              <img
                src={setupData.qrCodeDataUrl}
                alt={t('qrCodeAlt')}
                className="h-48 w-48 rounded-lg border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('manualEntry')}</Label>
              <code className="block rounded bg-muted p-2 text-xs break-all font-mono">
                {setupData.secret}
              </code>
            </div>
            <div className="space-y-2">
              <Label>{t('verificationCode')}</Label>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-32 font-mono text-center text-lg tracking-widest"
                />
                <Button onClick={handleEnable} disabled={isLoading || code.length !== 6}>
                  {t('verify')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {isEnabled && (
          <div className="space-y-2">
            <Label>{t('disableLabel')}</Label>
            <p className="text-sm text-muted-foreground">{t('disableHint')}</p>
            <div className="flex gap-2">
              <Input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-32 font-mono text-center text-lg tracking-widest"
              />
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={isLoading || disableCode.length !== 6}
              >
                {t('disable')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
