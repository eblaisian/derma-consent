/**
 * Extracts a display string from decrypted patient data.
 *
 * Handles two encryption formats:
 * - Raw string (correct): decryptForm returns "Max Mustermann"
 * - Wrapped object (legacy): decryptForm returns { value: "Max Mustermann" }
 */
export function extractDecryptedValue(decrypted: unknown): string {
  if (typeof decrypted === 'string') return decrypted;
  if (decrypted && typeof decrypted === 'object' && 'value' in decrypted) {
    return String((decrypted as { value: unknown }).value);
  }
  return JSON.stringify(decrypted);
}
