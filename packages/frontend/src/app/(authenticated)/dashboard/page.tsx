'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { usePractice } from '@/hooks/use-practice';
import { API_URL, createAuthFetcher } from '@/lib/api';
import type { ConsentFormSummary } from '@/lib/types';
import { NewConsentDialog } from '@/components/dashboard/new-consent-dialog';
import { OnboardingModal } from '@/components/dashboard/onboarding-modal';
import { ConsentTable } from '@/components/dashboard/consent-table';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSignature, Clock, CheckCircle, User } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { data: session } = useSession();
  const { practiceId, practice, isLoading: practiceLoading } = usePractice();
  const [showNewConsent, setShowNewConsent] = useState(false);

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

  const { data: patientsData } = useSWR<{ total: number }>(
    practiceId && session?.accessToken
      ? `${API_URL}/api/patients?page=1&limit=1`
      : null,
    createAuthFetcher(session?.accessToken),
  );

  // If user doesn't have a practice yet, redirect to setup (unless platform admin)
  const isPlatformAdmin = session?.user?.role === 'PLATFORM_ADMIN';
  const needsSetup = !practiceLoading && !practiceId && !!session && !isPlatformAdmin;
  useEffect(() => {
    if (isPlatformAdmin) {
      router.push('/admin');
    } else if (needsSetup) {
      router.push('/setup');
    }
  }, [needsSetup, isPlatformAdmin, router]);

  const showOnboarding =
    !consentsLoading &&
    consents !== undefined &&
    consents.length === 0 &&
    typeof window !== 'undefined' &&
    !localStorage.getItem('onboarding-dismissed');

  const dismissOnboarding = () => {
    localStorage.setItem('onboarding-dismissed', 'true');
  };

  // Compute stats
  const stats = useMemo(() => {
    if (!consents) return null;
    const total = consents.length;
    const pending = consents.filter(c => c.status === 'PENDING').length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = consents.filter(
      c => c.status === 'COMPLETED' && new Date(c.createdAt) >= monthStart
    ).length;
    return { total, pending, completedThisMonth };
  }, [consents]);

  if (needsSetup || practiceLoading || !practiceId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || '';

  return (
    <div className="space-y-8">
      {/* Welcome banner with subtle gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-background to-primary/[0.02] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title">
              {t('title')}
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary leading-relaxed">
              {t('welcomeBack', { name: userName })}
            </p>
          </div>
          <NewConsentDialog onCreated={() => refreshConsents()} />
        </div>
        {/* Decorative gradient accent */}
        <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />
      </div>

      {/* Stat cards with stagger animation */}
      {consentsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          <StatCard
            title={t('statTotal')}
            value={stats.total}
            icon={<FileSignature className="h-4 w-4" />}
          />
          <StatCard
            title={t('statPending')}
            value={stats.pending}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            title={t('statCompleted')}
            value={stats.completedThisMonth}
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <StatCard
            title={t('statPatients')}
            value={patientsData?.total ?? 0}
            icon={<User className="h-4 w-4" />}
          />
        </div>
      )}

      {/* Consent table in a raised surface */}
      <div className="surface-raised p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-section-head">{t('recentConsents')}</h2>
        </div>
        {consentsLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <ConsentTable
            consents={consents || []}
            onRefresh={() => refreshConsents()}
            onCreateConsent={() => setShowNewConsent(true)}
          />
        )}
      </div>

      {showOnboarding && (
        <OnboardingModal
          open={true}
          onClose={dismissOnboarding}
          onCreateConsent={() => {
            dismissOnboarding();
            setShowNewConsent(true);
          }}
        />
      )}
    </div>
  );
}
