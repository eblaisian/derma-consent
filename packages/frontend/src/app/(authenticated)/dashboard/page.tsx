'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { usePractice } from '@/hooks/use-practice';
import { useVault } from '@/hooks/use-vault';
import { API_URL, createAuthFetcher } from '@/lib/api';
import type { ConsentFormSummary } from '@/lib/types';
import type { EncryptedPrivateKey } from '@/lib/crypto';
import { NewConsentDialog } from '@/components/dashboard/new-consent-dialog';
import { ConsentTable } from '@/components/dashboard/consent-table';
import { VaultPanel } from '@/components/dashboard/vault-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { data: session } = useSession();
  const { practiceId, practice, isLoading: practiceLoading } = usePractice();
  const { isUnlocked } = useVault();

  const {
    data: consentsData,
    isLoading: consentsLoading,
    mutate: refreshConsents,
  } = useSWR<{ items: ConsentFormSummary[] }>(
    practiceId && session?.accessToken
      ? `${API_URL}/api/consent/practice`
      : null,
    createAuthFetcher(session?.accessToken),
  );
  const consents = consentsData?.items;

  // If user doesn't have a practice yet, redirect to setup
  const needsSetup = !practiceLoading && !practiceId && !!session;
  useEffect(() => {
    if (needsSetup) {
      router.push('/setup');
    }
  }, [needsSetup, router]);

  if (needsSetup || practiceLoading || !practiceId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">
            {practice?.name || 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground">{t('title')}</p>
        </div>
        <NewConsentDialog onCreated={() => refreshConsents()} />
      </div>

      <Tabs defaultValue="consents">
        <TabsList>
          <TabsTrigger value="consents">{t('consentsTab')}</TabsTrigger>
          <TabsTrigger value="vault">{t('vaultTab')}</TabsTrigger>
        </TabsList>

        <Separator className="my-4" />

        <TabsContent value="consents">
          {consentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <ConsentTable
              consents={consents || []}
              isVaultUnlocked={isUnlocked}
              onRefresh={() => refreshConsents()}
            />
          )}
        </TabsContent>

        <TabsContent value="vault">
          {practice?.encryptedPrivKey ? (
            <VaultPanel
              encryptedPrivKey={practice.encryptedPrivKey as unknown as EncryptedPrivateKey}
            />
          ) : (
            <p className="text-muted-foreground">
              {t('encryptionUnavailable')}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
