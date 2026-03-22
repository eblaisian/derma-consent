// Server-only exports (uses Node.js fs/path)
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to embedded font files (NotoSans .ttf) */
export const FONTS_DIR = path.resolve(__dirname, 'assets/fonts');

/** Absolute path to i18n message JSON files */
export const MESSAGES_DIR = path.resolve(__dirname, 'i18n/messages');

/**
 * Load i18n messages for a given locale.
 */
export function loadMessages(locale: string): Record<string, unknown> {
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
