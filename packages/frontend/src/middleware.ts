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
];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((p) => pathname.startsWith(p));
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
    // Also match public paths for locale cookie auto-detection
    '/',
    '/login',
    '/register',
    '/consent/:path*',
    '/invite/:path*',
  ],
};
