export type EmailLocale = 'de' | 'en' | 'es' | 'fr' | 'ar' | 'tr' | 'pl' | 'ru';

export const SUPPORTED_EMAIL_LOCALES: EmailLocale[] = ['de', 'en', 'es', 'fr', 'ar', 'tr', 'pl', 'ru'];

export const RTL_LOCALES: EmailLocale[] = ['ar'];

export interface BaseLayoutOptions {
  locale: EmailLocale;
  preheaderText?: string;
  practiceName?: string;
  brandColor?: string;
}
