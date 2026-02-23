'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useVault } from '@/hooks/use-vault';
import {
  LayoutDashboard,
  FileSignature,
  User,
  Users,
  ScrollText,
  BarChart3,
  CreditCard,
  Settings,
  Lock,
  Shield,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: 'dashboard' | 'patients' | 'analytics' | 'team' | 'billing' | 'settings' | 'audit';
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  section: 'overview' | 'management' | 'system';
}

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ARZT', 'EMPFANG'], section: 'overview' },
  { href: '/patients', labelKey: 'patients', icon: User, roles: ['ADMIN', 'ARZT'], section: 'overview' },
  { href: '/analytics', labelKey: 'analytics', icon: BarChart3, roles: ['ADMIN', 'ARZT'], section: 'management' },
  { href: '/team', labelKey: 'team', icon: Users, roles: ['ADMIN'], section: 'management' },
  { href: '/audit', labelKey: 'audit', icon: ScrollText, roles: ['ADMIN'], section: 'management' },
  { href: '/billing', labelKey: 'billing', icon: CreditCard, roles: ['ADMIN'], section: 'system' },
  { href: '/settings', labelKey: 'settings', icon: Settings, roles: ['ADMIN'], section: 'system' },
];

const sections = ['overview', 'management', 'system'] as const;

export function Sidebar() {
  const t = useTranslations('nav');
  const tSidebar = useTranslations('sidebar');
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isUnlocked, autoLockRemaining, requestUnlock, lock } = useVault();
  const userRole = session?.user?.role || 'EMPFANG';

  const handleLock = () => {
    lock();
  };

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const itemsBySection = (section: string) =>
    filteredItems.filter((item) => item.section === section);

  return (
    <aside className="hidden md:flex md:w-[260px] md:flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-sidebar-foreground">
          <FileSignature className="h-5 w-5 text-sidebar-primary" />
          <span>DermaConsent</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Main navigation">
        {sections.map((section) => {
          const items = itemsBySection(section);
          if (items.length === 0) return null;
          return (
            <div key={section}>
              <div className="px-5 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                {tSidebar(section)}
              </div>
              <div className="space-y-0.5 px-2">
                {items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-2.5 rounded-md h-9 px-3 text-sm font-medium transition-default',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-primary'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-sidebar-primary" />
                      )}
                      <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-sidebar-primary' : 'text-muted-foreground')} />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Vault status footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        {isUnlocked ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-success shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-sidebar-foreground">{tSidebar('vaultActive')}</div>
                <div className="text-[11px] text-muted-foreground">
                  {autoLockRemaining != null
                    ? tSidebar('autoLockIn', { minutes: Math.ceil(autoLockRemaining / 60) })
                    : tSidebar('vaultActiveHint')}
                </div>
              </div>
            </div>
            <button
              onClick={handleLock}
              className="text-muted-foreground hover:text-foreground transition-default shrink-0"
              aria-label={tSidebar('lockVault')}
            >
              <Lock className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={requestUnlock}
            className="flex w-full items-center gap-2.5 rounded-md p-0 text-left transition-default hover:opacity-80"
          >
            <Lock className="h-4 w-4 text-warning shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-sidebar-foreground">{tSidebar('vaultLocked')}</div>
              <div className="text-[11px] text-muted-foreground">{tSidebar('vaultLockedHint')}</div>
            </div>
          </button>
        )}
      </div>

      {/* User profile footer */}
      {session?.user && (
        <div className="border-t border-sidebar-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-medium text-primary">
              {(session.user.name || session.user.email || '?')[0].toUpperCase()}
            </div>
            <span className="text-sm text-sidebar-foreground truncate">
              {session.user.name || session.user.email}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-muted-foreground hover:text-foreground transition-default shrink-0"
            aria-label={tSidebar('signOut')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
