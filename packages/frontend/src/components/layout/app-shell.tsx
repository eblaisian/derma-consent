'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { VaultProvider } from '@/contexts/vault-context';
import { VaultUnlockModal } from '@/components/vault/vault-unlock-modal';
import { VaultStatusButton } from '@/components/vault/vault-status-button';
import { Sidebar } from './sidebar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  LayoutDashboard,
  User,
  BarChart3,
  Users,
  ScrollText,
  CreditCard,
  Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { href: '/dashboard', labelKey: 'dashboard' as const, icon: LayoutDashboard },
  { href: '/patients', labelKey: 'patients' as const, icon: User },
  { href: '/analytics', labelKey: 'analytics' as const, icon: BarChart3 },
  { href: '/team', labelKey: 'team' as const, icon: Users },
  { href: '/billing', labelKey: 'billing' as const, icon: CreditCard },
  { href: '/settings', labelKey: 'settings' as const, icon: Settings },
  { href: '/audit', labelKey: 'audit' as const, icon: ScrollText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const tNav = useTranslations('nav');
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <VaultProvider>
    <div className="flex h-screen">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to content
      </a>

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
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <span className="text-sm font-medium text-foreground md:hidden">DermaConsent</span>
          </div>

          <div className="flex items-center gap-2">
            <VaultStatusButton />
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Mobile navigation with backdrop and slide animation */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            {/* Nav panel */}
            <nav
              id="mobile-nav"
              className="fixed top-14 inset-x-0 z-50 border-b bg-card shadow-[var(--shadow-lg)] p-3 md:hidden animate-slide-in-down"
              role="navigation"
              aria-label="Mobile navigation"
            >
              <div className="flex flex-col gap-0.5">
                {mobileNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-default',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted',
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {tNav(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </>
        )}

        {/* Main content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>

      <VaultUnlockModal />
    </div>
    </VaultProvider>
  );
}
