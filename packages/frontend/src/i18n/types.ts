import type messages from '@derma-consent/shared/i18n/messages/de.json';

type Messages = typeof messages;

declare global {
  type IntlMessages = Messages;
}

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages;
  }
}
