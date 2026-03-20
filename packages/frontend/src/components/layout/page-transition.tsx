'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Wraps page content with a fade-in-up animation that re-triggers on route changes.
 * Uses key={pathname} to force React to remount the wrapper on navigation,
 * which naturally re-triggers the CSS animation.
 * Respects prefers-reduced-motion via the global CSS media query.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLDivElement>(null);

  // Scroll main content area to top on route change
  useEffect(() => {
    mainRef.current?.closest('main')?.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div
      ref={mainRef}
      key={pathname}
      className="animate-fade-in-up"
    >
      {children}
    </div>
  );
}
