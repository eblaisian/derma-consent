import { baseLayout, ctaButton, calloutBox } from './base-layout';
import type { EmailLocale } from './types';

const i18n: Record<EmailLocale, {
  trialSubject: (practiceName: string) => string;
  paymentSubject: (practiceName: string) => string;
  trialHeading: string;
  trialBody: (practiceName: string, daysLeft: number) => string;
  trialCta: string;
  trialButton: string;
  trialPreheader: (daysLeft: number) => string;
  paymentHeading: string;
  paymentBody: (practiceName: string) => string;
  paymentCta: string;
  paymentButton: string;
  paymentPreheader: string;
}> = {
  de: {
    trialSubject: (p) => `Testphase läuft bald ab — ${p}`,
    paymentSubject: (p) => `Zahlungsproblem — ${p}`,
    trialHeading: 'Ihre Testphase läuft bald ab',
    trialBody: (p, d) => `Die kostenlose Testphase für <strong style="color: #0f172a;">${p}</strong> endet in <strong style="color: #0f172a;">${d} ${d === 1 ? 'Tag' : 'Tagen'}</strong>.`,
    trialCta: 'Um DermaConsent weiterhin nutzen zu können, wählen Sie bitte einen Tarif aus.',
    trialButton: 'Tarif wählen →',
    trialPreheader: (d) => `Ihre Testphase endet in ${d} Tagen`,
    paymentHeading: 'Zahlungsproblem',
    paymentBody: (p) => `Die letzte Zahlung für <strong style="color: #0f172a;">${p}</strong> konnte nicht verarbeitet werden.`,
    paymentCta: 'Bitte aktualisieren Sie Ihre Zahlungsinformationen, um eine Unterbrechung des Dienstes zu vermeiden.',
    paymentButton: 'Zahlung aktualisieren →',
    paymentPreheader: 'Ihre letzte Zahlung konnte nicht verarbeitet werden',
  },
  en: {
    trialSubject: (p) => `Trial ending soon — ${p}`,
    paymentSubject: (p) => `Payment issue — ${p}`,
    trialHeading: 'Your trial is ending soon',
    trialBody: (p, d) => `The free trial for <strong style="color: #0f172a;">${p}</strong> ends in <strong style="color: #0f172a;">${d} ${d === 1 ? 'day' : 'days'}</strong>.`,
    trialCta: 'To continue using DermaConsent, please select a plan.',
    trialButton: 'Choose plan →',
    trialPreheader: (d) => `Your trial ends in ${d} days`,
    paymentHeading: 'Payment issue',
    paymentBody: (p) => `The last payment for <strong style="color: #0f172a;">${p}</strong> could not be processed.`,
    paymentCta: 'Please update your payment information to avoid service interruption.',
    paymentButton: 'Update payment →',
    paymentPreheader: 'Your last payment could not be processed',
  },
  es: {
    trialSubject: (p) => `Período de prueba a punto de terminar — ${p}`,
    paymentSubject: (p) => `Problema de pago — ${p}`,
    trialHeading: 'Su período de prueba está por terminar',
    trialBody: (p, d) => `El período de prueba gratuito para <strong style="color: #0f172a;">${p}</strong> termina en <strong style="color: #0f172a;">${d} ${d === 1 ? 'día' : 'días'}</strong>.`,
    trialCta: 'Para seguir usando DermaConsent, seleccione un plan.',
    trialButton: 'Elegir plan →',
    trialPreheader: (d) => `Su período de prueba termina en ${d} días`,
    paymentHeading: 'Problema de pago',
    paymentBody: (p) => `El último pago de <strong style="color: #0f172a;">${p}</strong> no pudo ser procesado.`,
    paymentCta: 'Actualice su información de pago para evitar interrupciones del servicio.',
    paymentButton: 'Actualizar pago →',
    paymentPreheader: 'Su último pago no pudo ser procesado',
  },
  fr: {
    trialSubject: (p) => `Période d'essai bientôt terminée — ${p}`,
    paymentSubject: (p) => `Problème de paiement — ${p}`,
    trialHeading: 'Votre période d\'essai se termine bientôt',
    trialBody: (p, d) => `La période d'essai gratuite pour <strong style="color: #0f172a;">${p}</strong> se termine dans <strong style="color: #0f172a;">${d} ${d === 1 ? 'jour' : 'jours'}</strong>.`,
    trialCta: 'Pour continuer à utiliser DermaConsent, veuillez choisir un forfait.',
    trialButton: 'Choisir un forfait →',
    trialPreheader: (d) => `Votre période d'essai se termine dans ${d} jours`,
    paymentHeading: 'Problème de paiement',
    paymentBody: (p) => `Le dernier paiement pour <strong style="color: #0f172a;">${p}</strong> n'a pas pu être traité.`,
    paymentCta: 'Veuillez mettre à jour vos informations de paiement pour éviter une interruption de service.',
    paymentButton: 'Mettre à jour le paiement →',
    paymentPreheader: 'Votre dernier paiement n\'a pas pu être traité',
  },
  ar: {
    trialSubject: (p) => `فترة التجربة تنتهي قريباً — ${p}`,
    paymentSubject: (p) => `مشكلة في الدفع — ${p}`,
    trialHeading: 'فترة التجربة تنتهي قريباً',
    trialBody: (p, d) => `الفترة التجريبية المجانية لـ <strong style="color: #0f172a;">${p}</strong> تنتهي خلال <strong style="color: #0f172a;">${d} ${d === 1 ? 'يوم' : 'أيام'}</strong>.`,
    trialCta: 'للاستمرار في استخدام DermaConsent، يرجى اختيار خطة.',
    trialButton: '← اختيار خطة',
    trialPreheader: (d) => `فترة التجربة تنتهي خلال ${d} أيام`,
    paymentHeading: 'مشكلة في الدفع',
    paymentBody: (p) => `لم يتم معالجة آخر دفعة لـ <strong style="color: #0f172a;">${p}</strong>.`,
    paymentCta: 'يرجى تحديث معلومات الدفع لتجنب انقطاع الخدمة.',
    paymentButton: '← تحديث الدفع',
    paymentPreheader: 'لم يتم معالجة آخر دفعة لك',
  },
  tr: {
    trialSubject: (p) => `Deneme süresi bitiyor — ${p}`,
    paymentSubject: (p) => `Ödeme sorunu — ${p}`,
    trialHeading: 'Deneme süreniz bitiyor',
    trialBody: (p, d) => `<strong style="color: #0f172a;">${p}</strong> için ücretsiz deneme süresi <strong style="color: #0f172a;">${d} gün</strong> içinde sona eriyor.`,
    trialCta: 'DermaConsent\'i kullanmaya devam etmek için lütfen bir plan seçin.',
    trialButton: 'Plan seç →',
    trialPreheader: (d) => `Deneme süreniz ${d} gün içinde bitiyor`,
    paymentHeading: 'Ödeme sorunu',
    paymentBody: (p) => `<strong style="color: #0f172a;">${p}</strong> için son ödeme işlenemedi.`,
    paymentCta: 'Hizmet kesintisini önlemek için ödeme bilgilerinizi güncelleyin.',
    paymentButton: 'Ödemeyi güncelle →',
    paymentPreheader: 'Son ödemeniz işlenemedi',
  },
  pl: {
    trialSubject: (p) => `Okres próbny kończy się — ${p}`,
    paymentSubject: (p) => `Problem z płatnością — ${p}`,
    trialHeading: 'Twój okres próbny dobiega końca',
    trialBody: (p, d) => `Bezpłatny okres próbny dla <strong style="color: #0f172a;">${p}</strong> kończy się za <strong style="color: #0f172a;">${d} ${d === 1 ? 'dzień' : 'dni'}</strong>.`,
    trialCta: 'Aby nadal korzystać z DermaConsent, wybierz plan.',
    trialButton: 'Wybierz plan →',
    trialPreheader: (d) => `Twój okres próbny kończy się za ${d} dni`,
    paymentHeading: 'Problem z płatnością',
    paymentBody: (p) => `Ostatnia płatność za <strong style="color: #0f172a;">${p}</strong> nie mogła zostać przetworzona.`,
    paymentCta: 'Zaktualizuj dane płatności, aby uniknąć przerwy w usłudze.',
    paymentButton: 'Zaktualizuj płatność →',
    paymentPreheader: 'Ostatnia płatność nie mogła zostać przetworzona',
  },
  ru: {
    trialSubject: (p) => `Пробный период заканчивается — ${p}`,
    paymentSubject: (p) => `Проблема с оплатой — ${p}`,
    trialHeading: 'Ваш пробный период заканчивается',
    trialBody: (p, d) => `Бесплатный пробный период для <strong style="color: #0f172a;">${p}</strong> заканчивается через <strong style="color: #0f172a;">${d} ${d === 1 ? 'день' : 'дней'}</strong>.`,
    trialCta: 'Чтобы продолжить использование DermaConsent, выберите тариф.',
    trialButton: 'Выбрать тариф →',
    trialPreheader: (d) => `Ваш пробный период заканчивается через ${d} дней`,
    paymentHeading: 'Проблема с оплатой',
    paymentBody: (p) => `Последний платёж за <strong style="color: #0f172a;">${p}</strong> не был обработан.`,
    paymentCta: 'Обновите платёжную информацию, чтобы избежать прерывания обслуживания.',
    paymentButton: 'Обновить оплату →',
    paymentPreheader: 'Ваш последний платёж не был обработан',
  },
};

