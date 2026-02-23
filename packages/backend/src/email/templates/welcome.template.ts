type Locale = 'de' | 'en' | 'es' | 'fr';

const i18n: Record<Locale, {
  subject: string;
  heading: string;
  greeting: (name: string) => string;
  intro: string;
  features: string[];
  cta: string;
  footer: string;
}> = {
  de: {
    subject: 'Willkommen bei DermaConsent',
    heading: 'Willkommen bei DermaConsent!',
    greeting: (n) => `Hallo ${n || 'dort'},`,
    intro: 'Ihr Konto wurde erfolgreich erstellt. Mit DermaConsent koennen Sie:',
    features: [
      'Digitale Einwilligungsformulare erstellen und versenden',
      'Patientendaten Ende-zu-Ende verschluesselt verwalten',
      'DSGVO-konform dokumentieren und archivieren',
      'GDT 2.1-Daten an Ihre Praxissoftware exportieren',
    ],
    cta: 'Starten Sie jetzt, indem Sie Ihre Praxis registrieren.',
    footer: 'DermaConsent — DSGVO-konforme digitale Einwilligungen',
  },
  en: {
    subject: 'Welcome to DermaConsent',
    heading: 'Welcome to DermaConsent!',
    greeting: (n) => `Hello ${n || 'there'},`,
    intro: 'Your account has been successfully created. With DermaConsent you can:',
    features: [
      'Create and send digital consent forms',
      'Manage patient data with end-to-end encryption',
      'Document and archive in GDPR compliance',
      'Export GDT 2.1 data to your practice software',
    ],
    cta: 'Get started by registering your practice.',
    footer: 'DermaConsent — GDPR-compliant digital consent',
  },
  es: {
    subject: 'Bienvenido a DermaConsent',
    heading: 'Bienvenido a DermaConsent!',
    greeting: (n) => `Hola ${n || ''},`,
    intro: 'Su cuenta ha sido creada exitosamente. Con DermaConsent puede:',
    features: [
      'Crear y enviar formularios de consentimiento digitales',
      'Gestionar datos de pacientes con cifrado de extremo a extremo',
      'Documentar y archivar conforme al RGPD',
      'Exportar datos GDT 2.1 a su software de consulta',
    ],
    cta: 'Comience registrando su consulta.',
    footer: 'DermaConsent — Consentimiento digital conforme al RGPD',
  },
  fr: {
    subject: 'Bienvenue sur DermaConsent',
    heading: 'Bienvenue sur DermaConsent !',
    greeting: (n) => `Bonjour ${n || ''},`,
    intro: 'Votre compte a ete cree avec succes. Avec DermaConsent, vous pouvez :',
    features: [
      'Creer et envoyer des formulaires de consentement numeriques',
      'Gerer les donnees des patients avec un chiffrement de bout en bout',
      'Documenter et archiver en conformite avec le RGPD',
      'Exporter les donnees GDT 2.1 vers votre logiciel de cabinet',
    ],
    cta: 'Commencez par enregistrer votre cabinet.',
    footer: 'DermaConsent — Consentement numerique conforme au RGPD',
  },
};

export function getWelcomeSubject(locale: Locale = 'de'): string {
  return (i18n[locale] || i18n.de).subject;
}

export function welcomeTemplate(userName: string, locale: Locale = 'de'): string {
  const t = i18n[locale] || i18n.de;

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1a1a1a;">${t.heading}</h2>
  <p>${t.greeting(userName)}</p>
  <p>${t.intro}</p>
  <ul>
    ${t.features.map((f) => `<li>${f}</li>`).join('\n    ')}
  </ul>
  <p>${t.cta}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">${t.footer}</p>
</body>
</html>`;
}
