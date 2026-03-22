import * as fs from 'fs';
import * as path from 'path';
import type { Locale } from './config';

const MESSAGES_DIR = path.resolve(__dirname, 'messages');

/**
 * Load i18n messages for a given locale.
 * Works in Node.js (backend) — for frontend/bundler contexts, use dynamic import instead.
 */
export function loadMessages(locale: Locale): Record<string, unknown> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Resolve a dot-separated translation key from a messages object.
 * Returns the key itself if not found.
 */
export function t(messages: Record<string, unknown>, key: string): string {
  const parts = key.split('.');
  let current: unknown = messages;
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === 'string' ? current : key;
}
