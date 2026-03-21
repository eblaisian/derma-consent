import { baseLayout, ctaButton } from './base-layout';
import type { EmailLocale } from './types';

const i18n: Record<EmailLocale, {
  subject: (practiceName: string) => string;
  body: (practiceName: string) => string;
  button: string;
  expiry: string;
  preheader: (practiceName: string) => string;
}> = {
  de: {
    subject: (p) => `Erinnerung: Einwilligungsformular von ${p}`,
    body: (p) => `Ihr Einwilligungsformular von <strong style="color: #0f172a;">${p}</strong> wurde noch nicht ausgefüllt.`,
    button: 'Jetzt ausfüllen →',
    expiry: 'Der Link läuft in Kürze ab.',
    preheader: (p) => `Erinnerung: Bitte füllen Sie Ihr Formular von ${p} aus`,
  },
  en: {
    subject: (p) => `Reminder: Consent form from ${p}`,
    body: (p) => `Your consent form from <strong style="color: #0f172a;">${p}</strong> has not been completed yet.`,
    button: 'Complete now →',
    expiry: 'This link will expire shortly.',
    preheader: (p) => `Reminder: Please complete your form from ${p}`,
  },
  es: {
    subject: (p) => `Recordatorio: Formulario de consentimiento de ${p}`,
    body: (p) => `Su formulario de consentimiento de <strong style="color: #0f172a;">${p}</strong> aún no ha sido completado.`,
    button: 'Completar ahora →',
    expiry: 'Este enlace expirará pronto.',
    preheader: (p) => `Recordatorio: Complete su formulario de ${p}`,
  },
  fr: {
    subject: (p) => `Rappel: Formulaire de consentement de ${p}`,
    body: (p) => `Votre formulaire de consentement de <strong style="color: #0f172a;">${p}</strong> n'a pas encore été rempli.`,
    button: 'Remplir maintenant →',
    expiry: 'Ce lien expirera bientôt.',
    preheader: (p) => `Rappel : Veuillez remplir votre formulaire de ${p}`,
  },
  ar: {
    subject: (p) => `تذكير: نموذج الموافقة من ${p}`,
    body: (p) => `لم يتم تعبئة نموذج الموافقة الخاص بك من <strong style="color: #0f172a;">${p}</strong> بعد.`,
    button: '← أكمل الآن',
    expiry: 'ستنتهي صلاحية هذا الرابط قريباً.',
    preheader: (p) => `تذكير: يرجى إكمال نموذجك من ${p}`,
  },
  tr: {
    subject: (p) => `Hatırlatma: ${p} onay formu`,
    body: (p) => `<strong style="color: #0f172a;">${p}</strong> onay formunuz henüz doldurulmadı.`,
    button: 'Şimdi doldur →',
    expiry: 'Bu bağlantının süresi yakında dolacak.',
    preheader: (p) => `Hatırlatma: ${p} formunuzu doldurun`,
  },
  pl: {
    subject: (p) => `Przypomnienie: Formularz zgody od ${p}`,
    body: (p) => `Twój formularz zgody od <strong style="color: #0f172a;">${p}</strong> nie został jeszcze wypełniony.`,
    button: 'Wypełnij teraz →',
    expiry: 'Ten link wkrótce wygaśnie.',
    preheader: (p) => `Przypomnienie: Wypełnij formularz od ${p}`,
  },
  ru: {
    subject: (p) => `Напоминание: Форма согласия от ${p}`,
    body: (p) => `Ваша форма согласия от <strong style="color: #0f172a;">${p}</strong> ещё не заполнена.`,
    button: 'Заполнить сейчас →',
    expiry: 'Срок действия ссылки скоро истечёт.',
    preheader: (p) => `Напоминание: Заполните форму от ${p}`,
  },
};

export function getConsentReminderSubject(practiceName: string, locale: EmailLocale = 'de'): string {
  return (i18n[locale] || i18n.de).subject(practiceName);
}

export function consentReminderTemplate(
  practiceName: string,
  consentLink: string,
  locale: EmailLocale = 'de',
  brandColor?: string,
): string {
  const t = i18n[locale] || i18n.de;
  const accent = brandColor || '#0f172a';

  const content = `
  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 20px;">${t.body(practiceName)}</p>
  ${ctaButton(t.button, consentLink, accent, true)}
  <p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center;">${t.expiry}</p>`;

  return baseLayout(content, {
    locale,
    preheaderText: t.preheader(practiceName),
    practiceName,
    brandColor,
  });
}
