export type EmailProvider = 'resend' | 'smtp';

/**
 * Resolve the active email provider from config.
 * Priority: explicit setting → auto-detect (Resend if key exists, SMTP if creds exist).
 */
export async function resolveEmailProvider(
  get: (key: string) => Promise<string | undefined>,
): Promise<EmailProvider | null> {
  const explicit = await get('email.provider');
  if (explicit === 'resend' || explicit === 'smtp') return explicit;

  const resendKey = await get('email.resendApiKey');
  if (resendKey) return 'resend';

  const smtpUser = await get('email.smtpUser');
  const smtpPass = await get('email.smtpPass');
  if (smtpUser && smtpPass) return 'smtp';

  return null;
}
