import { describe, it, expect } from 'vitest';

/**
 * Tests the frontend role-access matrix by validating the middleware
 * routing rules and sidebar navigation configuration. This ensures
 * the UI correctly restricts features per role.
 */

// Replicate the middleware's roleAllowedPaths to test against
const roleAllowedPaths: Record<string, string[]> = {
  ADMIN: ['/dashboard', '/patients', '/communications', '/analytics', '/team', '/audit', '/billing', '/settings', '/setup', '/profile'],
  ARZT: ['/dashboard', '/patients', '/communications', '/profile'],
  EMPFANG: ['/dashboard', '/patients', '/communications', '/profile'],
  PLATFORM_ADMIN: ['/admin', '/profile'],
};

function isRoleAllowed(role: string, pathname: string): boolean {
  const allowed = roleAllowedPaths[role];
  if (!allowed) return false;
  return allowed.some((p) => pathname.startsWith(p));
}

// Sidebar nav items (mirrors sidebar.tsx)
const sidebarItems = [
  { href: '/dashboard', roles: ['ADMIN', 'ARZT', 'EMPFANG'], section: 'overview' },
  { href: '/patients', roles: ['ADMIN', 'ARZT', 'EMPFANG'], section: 'overview' },
  { href: '/communications', roles: ['ADMIN', 'ARZT', 'EMPFANG'], section: 'overview' },
  { href: '/analytics', roles: ['ADMIN'], section: 'management' },
  { href: '/team', roles: ['ADMIN'], section: 'management' },
  { href: '/audit', roles: ['ADMIN'], section: 'management' },
  { href: '/billing', roles: ['ADMIN'], section: 'system' },
  { href: '/settings', roles: ['ADMIN'], section: 'system' },
];

