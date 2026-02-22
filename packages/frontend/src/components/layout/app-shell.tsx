'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Sidebar } from './sidebar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const tNav = useTranslations('nav');
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const mobileNavItems = [
    { href: '/dashboard', labelKey: 'dashboard' as const },
    { href: '/patients', labelKey: 'patients' as const },
    { href: '/analytics', labelKey: 'analytics' as const },
    { href: '/team', labelKey: 'team' as const },
    { href: '/billing', labelKey: 'billing' as const },
    { href: '/settings', labelKey: 'settings' as const },
    { href: '/audit', labelKey: 'audit' as const },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-foreground md:hidden">DermaConsent</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav className="border-b bg-background p-2 md:hidden">
            <div className="flex flex-wrap gap-1">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm',
                    pathname.startsWith(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  {tNav(item.labelKey)}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
