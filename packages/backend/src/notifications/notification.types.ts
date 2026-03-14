export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export type NotificationLocale = 'de' | 'en' | 'es' | 'fr' | 'ar' | 'tr' | 'pl' | 'ru';

export const SUPPORTED_LOCALES: NotificationLocale[] = ['de', 'en', 'es', 'fr', 'ar', 'tr', 'pl', 'ru'];

export type NotificationTemplate =
  | 'consent_link'
  | 'consent_reminder'
  | 'invite'
  | 'welcome'
  | 'subscription_notice'
  | 'password_reset'
  | 'email_verification'
  | 'custom_message';

export interface SendNotificationOptions {
  practiceId?: string;
  recipientType: 'user' | 'patient' | 'external';
  channel: NotificationChannel;
  templateKey: NotificationTemplate;
  locale?: string;
  metadata?: Record<string, unknown>;
}