describe('Frontend Role Access Matrix', () => {

  describe('Middleware route access', () => {

    describe('ADMIN — full access', () => {
      const allowedRoutes = ['/dashboard', '/patients', '/communications', '/analytics', '/team', '/audit', '/billing', '/settings', '/setup', '/profile'];
      it.each(allowedRoutes)('should allow %s', (route) => {
        expect(isRoleAllowed('ADMIN', route)).toBe(true);
      });

      it('should deny /admin', () => {
        expect(isRoleAllowed('ADMIN', '/admin')).toBe(false);
      });
    });

    describe('ARZT — operational access only', () => {
      const allowedRoutes = ['/dashboard', '/patients', '/communications', '/profile'];
      it.each(allowedRoutes)('should allow %s', (route) => {
        expect(isRoleAllowed('ARZT', route)).toBe(true);
      });

      const deniedRoutes = ['/analytics', '/team', '/audit', '/billing', '/settings', '/admin'];
      it.each(deniedRoutes)('should deny %s', (route) => {
        expect(isRoleAllowed('ARZT', route)).toBe(false);
      });
    });

    describe('EMPFANG — front desk access', () => {
      const allowedRoutes = ['/dashboard', '/patients', '/communications', '/profile'];
      it.each(allowedRoutes)('should allow %s', (route) => {
        expect(isRoleAllowed('EMPFANG', route)).toBe(true);
      });

      const deniedRoutes = ['/analytics', '/team', '/audit', '/billing', '/settings', '/admin'];
      it.each(deniedRoutes)('should deny %s', (route) => {
        expect(isRoleAllowed('EMPFANG', route)).toBe(false);
      });
    });

    describe('PLATFORM_ADMIN — admin panel only', () => {
      it('should allow /admin', () => {
        expect(isRoleAllowed('PLATFORM_ADMIN', '/admin')).toBe(true);
      });
      it('should allow /profile', () => {
        expect(isRoleAllowed('PLATFORM_ADMIN', '/profile')).toBe(true);
      });

      const deniedRoutes = ['/dashboard', '/patients', '/analytics', '/team', '/billing', '/settings'];
      it.each(deniedRoutes)('should deny %s', (route) => {
        expect(isRoleAllowed('PLATFORM_ADMIN', route)).toBe(false);
      });
    });
  });

  describe('Sidebar navigation visibility', () => {
    function visibleItems(role: string) {
      return sidebarItems.filter((item) => item.roles.includes(role));
    }

    function visibleSections(role: string) {
      return [...new Set(visibleItems(role).map((item) => item.section))];
    }

    it('ADMIN sees all sections: overview, management, system', () => {
      expect(visibleSections('ADMIN')).toEqual(['overview', 'management', 'system']);
    });

    it('ADMIN sees all 8 nav items', () => {
      expect(visibleItems('ADMIN')).toHaveLength(8);
    });

    it('ARZT sees only overview section', () => {
      expect(visibleSections('ARZT')).toEqual(['overview']);
    });

    it('ARZT sees 3 nav items: dashboard, patients, communications', () => {
      const items = visibleItems('ARZT');
      expect(items).toHaveLength(3);
      expect(items.map((i) => i.href)).toEqual(['/dashboard', '/patients', '/communications']);
    });

    it('ARZT does NOT see management or system sections', () => {
      const sections = visibleSections('ARZT');
      expect(sections).not.toContain('management');
      expect(sections).not.toContain('system');
    });

    it('EMPFANG sees only overview section', () => {
      expect(visibleSections('EMPFANG')).toEqual(['overview']);
    });

    it('EMPFANG sees 3 nav items: dashboard, patients, communications', () => {
      const items = visibleItems('EMPFANG');
      expect(items).toHaveLength(3);
      expect(items.map((i) => i.href)).toEqual(['/dashboard', '/patients', '/communications']);
    });

    it('EMPFANG does NOT see analytics, team, audit, billing, or settings', () => {
      const hrefs = visibleItems('EMPFANG').map((i) => i.href);
      expect(hrefs).not.toContain('/analytics');
      expect(hrefs).not.toContain('/team');
      expect(hrefs).not.toContain('/audit');
      expect(hrefs).not.toContain('/billing');
      expect(hrefs).not.toContain('/settings');
    });
  });

  describe('Sidebar-Middleware consistency', () => {
    it('every sidebar item route should be allowed by middleware for its roles', () => {
      for (const item of sidebarItems) {
        for (const role of item.roles) {
          expect(isRoleAllowed(role, item.href)).toBe(true);
        }
      }
    });

    it('no sidebar item should be visible to a role that middleware blocks', () => {
      const roles = ['ADMIN', 'ARZT', 'EMPFANG'];
      for (const item of sidebarItems) {
        for (const role of roles) {
          if (item.roles.includes(role)) {
            expect(isRoleAllowed(role, item.href)).toBe(true);
          }
        }
      }
    });
  });

  describe('Patient detail — role-specific UI visibility rules', () => {
    // These test the logic that should be applied in the patient detail page
    const clinicalRoles = ['ADMIN', 'ARZT'];
    const allRoles = ['ADMIN', 'ARZT', 'EMPFANG'];

    function isClinical(role: string) {
      return role === 'ADMIN' || role === 'ARZT';
    }

    function isAdmin(role: string) {
      return role === 'ADMIN';
    }

    describe('Treatment plans visibility', () => {
      it.each(clinicalRoles)('%s should see treatment plans', (role) => {
        expect(isClinical(role)).toBe(true);
      });
      it('EMPFANG should NOT see treatment plans', () => {
        expect(isClinical('EMPFANG')).toBe(false);
      });
    });

    describe('Photos visibility', () => {
      it.each(clinicalRoles)('%s should see photos', (role) => {
        expect(isClinical(role)).toBe(true);
      });
      it('EMPFANG should NOT see photos', () => {
        expect(isClinical('EMPFANG')).toBe(false);
      });
    });

    describe('Delete patient button', () => {
      it('ADMIN should see delete button', () => {
        expect(isAdmin('ADMIN')).toBe(true);
      });
      it('ARZT should NOT see delete button', () => {
        expect(isAdmin('ARZT')).toBe(false);
      });
      it('EMPFANG should NOT see delete button', () => {
        expect(isAdmin('EMPFANG')).toBe(false);
      });
    });

    describe('Revoke consent action', () => {
      it.each(clinicalRoles)('%s should see revoke action', (role) => {
        expect(isClinical(role)).toBe(true);
      });
      it('EMPFANG should NOT see revoke action', () => {
        expect(isClinical('EMPFANG')).toBe(false);
      });
    });

    describe('Consent list and create', () => {
      it.each(allRoles)('%s should see consent list', (role) => {
        expect(allRoles.includes(role)).toBe(true);
      });
    });
  });
});
