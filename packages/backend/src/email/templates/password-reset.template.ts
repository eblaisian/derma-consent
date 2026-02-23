type Locale = 'de' | 'en' | 'es' | 'fr';

const i18n: Record<Locale, {
  subject: string;
  heading: string;
  body: string;
  button: string;
  expiry: string;
  ignore: string;
  footer: string;
}> = {
  de: {
    subject: 'Passwort zuruecksetzen — DermaConsent',
    heading: 'Passwort zuruecksetzen',
    body: 'Sie haben eine Anfrage zum Zuruecksetzen Ihres Passworts erhalten.',
    button: 'Passwort zuruecksetzen',
    expiry: 'Dieser Link ist 1 Stunde gueltig.',
    ignore: 'Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.',
    footer: 'DermaConsent — DSGVO-konforme digitale Einwilligungen',
  },
  en: {
    subject: 'Reset password — DermaConsent',
    heading: 'Reset password',
    body: 'You have received a request to reset your password.',
    button: 'Reset password',
    expiry: 'This link is valid for 1 hour.',
    ignore: 'If you did not request this, please ignore this email.',
    footer: 'DermaConsent — GDPR-compliant digital consent',
  },
  es: {
    subject: 'Restablecer contrasena — DermaConsent',
    heading: 'Restablecer contrasena',
    body: 'Ha recibido una solicitud para restablecer su contrasena.',
    button: 'Restablecer contrasena',
    expiry: 'Este enlace es valido durante 1 hora.',
    ignore: 'Si no solicito esto, ignore este correo.',
    footer: 'DermaConsent — Consentimiento digital conforme al RGPD',
  },
  fr: {
    subject: 'Reinitialiser le mot de passe — DermaConsent',
    heading: 'Reinitialiser le mot de passe',
    body: 'Vous avez recu une demande de reinitialisation de votre mot de passe.',
    button: 'Reinitialiser le mot de passe',
    expiry: 'Ce lien est valable 1 heure.',
    ignore: 'Si vous n\'avez pas fait cette demande, ignorez cet e-mail.',
    footer: 'DermaConsent — Consentement numerique conforme au RGPD',
  },
};

export function getPasswordResetSubject(locale: Locale = 'de'): string {
  return (i18n[locale] || i18n.de).subject;
}

export function passwordResetTemplate(resetLink: string, locale: Locale = 'de'): string {
  const t = i18n[locale] || i18n.de;

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1a1a1a;">${t.heading}</h2>
  <p>${t.body}</p>
  <p><a href="${resetLink}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">${t.button}</a></p>
  <p style="color: #666; font-size: 14px;">${t.expiry}</p>
  <p style="color: #666; font-size: 14px;">${t.ignore}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">${t.footer}</p>
</body>
</html>`;
}
