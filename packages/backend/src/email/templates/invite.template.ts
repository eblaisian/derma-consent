type Locale = 'de' | 'en' | 'es' | 'fr';

const roleLabels: Record<string, Record<Locale, string>> = {
  ADMIN: { de: 'Administrator', en: 'Administrator', es: 'Administrador', fr: 'Administrateur' },
  ARZT: { de: 'Arzt', en: 'Doctor', es: 'Medico', fr: 'Medecin' },
  EMPFANG: { de: 'Empfang', en: 'Reception', es: 'Recepcion', fr: 'Reception' },
};

const i18n: Record<Locale, {
  subject: (practiceName: string) => string;
  heading: string;
  body: (practiceName: string, roleLabel: string) => string;
  cta: string;
  button: string;
  expiry: string;
  footer: string;
}> = {
  de: {
    subject: (p) => `Einladung zu ${p} — DermaConsent`,
    heading: 'Einladung zu DermaConsent',
    body: (p, r) => `Sie wurden eingeladen, der Praxis <strong>${p}</strong> als <strong>${r}</strong> beizutreten.`,
    cta: 'Klicken Sie auf den folgenden Link, um die Einladung anzunehmen:',
    button: 'Einladung annehmen',
    expiry: 'Diese Einladung ist 7 Tage gueltig.',
    footer: 'DermaConsent — DSGVO-konforme digitale Einwilligungen',
  },
  en: {
    subject: (p) => `Invitation to ${p} — DermaConsent`,
    heading: 'Invitation to DermaConsent',
    body: (p, r) => `You have been invited to join the practice <strong>${p}</strong> as <strong>${r}</strong>.`,
    cta: 'Click the following link to accept the invitation:',
    button: 'Accept invitation',
    expiry: 'This invitation is valid for 7 days.',
    footer: 'DermaConsent — GDPR-compliant digital consent',
  },
  es: {
    subject: (p) => `Invitacion a ${p} — DermaConsent`,
    heading: 'Invitacion a DermaConsent',
    body: (p, r) => `Ha sido invitado/a a unirse a la consulta <strong>${p}</strong> como <strong>${r}</strong>.`,
    cta: 'Haga clic en el siguiente enlace para aceptar la invitacion:',
    button: 'Aceptar invitacion',
    expiry: 'Esta invitacion es valida durante 7 dias.',
    footer: 'DermaConsent — Consentimiento digital conforme al RGPD',
  },
  fr: {
    subject: (p) => `Invitation a ${p} — DermaConsent`,
    heading: 'Invitation a DermaConsent',
    body: (p, r) => `Vous avez ete invite(e) a rejoindre le cabinet <strong>${p}</strong> en tant que <strong>${r}</strong>.`,
    cta: 'Cliquez sur le lien suivant pour accepter l\'invitation :',
    button: 'Accepter l\'invitation',
    expiry: 'Cette invitation est valable 7 jours.',
    footer: 'DermaConsent — Consentement numerique conforme au RGPD',
  },
};

export function getInviteSubject(practiceName: string, locale: Locale = 'de'): string {
  return (i18n[locale] || i18n.de).subject(practiceName);
}

export function inviteTemplate(practiceName: string, role: string, inviteLink: string, locale: Locale = 'de'): string {
  const t = i18n[locale] || i18n.de;
  const roleLabel = roleLabels[role]?.[locale] || role;

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1a1a1a;">${t.heading}</h2>
  <p>${t.body(practiceName, roleLabel)}</p>
  <p>${t.cta}</p>
  <p style="margin: 24px 0;">
    <a href="${inviteLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      ${t.button}
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">${t.expiry}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">${t.footer}</p>
</body>
</html>`;
}
