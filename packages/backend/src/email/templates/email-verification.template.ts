type Locale = 'de' | 'en' | 'es' | 'fr';

const i18n: Record<Locale, {
  subject: string;
  heading: string;
  body: string;
  cta: string;
  button: string;
  expiry: string;
  footer: string;
}> = {
  de: {
    subject: 'E-Mail bestaetigen — DermaConsent',
    heading: 'E-Mail-Adresse bestaetigen',
    body: 'Vielen Dank fuer Ihre Registrierung bei DermaConsent.',
    cta: 'Bitte bestaetigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Link klicken:',
    button: 'E-Mail bestaetigen',
    expiry: 'Dieser Link ist 24 Stunden gueltig.',
    footer: 'DermaConsent — DSGVO-konforme digitale Einwilligungen',
  },
  en: {
    subject: 'Verify email — DermaConsent',
    heading: 'Verify your email address',
    body: 'Thank you for registering with DermaConsent.',
    cta: 'Please verify your email address by clicking the link below:',
    button: 'Verify email',
    expiry: 'This link is valid for 24 hours.',
    footer: 'DermaConsent — GDPR-compliant digital consent',
  },
  es: {
    subject: 'Verificar correo — DermaConsent',
    heading: 'Verificar su direccion de correo',
    body: 'Gracias por registrarse en DermaConsent.',
    cta: 'Verifique su direccion de correo haciendo clic en el siguiente enlace:',
    button: 'Verificar correo',
    expiry: 'Este enlace es valido durante 24 horas.',
    footer: 'DermaConsent — Consentimiento digital conforme al RGPD',
  },
  fr: {
    subject: 'Verifier l\'e-mail — DermaConsent',
    heading: 'Verifiez votre adresse e-mail',
    body: 'Merci de vous etre inscrit(e) sur DermaConsent.',
    cta: 'Veuillez verifier votre adresse e-mail en cliquant sur le lien ci-dessous :',
    button: 'Verifier l\'e-mail',
    expiry: 'Ce lien est valable 24 heures.',
    footer: 'DermaConsent — Consentement numerique conforme au RGPD',
  },
};

export function getEmailVerificationSubject(locale: Locale = 'de'): string {
  return (i18n[locale] || i18n.de).subject;
}

export function emailVerificationTemplate(verifyLink: string, locale: Locale = 'de'): string {
  const t = i18n[locale] || i18n.de;

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1a1a1a;">${t.heading}</h2>
  <p>${t.body}</p>
  <p>${t.cta}</p>
  <p><a href="${verifyLink}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">${t.button}</a></p>
  <p style="color: #666; font-size: 14px;">${t.expiry}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">${t.footer}</p>
</body>
</html>`;
}
