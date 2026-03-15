import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { locales, defaultLocale, LOCALE_COOKIE, type Locale } from '@/i18n/config';

// Auth-protected path patterns
const protectedPaths = [
  '/dashboard',
  '/settings',
  '/team',
  '/patients',
  '/analytics',
  '/audit',
  '/billing',
  '/setup',
  '/admin',
  '/profile',
  '/communications',
];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((p) => pathname.startsWith(p));
}

// Role-based route access control
// Each role lists the path prefixes it is allowed to access
const roleAllowedPaths: Record<string, string[]> = {
  ADMIN: ['/dashboard', '/patients', '/communications', '/analytics', '/team', '/audit', '/billing', '/settings', '/setup', '/profile'],
  ARZT: ['/dashboard', '/patients', '/communications', '/analytics', '/profile'],
  EMPFANG: ['/dashboard', '/communications', '/profile'],
  PLATFORM_ADMIN: ['/admin', '/profile'],
};

function isRoleAllowed(role: string, pathname: string): boolean {
  const allowed = roleAllowedPaths[role];
  if (!allowed) return false;
  return allowed.some((p) => pathname.startsWith(p));
}

function detectLocaleFromHeader(request: NextRequest): Locale {
  const acceptLang = request.headers.get('accept-language') || '';
  const detected = acceptLang
    .split(',')
    .map((part) => part.split(';')[0].trim().substring(0, 2).toLowerCase())
    .find((code) => locales.includes(code as Locale)) as Locale | undefined;
  return detected || defaultLocale;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auto-set locale cookie on first visit if not present
  const hasLocaleCookie = request.cookies.has(LOCALE_COOKIE);
  let response: NextResponse | undefined;

  // Run auth middleware for protected paths
  if (isProtectedPath(pathname)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authResponse = await (auth as any)(request) as NextResponse | undefined;
    if (authResponse && authResponse.status !== 200) {
      // If auth redirects, set locale cookie on that response if needed
      if (!hasLocaleCookie) {
        const locale = detectLocaleFromHeader(request);
        authResponse.cookies.set(LOCALE_COOKIE, locale, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        });
      }
      return authResponse;
    }

    // Role-based access control: check if user's role can access this path
    const session = await auth();
    const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined;

    if (role && !isRoleAllowed(role, pathname)) {
      const redirectTo = role === 'PLATFORM_ADMIN' ? '/admin' : '/dashboard';
      const url = request.nextUrl.clone();
      url.pathname = redirectTo;
      const redirectResponse = NextResponse.redirect(url);
      if (!hasLocaleCookie) {
        const locale = detectLocaleFromHeader(request);
        redirectResponse.cookies.set(LOCALE_COOKIE, locale, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        });
      }
      return redirectResponse;
    }
  }

  // Set locale cookie on first visit (browser detection)
  if (!hasLocaleCookie) {
    const locale = detectLocaleFromHeader(request);
    response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/team/:path*',
    '/patients/:path*',
    '/analytics/:path*',
    '/audit/:path*',
    '/billing/:path*',
    '/setup/:path*',
    '/admin/:path*',
    '/communications/:path*',
    '/profile/:path*',
    // Also match public paths for locale cookie auto-detection
    '/',
    '/login',
    '/register',
    '/consent/:path*',
    '/invite/:path*',
  ],
};
