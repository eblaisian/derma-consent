'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  UserCog,
  CreditCard,
  Settings,
  ClipboardList,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: 'dashboard' | 'patients' | 'analytics' | 'team' | 'billing' | 'settings' | 'audit';
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ARZT', 'EMPFANG'] },
  { href: '/patients', labelKey: 'patients', icon: Stethoscope, roles: ['ADMIN', 'ARZT'] },
  { href: '/analytics', labelKey: 'analytics', icon: BarChart3, roles: ['ADMIN', 'ARZT'] },
  { href: '/team', labelKey: 'team', icon: Users, roles: ['ADMIN'] },
  { href: '/billing', labelKey: 'billing', icon: CreditCard, roles: ['ADMIN'] },
  { href: '/settings', labelKey: 'settings', icon: Settings, roles: ['ADMIN'] },
  { href: '/audit', labelKey: 'audit', icon: ClipboardList, roles: ['ADMIN'] },
];

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'EMPFANG';

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-muted/30">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <UserCog className="h-5 w-5" />
          <span>DermaConsent</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
