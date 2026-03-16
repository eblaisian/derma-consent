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
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist';
import { ConsentTable } from '@/components/dashboard/consent-table';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileSignature, Clock, CheckCircle, User, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { data: session } = useSession();
  const { practiceId, practice, isLoading: practiceLoading } = usePractice();
  const [statusFilter, setStatusFilter] = useState('ALL');

  const isAdmin = session?.user?.role === 'ADMIN';
  const isAdminOrDoctor = isAdmin || session?.user?.role === 'ARZT';
  const canViewConsents = isAdminOrDoctor || session?.user?.role === 'EMPFANG';

  const {
    data: consentsData,
    isLoading: consentsLoading,
    mutate: refreshConsents,
  } = useSWR<{ items: ConsentFormSummary[] }>(
    canViewConsents && practiceId && session?.accessToken
      ? `${API_URL}/api/consent/practice`
      : null,
    createAuthFetcher(session?.accessToken),
  );
  const consents = consentsData?.items;

  const { data: patientsData } = useSWR<{ total: number }>(
    canViewConsents && practiceId && session?.accessToken
      ? `${API_URL}/api/patients?page=1&limit=1`
      : null,
    createAuthFetcher(session?.accessToken),
  );

  const { data: settingsData } = useSWR<{ logoUrl?: string }>(
    isAdmin && practiceId && session?.accessToken
      ? `${API_URL}/api/settings`
      : null,
    createAuthFetcher(session?.accessToken),
  );

  const { data: teamData } = useSWR<{ length: number } | Array<unknown>>(
    isAdmin && practiceId && session?.accessToken
      ? `${API_URL}/api/team/members`
      : null,
    createAuthFetcher(session?.accessToken),
  );

  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('onboarding-complete') === 'true' : false
  );

  const dismissOnboarding = () => {
    localStorage.setItem('onboarding-complete', 'true');
    setOnboardingDismissed(true);
  };

  // If user doesn't have a practice yet, redirect to setup
  // Note: PLATFORM_ADMIN redirect to /admin is handled by middleware
  const needsSetup = !practiceLoading && !practiceId && !!session && session?.user?.role !== 'PLATFORM_ADMIN';
  useEffect(() => {
    if (needsSetup) {
      router.push('/setup');
    }
  }, [needsSetup, router]);

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
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);
    const expiringSoon = consents.filter(
      c => c.status === 'PENDING' && new Date(c.expiresAt) <= sevenDaysFromNow
    ).length;
    const recentlySigned = consents.filter(
      c => c.status === 'SIGNED' && c.signatureTimestamp && (now.getTime() - new Date(c.signatureTimestamp).getTime()) < 86400000
    ).length;
    return { total, pending, completedThisMonth, expiringSoon, recentlySigned };
  }, [consents]);

  if (needsSetup || practiceLoading || !practiceId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || '';

  const teamCount = Array.isArray(teamData) ? teamData.length : 0;

  return (
    <div className="space-y-8">
      {/* Onboarding checklist for admins */}
      {isAdmin && !onboardingDismissed && !consentsLoading && (
        <OnboardingChecklist
          hasConsents={(consents?.length ?? 0) > 0}
          teamCount={teamCount}
          hasLogo={!!settingsData?.logoUrl}
          hasKeypair={!!practice?.publicKey}
          onDismiss={dismissOnboarding}
        />
      )}

      {/* Welcome banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title font-display font-light text-balance">{t('title')}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed text-pretty">
            {t('welcomeBack', { name: userName })}
          </p>
        </div>
        {canViewConsents && <NewConsentDialog onCreated={() => refreshConsents()} />}
      </div>

      {/* Stat cards with stagger animation */}
      {consentsLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger-children">
          <StatCard
            title={t('statTotal')}
            value={stats.total}
            icon={<FileSignature className="size-4" />}
            accent="primary"
          />
          <StatCard
            title={t('statPending')}
            value={stats.pending}
            icon={<Clock className="size-4" />}
            accent="warning"
          />
          <StatCard
            title={t('statCompleted')}
            value={stats.completedThisMonth}
            icon={<CheckCircle className="size-4" />}
            accent="success"
          />
          <StatCard
            title={t('statPatients')}
            value={patientsData?.total ?? 0}
            icon={<User className="size-4" />}
            accent="info"
          />
        </div>
      )}

      {/* Needs Attention */}
      {stats && (stats.pending > 0 || stats.expiringSoon > 0 || stats.recentlySigned > 0) && (
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.pending > 0 && (
            <button
              onClick={() => setStatusFilter('PENDING')}
              className="group flex items-center gap-3 rounded-xl border border-border/50 border-l-2 border-l-warning bg-card px-4 py-3 text-start shadow-[var(--shadow-sm)] cursor-pointer transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-warning/30 hover:border-l-warning"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/[0.06]">
                <Clock className="size-4 text-warning transition-transform duration-150 group-hover:scale-110" />
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">{t('chipPendingLabel')}</p>
              </div>
            </button>
          )}
          {stats.expiringSoon > 0 && (
            <button
              onClick={() => setStatusFilter('PENDING')}
              className="group flex items-center gap-3 rounded-xl border border-border/50 border-l-2 border-l-destructive bg-card px-4 py-3 text-start shadow-[var(--shadow-sm)] cursor-pointer transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-destructive/30 hover:border-l-destructive"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/[0.06]">
                <AlertCircle className="size-4 text-destructive transition-transform duration-150 group-hover:scale-110" />
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">{stats.expiringSoon}</p>
                <p className="text-xs text-muted-foreground">{t('chipExpiringSoonLabel')}</p>
              </div>
            </button>
          )}
          {stats.recentlySigned > 0 && (
            <button
              onClick={() => setStatusFilter('SIGNED')}
              className="group flex items-center gap-3 rounded-xl border border-border/50 border-l-2 border-l-success bg-card px-4 py-3 text-start shadow-[var(--shadow-sm)] cursor-pointer transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-success/30 hover:border-l-success"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/[0.06]">
                <CheckCircle className="size-4 text-success transition-transform duration-150 group-hover:scale-110" />
              </div>
              <div>
                <p className="text-xl font-semibold tabular-nums">{stats.recentlySigned}</p>
                <p className="text-xs text-muted-foreground">{t('chipRecentlySignedLabel')}</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Consent table in a raised surface */}
      <div className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)]">
        <div className="px-6 pt-5 pb-4">
          <h2 className="text-lg font-semibold">{t('recentConsents')}</h2>
        </div>
        {consentsLoading ? (
          <div className="space-y-3 px-6 pb-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="px-6 pb-6 overflow-x-auto">
            <ConsentTable
              consents={consents || []}
              onRefresh={() => refreshConsents()}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>
        )}
      </div>

    </div>
  );
}
