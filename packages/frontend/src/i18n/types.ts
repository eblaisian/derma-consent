import type messages from './messages/de.json';

type Messages = typeof messages;

declare global {
  type IntlMessages = Messages;
}

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages;
  }
}
