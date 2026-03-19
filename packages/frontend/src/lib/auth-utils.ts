/** Only allow relative paths to prevent open-redirect attacks.
 *  NextAuth rewrites relative callbackUrls to absolute URLs, so we also
 *  accept full URLs and extract just the pathname (which is always relative). */
export function getSafeCallbackUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  try {
    const path = new URL(raw).pathname;
    if (path.startsWith('/') && !path.startsWith('//')) return path;
  } catch {
    // Not a valid URL
  }
  return null;
}
