'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { API_URL, fetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState } from 'react';

export default function InvitePage() {
  const t = useTranslations('invite');
  const tRoles = useTranslations('roles');
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const authFetch = useAuthFetch();
  const [isAccepting, setIsAccepting] = useState(false);

  const { data: invite, error } = useSWR(
    token ? `${API_URL}/api/team/invite/${token}` : null,
    fetcher,
  );

  const handleAccept = async () => {
    if (!session) {
      signIn(undefined, { callbackUrl: `/invite/${token}` });
      return;
    }

    setIsAccepting(true);
    try {
      await authFetch(`/api/team/invite/${token}/accept`, { method: 'POST' });
      toast.success(t('accepted'));
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('acceptError'));
    } finally {
      setIsAccepting(false);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('invalidTitle')}</CardTitle>
            <CardDescription>
              {t('invalidDescription')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('practice')}</p>
            <p className="font-medium">{invite.practice?.name}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('role')}</p>
            <Badge>{tRoles(invite.role as 'ADMIN' | 'ARZT' | 'EMPFANG')}</Badge>
          </div>
          <Button className="w-full" onClick={handleAccept} disabled={isAccepting}>
            {!session
              ? t('signInAndAccept')
              : isAccepting
                ? t('accepting')
                : t('accept')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
