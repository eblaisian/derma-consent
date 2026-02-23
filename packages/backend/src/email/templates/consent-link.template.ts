type Locale = 'de' | 'en' | 'es' | 'fr';

const i18n: Record<Locale, {
  subject: (practiceName: string) => string;
  heading: string;
  greeting: string;
  body: (practiceName: string) => string;
  cta: string;
  button: string;
  expiry: (days: number) => string;
  footer: string;
}> = {
  de: {
    subject: (p) => `Einwilligungsformular von ${p}`,
    heading: 'Einwilligungsformular',
    greeting: 'Sehr geehrte/r Patient/in,',
    body: (p) => `die Praxis <strong>${p}</strong> hat ein digitales Einwilligungsformular fuer Sie erstellt.`,
    cta: 'Bitte klicken Sie auf den folgenden Link, um das Formular auszufuellen:',
    button: 'Formular oeffnen',
    expiry: (d) => `Dieser Link ist ${d} Tage gueltig.`,
    footer: 'Diese E-Mail wurde ueber DermaConsent versendet. Ihre Daten werden Ende-zu-Ende verschluesselt.',
  },
  en: {
    subject: (p) => `Consent form from ${p}`,
    heading: 'Consent Form',
    greeting: 'Dear Patient,',
    body: (p) => `The practice <strong>${p}</strong> has created a digital consent form for you.`,
    cta: 'Please click the following link to fill out the form:',
    button: 'Open form',
    expiry: (d) => `This link is valid for ${d} days.`,
    footer: 'This email was sent via DermaConsent. Your data is end-to-end encrypted.',
  },
  es: {
    subject: (p) => `Formulario de consentimiento de ${p}`,
    heading: 'Formulario de consentimiento',
    greeting: 'Estimado/a paciente,',
    body: (p) => `La consulta <strong>${p}</strong> ha creado un formulario de consentimiento digital para usted.`,
    cta: 'Haga clic en el siguiente enlace para completar el formulario:',
    button: 'Abrir formulario',
    expiry: (d) => `Este enlace es valido durante ${d} dias.`,
    footer: 'Este correo fue enviado a traves de DermaConsent. Sus datos estan cifrados de extremo a extremo.',
  },
  fr: {
    subject: (p) => `Formulaire de consentement de ${p}`,
    heading: 'Formulaire de consentement',
    greeting: 'Cher/e patient/e,',
    body: (p) => `Le cabinet <strong>${p}</strong> a cree un formulaire de consentement numerique pour vous.`,
    cta: 'Veuillez cliquer sur le lien suivant pour remplir le formulaire :',
    button: 'Ouvrir le formulaire',
    expiry: (d) => `Ce lien est valable ${d} jours.`,
    footer: 'Cet e-mail a ete envoye via DermaConsent. Vos donnees sont chiffrees de bout en bout.',
  },
};

export function getConsentLinkSubject(practiceName: string, locale: Locale = 'de'): string {
  return (i18n[locale] || i18n.de).subject(practiceName);
}

export function consentLinkTemplate(practiceName: string, consentLink: string, expiryDays: number, locale: Locale = 'de'): string {
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
  <p style="color: #666; font-size: 14px;">${t.expiry(expiryDays)}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">
    ${t.footer}
  </p>
</body>
</html>`;
}
