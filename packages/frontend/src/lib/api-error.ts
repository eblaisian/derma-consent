/**
 * Extracts a translated error message from an API error.
 *
 * The backend returns { errorCode: 'INVITE_EXPIRED', message: '...' }.
 * This helper maps errorCode → i18n translation, falling back to the raw message.
 *
 * Usage:
 *   const tErrors = useTranslations('apiErrors');
 *   catch (err) { toast.error(getApiErrorMessage(err, tErrors)); }
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getApiErrorMessage(
  error: unknown,
  t: { (key: any, values?: any): string; has: (key: any) => boolean },
): string {
  if (!(error instanceof Error)) {
    return t('UNKNOWN_ERROR');
  }

  const errorCode = (error as Error & { errorCode?: string }).errorCode;

  if (errorCode && t.has(errorCode)) {
    // The `message` field from the backend may carry extra detail (e.g. minutes for lockout)
    const detail = error.message;
    return t(errorCode, { minutes: detail });
  }

  // No error code or unknown code — use raw message as last resort
  return error.message || t('UNKNOWN_ERROR');
}
