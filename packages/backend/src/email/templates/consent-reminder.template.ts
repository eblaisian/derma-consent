type Locale = 'de' | 'en' | 'es' | 'fr';

const i18n: Record<Locale, {
  subject: (practiceName: string) => string;
  heading: string;
  greeting: string;
  body: (practiceName: string) => string;
  cta: string;
  button: string;
  urgency: string;
  footer: string;
}> = {
  de: {
    subject: (p) => `Erinnerung: Einwilligungsformular von ${p}`,
    heading: 'Erinnerung: Einwilligungsformular',
    greeting: 'Sehr geehrte/r Patient/in,',
    body: (p) => `Sie haben ein Einwilligungsformular von <strong>${p}</strong> noch nicht ausgefuellt.`,
    cta: 'Bitte fuellen Sie das Formular zeitnah aus:',
    button: 'Formular oeffnen',
    urgency: 'Der Link laeuft in Kuerze ab.',
    footer: 'Diese E-Mail wurde ueber DermaConsent versendet. Ihre Daten werden Ende-zu-Ende verschluesselt.',
  },
  en: {
    subject: (p) => `Reminder: Consent form from ${p}`,
    heading: 'Reminder: Consent Form',
    greeting: 'Dear Patient,',
    body: (p) => `You have not yet completed a consent form from <strong>${p}</strong>.`,
    cta: 'Please complete the form soon:',
    button: 'Open form',
    urgency: 'This link will expire shortly.',
    footer: 'This email was sent via DermaConsent. Your data is end-to-end encrypted.',
  },
  es: {
    subject: (p) => `Recordatorio: Formulario de consentimiento de ${p}`,
    heading: 'Recordatorio: Formulario de consentimiento',
    greeting: 'Estimado/a paciente,',
    body: (p) => `Aun no ha completado el formulario de consentimiento de <strong>${p}</strong>.`,
    cta: 'Por favor complete el formulario pronto:',
    button: 'Abrir formulario',
    urgency: 'Este enlace expirara pronto.',
    footer: 'Este correo fue enviado a traves de DermaConsent. Sus datos estan cifrados de extremo a extremo.',
  },
  fr: {
    subject: (p) => `Rappel: Formulaire de consentement de ${p}`,
    heading: 'Rappel: Formulaire de consentement',
    greeting: 'Cher/e patient/e,',
    body: (p) => `Vous n'avez pas encore rempli le formulaire de consentement de <strong>${p}</strong>.`,
    cta: 'Veuillez remplir le formulaire rapidement :',
    button: 'Ouvrir le formulaire',
    urgency: 'Ce lien expirera bientot.',
    footer: 'Cet e-mail a ete envoye via DermaConsent. Vos donnees sont chiffrees de bout en bout.',
  },
};

export function getConsentReminderSubject(practiceName: string, locale: Locale = 'de'): string {
  return (i18n[locale] || i18n.de).subject(practiceName);
}

export function consentReminderTemplate(practiceName: string, consentLink: string, locale: Locale = 'de'): string {
  const t = i18n[locale] || i18n.de;
  const lang = locale === 'de' ? 'de' : locale;

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1a1a1a;">${t.heading}</h2>
  <p>${t.greeting}</p>
  <p>${t.body(practiceName)}</p>
  <p>${t.cta}</p>
  <p style="margin: 24px 0;">
    <a href="${consentLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      ${t.button}
    </a>
  </p>
  <p style="color: #dc2626; font-size: 14px; font-weight: 500;">${t.urgency}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">
    ${t.footer}
  </p>
</body>
</html>`;
}
