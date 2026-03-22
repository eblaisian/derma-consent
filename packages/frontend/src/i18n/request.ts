import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, LOCALE_COOKIE, type Locale } from '@derma-consent/shared';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // 1. Cookie
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return {
      locale: cookieLocale,
      messages: (await import(`@derma-consent/shared/i18n/messages/${cookieLocale}.json`)).default,
    };
  }

  // 2. Accept-Language header
  const acceptLang = headerStore.get('accept-language') || '';
  const detected = acceptLang
    .split(',')
    .map((part) => part.split(';')[0].trim().substring(0, 2).toLowerCase())
    .find((code) => locales.includes(code as Locale)) as Locale | undefined;

  const locale = detected || defaultLocale;

  return {
    locale,
    messages: (await import(`@derma-consent/shared/i18n/messages/${locale}.json`)).default,
  };
});
