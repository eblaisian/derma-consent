'use client';

import { usePathname } from 'next/navigation';
import { useRef, useEffect } from 'react';

/**
 * Wraps page content with a fade-in-up animation that re-triggers on route changes.
 * Uses CSS animations only — no framer-motion dependency.
 * Respects prefers-reduced-motion via the global CSS media query.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Only animate when the pathname actually changed (not on initial mount from HMR)
    if (prevPathRef.current !== pathname) {
      // Reset animation by removing and re-adding the class
      el.classList.remove('animate-page-enter');
      // Force reflow so the browser registers the removal
      void el.offsetHeight;
      el.classList.add('animate-page-enter');
      // Scroll to top of the main content area
      el.closest('main')?.scrollTo({ top: 0, behavior: 'instant' });
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  return (
    <div ref={ref} className="animate-page-enter">
      {children}
    </div>
  );
}
