'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Building2,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminNavItem {
  href: string;
  labelKey: 'dashboard' | 'practices' | 'configuration';
  icon: React.ComponentType<{ className?: string }>;
}

export const adminNavItems: AdminNavItem[] = [
  { href: '/admin', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/practices', labelKey: 'practices', icon: Building2 },
  { href: '/admin/config', labelKey: 'configuration', icon: Settings },
];

export function AdminSidebar() {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="hidden md:flex md:w-[260px] md:flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <Link href="/admin" className="flex items-center gap-2.5 font-semibold text-sidebar-foreground">
          <Shield className="h-5 w-5 text-violet-500" />
          <span>DermaConsent</span>
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700 dark:bg-violet-900 dark:text-violet-300">
            {t('adminBadge')}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Admin navigation">
        <div className="space-y-0.5 px-2 pt-3">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-md h-9 px-3 text-sm font-medium transition-default',
                  isActive
                    ? 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                {isActive && (
                  <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-violet-500" />
                )}
                <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-violet-500' : 'text-muted-foreground')} />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User profile footer */}
      {session?.user && (
        <div className="border-t border-sidebar-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-700 dark:bg-violet-900 dark:text-violet-300">
              {(session.user.name || session.user.email || '?')[0].toUpperCase()}
            </div>
            <span className="text-sm text-sidebar-foreground truncate">
              {session.user.name || session.user.email}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-muted-foreground hover:text-foreground transition-default shrink-0"
            aria-label={t('signOut')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
}
