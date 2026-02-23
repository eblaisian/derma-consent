'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Menu, X, Shield } from 'lucide-react';
import { AdminSidebar, adminNavItems } from '@/components/layout/admin-sidebar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('admin');
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'PLATFORM_ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!session || session.user?.role !== 'PLATFORM_ADMIN') return null;

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-4">
          {/* Mobile: hamburger + branding */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-mobile-nav"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <Link href="/admin" className="flex items-center gap-2 font-semibold text-foreground">
              <Shield className="h-4 w-4 text-violet-500" />
              <span className="text-sm">DermaConsent</span>
              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                {t('adminBadge')}
              </span>
            </Link>
          </div>

          {/* Desktop: spacer so right-side items stay right-aligned */}
          <div className="hidden md:block" />

          {/* Right-side controls (always visible) */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>

        {/* Mobile navigation overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            {/* Nav panel */}
            <nav
              id="admin-mobile-nav"
              className="fixed top-14 inset-x-0 z-50 border-b bg-card shadow-[var(--shadow-lg)] p-3 md:hidden animate-slide-in-down"
              role="navigation"
              aria-label="Admin mobile navigation"
            >
              <div className="flex flex-col gap-0.5">
                {adminNavItems.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-default',
                        isActive
                          ? 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                          : 'text-foreground hover:bg-muted',
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-violet-500' : 'text-muted-foreground')} />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