export function getSubscriptionSubject(type: 'trial_expiring' | 'payment_failed', practiceName: string, locale: EmailLocale = 'de'): string {
  const t = i18n[locale] || i18n.de;
  return type === 'trial_expiring' ? t.trialSubject(practiceName) : t.paymentSubject(practiceName);
}

export function subscriptionTemplate(
  type: 'trial_expiring' | 'payment_failed',
  practiceName: string,
  locale: EmailLocale = 'de',
  daysLeft: number = 3,
): string {
  const t = i18n[locale] || i18n.de;
  const billingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`;

  if (type === 'trial_expiring') {
    const content = `
    <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.02em;">${t.trialHeading}</h1>
    ${calloutBox(
      `<p style="font-size: 15px; line-height: 1.5; color: #92400e; margin: 0;">${t.trialBody(practiceName, daysLeft)}</p>`,
      { borderColor: '#d97706', bgColor: '#fffbeb' },
    )}
    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 4px;">${t.trialCta}</p>
    ${ctaButton(t.trialButton, billingUrl)}`;

    return baseLayout(content, { locale, preheaderText: t.trialPreheader(daysLeft) });
  }

  const content = `
  <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.02em;">${t.paymentHeading}</h1>
  ${calloutBox(
    `<p style="font-size: 15px; line-height: 1.5; color: #991b1b; margin: 0;">${t.paymentBody(practiceName)}</p>`,
    { borderColor: '#b91c1c', bgColor: '#fef2f2' },
  )}
  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 4px;">${t.paymentCta}</p>
  ${ctaButton(t.paymentButton, billingUrl, '#b91c1c')}`;

  return baseLayout(content, { locale, preheaderText: t.paymentPreheader });
}
