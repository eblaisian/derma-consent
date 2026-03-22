export const locales = ['de', 'en', 'es', 'fr', 'tr', 'ar', 'ru', 'pl'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'de';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export const rtlLocales: readonly Locale[] = ['ar'] as const;

export const localeNames: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  tr: 'Türkçe',
  ar: 'العربية',
  ru: 'Русский',
  pl: 'Polski',
};
