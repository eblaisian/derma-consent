'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { usePractice } from '@/hooks/use-practice';
import { API_URL, createAuthFetcher } from '@/lib/api';
import type { ConsentFormSummary } from '@/lib/types';
import { NewConsentDialog } from '@/components/dashboard/new-consent-dialog';
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist';
import { WelcomeModal } from '@/components/dashboard/welcome-modal';
import { ConsentTable } from '@/components/dashboard/consent-table';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useVault } from '@/hooks/use-vault';
import { FileSignature, Clock, CheckCircle, User, AlertCircle, Building2, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const { data: session } = useSession();
  const { practiceId, practice, isLoading: practiceLoading } = usePractice();
  const { requestUnlock } = useVault();
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

  const [welcomeOpen, setWelcomeOpen] = useState(() =>
    typeof window !== 'undefined' ? !localStorage.getItem('welcome-modal-dismissed') : false
  );

  const dismissOnboarding = () => {
    localStorage.setItem('onboarding-complete', 'true');
    setOnboardingDismissed(true);
  };

  // If an ADMIN user doesn't have a practice yet, redirect to setup to create one.
  // Non-admin users without a practice (e.g. removed team members) should NOT see setup —
  // they need to accept a new invite instead.
  // PLATFORM_ADMIN redirect to /admin is handled by middleware.
  const needsSetup = !practiceLoading && !practiceId && !!session
    && session?.user?.role === 'ADMIN';
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

  // No practice: either redirect ADMIN to setup, or show guidance for non-admins
  if (!practiceId && !practiceLoading) {
    if (needsSetup) {
      return null; // useEffect will redirect to /setup
    }
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
            <Building2 className="size-7 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">{t('noPracticeTitle')}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('noPracticeDescription')}
            </p>
          </div>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="mr-2 size-4" />
            {t('noPracticeSignOut')}
          </Button>
        </div>
      </div>
    );
  }

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || '';

  const teamCount = Array.isArray(teamData) ? teamData.length : 0;

  return (
    <div className="space-y-8">
      {isAdmin && welcomeOpen && !practiceLoading && (
        <WelcomeModal
          open={welcomeOpen}
          onOpenChange={(open) => {
            if (!open) {
              localStorage.setItem('welcome-modal-dismissed', 'true');
              setWelcomeOpen(false);
            }
          }}
          onCreateConsent={() => {
            localStorage.setItem('welcome-modal-dismissed', 'true');
            setWelcomeOpen(false);
          }}
        />
      )}

      {/* Onboarding checklist for admins */}
      {isAdmin && !onboardingDismissed && !consentsLoading && (
        <OnboardingChecklist
          hasConsents={(consents?.length ?? 0) > 0}
          teamCount={teamCount}
          hasLogo={!!settingsData?.logoUrl}
          hasKeypair={!!practice?.publicKey}
          onDismiss={dismissOnboarding}
          onVaultSetup={() => requestUnlock()}
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

      {/* Needs Attention — compact action strip */}
      {!consentsLoading && stats && (stats.pending > 0 || stats.expiringSoon > 0 || stats.recentlySigned > 0) && (
        <div className="flex flex-wrap items-center gap-2" role="status" aria-label="Items needing attention">
          <span className="text-xs font-medium text-muted-foreground mr-1">{t('needsAttentionTitle')}:</span>
          {stats.expiringSoon > 0 && (
            <button
              onClick={() => setStatusFilter('PENDING')}
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/[0.05] px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-destructive/[0.10]"
            >
              <AlertCircle className="size-3.5 text-destructive" />
              <span className="font-semibold tabular-nums text-destructive">{stats.expiringSoon}</span>
              <span className="text-destructive/80">{t('chipExpiringSoonLabel')}</span>
            </button>
          )}
          {stats.pending > 0 && (
            <button
              onClick={() => setStatusFilter('PENDING')}
              className="inline-flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/[0.05] px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-warning/[0.10]"
            >
              <Clock className="size-3.5 text-warning" />
              <span className="font-semibold tabular-nums text-warning">{stats.pending}</span>
              <span className="text-foreground/70">{t('chipPendingLabel')}</span>
            </button>
          )}
          {stats.recentlySigned > 0 && (
            <button
              onClick={() => setStatusFilter('SIGNED')}
              className="inline-flex items-center gap-2 rounded-lg border border-success/20 bg-success/[0.05] px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-success/[0.10]"
            >
              <CheckCircle className="size-3.5 text-success" />
              <span className="font-semibold tabular-nums text-success">{stats.recentlySigned}</span>
              <span className="text-foreground/70">{t('chipRecentlySignedLabel')}</span>
            </button>
          )}
        </div>
      )}

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

      {/* Consent table in a raised surface */}
      <div className="rounded-xl border border-border/50 bg-card shadow-[var(--shadow-sm)] px-6 py-5 overflow-visible">
        <h2 className="text-lg font-semibold mb-5">{t('recentConsents')}</h2>
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
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        )}
      </div>

    </div>
  );
}
