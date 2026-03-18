'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { API_URL, fetcher } from '@/lib/api';
import { useAuthFetch } from '@/lib/auth-fetch';
import Link from 'next/link';
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
  const { data: session, update: updateSession } = useSession();
  const authFetch = useAuthFetch();
  const [isAccepting, setIsAccepting] = useState(false);

  const { data: invite, error } = useSWR(
    token ? `${API_URL}/api/team/invite/${token}` : null,
    fetcher,
  );

  const inviteCallbackUrl = `/invite/${token}`;

  const handleSignIn = () => {
    signIn(undefined, { callbackUrl: inviteCallbackUrl });
  };

  const handleAccept = async () => {
    if (!session) {
      handleSignIn();
      return;
    }

    setIsAccepting(true);
    try {
      const result = await authFetch(`/api/team/invite/${token}/accept`, { method: 'POST' });

      // Refresh the backend JWT so it includes the newly assigned practiceId and role,
      // then propagate those values into the NextAuth session. Without this the dashboard
      // sees practiceId: null in the session and immediately redirects back to /setup.
      let newAccessToken: string | undefined;
      try {
        const refreshed = await authFetch('/api/auth/refresh-token', { method: 'POST' });
        newAccessToken = refreshed.accessToken;
      } catch {
        // Token refresh failed — session will have stale practiceId. User will need to
        // re-login. This is an edge case; the invite itself was accepted successfully.
      }

      await updateSession({
        practiceId: result.practiceId,
        ...(newAccessToken && { accessToken: newAccessToken }),
      });

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
      <div className="flex min-h-dvh items-center justify-center p-4">
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
      <div className="flex items-center justify-center min-h-dvh">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
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
          {!session && (
            <p className="text-center text-sm text-muted-foreground">
              {t('noAccount')}{' '}
              <Link
                href={`/register?callbackUrl=${encodeURIComponent(inviteCallbackUrl)}&email=${encodeURIComponent(invite.email)}`}
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {t('createAccount')}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
