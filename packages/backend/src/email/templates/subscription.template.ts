type Locale = 'de' | 'en' | 'es' | 'fr';

const i18n: Record<Locale, {
  trialSubject: (practiceName: string) => string;
  paymentSubject: (practiceName: string) => string;
  trialHeading: string;
  trialBody: (practiceName: string) => string;
  trialCta: string;
  trialButton: string;
  paymentHeading: string;
  paymentBody: (practiceName: string) => string;
  paymentCta: string;
  paymentButton: string;
  footer: string;
}> = {
  de: {
    trialSubject: (p) => `Testphase laeuft bald ab — ${p}`,
    paymentSubject: (p) => `Zahlungsproblem — ${p}`,
    trialHeading: 'Ihre Testphase laeuft bald ab',
    trialBody: (p) => `Die kostenlose Testphase fuer <strong>${p}</strong> endet in 3 Tagen.`,
    trialCta: 'Um DermaConsent weiterhin nutzen zu koennen, waehlen Sie bitte einen Tarif aus:',
    trialButton: 'Tarif waehlen',
    paymentHeading: 'Zahlungsproblem',
    paymentBody: (p) => `Die letzte Zahlung fuer <strong>${p}</strong> konnte nicht verarbeitet werden.`,
    paymentCta: 'Bitte aktualisieren Sie Ihre Zahlungsinformationen, um eine Unterbrechung des Dienstes zu vermeiden:',
    paymentButton: 'Zahlung aktualisieren',
    footer: 'DermaConsent — DSGVO-konforme digitale Einwilligungen',
  },
  en: {
    trialSubject: (p) => `Trial ending soon — ${p}`,
    paymentSubject: (p) => `Payment issue — ${p}`,
    trialHeading: 'Your trial is ending soon',
    trialBody: (p) => `The free trial for <strong>${p}</strong> ends in 3 days.`,
    trialCta: 'To continue using DermaConsent, please select a plan:',
    trialButton: 'Choose plan',
    paymentHeading: 'Payment issue',
    paymentBody: (p) => `The last payment for <strong>${p}</strong> could not be processed.`,
    paymentCta: 'Please update your payment information to avoid service interruption:',
    paymentButton: 'Update payment',
    footer: 'DermaConsent — GDPR-compliant digital consent',
  },
  es: {
    trialSubject: (p) => `Periodo de prueba a punto de terminar — ${p}`,
    paymentSubject: (p) => `Problema de pago — ${p}`,
    trialHeading: 'Su periodo de prueba esta por terminar',
    trialBody: (p) => `El periodo de prueba gratuito para <strong>${p}</strong> termina en 3 dias.`,
    trialCta: 'Para seguir usando DermaConsent, seleccione un plan:',
    trialButton: 'Elegir plan',
    paymentHeading: 'Problema de pago',
    paymentBody: (p) => `El ultimo pago de <strong>${p}</strong> no pudo ser procesado.`,
    paymentCta: 'Actualice su informacion de pago para evitar interrupciones del servicio:',
    paymentButton: 'Actualizar pago',
    footer: 'DermaConsent — Consentimiento digital conforme al RGPD',
  },
  fr: {
    trialSubject: (p) => `Periode d'essai bientot terminee — ${p}`,
    paymentSubject: (p) => `Probleme de paiement — ${p}`,
    trialHeading: 'Votre periode d\'essai se termine bientot',
    trialBody: (p) => `La periode d'essai gratuite pour <strong>${p}</strong> se termine dans 3 jours.`,
    trialCta: 'Pour continuer a utiliser DermaConsent, veuillez choisir un forfait :',
    trialButton: 'Choisir un forfait',
    paymentHeading: 'Probleme de paiement',
    paymentBody: (p) => `Le dernier paiement pour <strong>${p}</strong> n'a pas pu etre traite.`,
    paymentCta: 'Veuillez mettre a jour vos informations de paiement pour eviter une interruption de service :',
    paymentButton: 'Mettre a jour le paiement',
    footer: 'DermaConsent — Consentement numerique conforme au RGPD',
  },
};

export function getSubscriptionSubject(type: 'trial_expiring' | 'payment_failed', practiceName: string, locale: Locale = 'de'): string {
  const t = i18n[locale] || i18n.de;
  return type === 'trial_expiring' ? t.trialSubject(practiceName) : t.paymentSubject(practiceName);
}

export function subscriptionTemplate(type: 'trial_expiring' | 'payment_failed', practiceName: string, locale: Locale = 'de'): string {
  const t = i18n[locale] || i18n.de;
  const billingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`;

  if (type === 'trial_expiring') {
    return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #1a1a1a;">${t.trialHeading}</h2>
  <p>${t.trialBody(practiceName)}</p>
  <p>${t.trialCta}</p>
  <p style="margin: 24px 0;">
    <a href="${billingUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      ${t.trialButton}
    </a>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">${t.footer}</p>
</body>
</html>`;
  }

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #b91c1c;">${t.paymentHeading}</h2>
  <p>${t.paymentBody(practiceName)}</p>
  <p>${t.paymentCta}</p>
  <p style="margin: 24px 0;">
    <a href="${billingUrl}" style="background-color: #b91c1c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      ${t.paymentButton}
    </a>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #999; font-size: 12px;">${t.footer}</p>
</body>
</html>`;
}
