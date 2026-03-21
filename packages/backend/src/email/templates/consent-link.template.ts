import { baseLayout, ctaButton, infoBox } from './base-layout';
import type { EmailLocale } from './types';

const i18n: Record<EmailLocale, {
  subject: (practiceName: string) => string;
  greeting: string;
  body: (practiceName: string) => string;
  button: string;
  expiry: (days: number) => string;
  encryption: string;
  preheader: (practiceName: string) => string;
}> = {
  de: {
    subject: (p) => `Einwilligungsformular von ${p}`,
    greeting: 'Sehr geehrte/r Patient/in,',
    body: (p) => `die Praxis <strong style="color: #0f172a;">${p}</strong> hat ein digitales Einwilligungsformular für Sie erstellt. Bitte füllen Sie es über den folgenden Link aus.`,
    button: 'Formular öffnen →',
    expiry: (d) => `Gültig für ${d} Tage`,
    encryption: '🔒 Ihre Daten werden Ende-zu-Ende verschlüsselt übertragen',
    preheader: (p) => `${p} hat ein Einwilligungsformular für Sie erstellt`,
  },
  en: {
    subject: (p) => `Consent form from ${p}`,
    greeting: 'Dear Patient,',
    body: (p) => `The practice <strong style="color: #0f172a;">${p}</strong> has created a digital consent form for you. Please complete it using the link below.`,
    button: 'Open form →',
    expiry: (d) => `Valid for ${d} days`,
    encryption: '🔒 Your data is transmitted with end-to-end encryption',
    preheader: (p) => `${p} has created a consent form for you`,
  },
  es: {
    subject: (p) => `Formulario de consentimiento de ${p}`,
    greeting: 'Estimado/a paciente,',
    body: (p) => `La consulta <strong style="color: #0f172a;">${p}</strong> ha creado un formulario de consentimiento digital para usted. Por favor, complételo a través del siguiente enlace.`,
    button: 'Abrir formulario →',
    expiry: (d) => `Válido durante ${d} días`,
    encryption: '🔒 Sus datos se transmiten con cifrado de extremo a extremo',
    preheader: (p) => `${p} ha creado un formulario de consentimiento para usted`,
  },
  fr: {
    subject: (p) => `Formulaire de consentement de ${p}`,
    greeting: 'Cher/e patient/e,',
    body: (p) => `Le cabinet <strong style="color: #0f172a;">${p}</strong> a créé un formulaire de consentement numérique pour vous. Veuillez le remplir via le lien ci-dessous.`,
    button: 'Ouvrir le formulaire →',
    expiry: (d) => `Valable ${d} jours`,
    encryption: '🔒 Vos données sont transmises avec un chiffrement de bout en bout',
    preheader: (p) => `${p} a créé un formulaire de consentement pour vous`,
  },
  ar: {
    subject: (p) => `نموذج الموافقة من ${p}`,
    greeting: 'عزيزي/عزيزتي المريض/ة،',
    body: (p) => `قامت العيادة <strong style="color: #0f172a;">${p}</strong> بإنشاء نموذج موافقة رقمي لك. يرجى تعبئته عبر الرابط أدناه.`,
    button: '← فتح النموذج',
    expiry: (d) => `صالح لمدة ${d} أيام`,
    encryption: '🔒 يتم نقل بياناتك بتشفير من طرف إلى طرف',
    preheader: (p) => `${p} أنشأت نموذج موافقة لك`,
  },
  tr: {
    subject: (p) => `${p} onay formu`,
    greeting: 'Sayın Hasta,',
    body: (p) => `<strong style="color: #0f172a;">${p}</strong> kliniği sizin için dijital bir onay formu oluşturdu. Lütfen aşağıdaki bağlantıyı kullanarak doldurun.`,
    button: 'Formu aç →',
    expiry: (d) => `${d} gün geçerli`,
    encryption: '🔒 Verileriniz uçtan uca şifreleme ile iletilir',
    preheader: (p) => `${p} sizin için bir onay formu oluşturdu`,
  },
  pl: {
    subject: (p) => `Formularz zgody od ${p}`,
    greeting: 'Szanowny/a Pacjencie/Pacjentko,',
    body: (p) => `Gabinet <strong style="color: #0f172a;">${p}</strong> utworzył dla Ciebie cyfrowy formularz zgody. Prosimy o wypełnienie go za pomocą poniższego linku.`,
    button: 'Otwórz formularz →',
    expiry: (d) => `Ważny przez ${d} dni`,
    encryption: '🔒 Twoje dane są przesyłane z szyfrowaniem end-to-end',
    preheader: (p) => `${p} utworzył formularz zgody dla Ciebie`,
  },
  ru: {
    subject: (p) => `Форма согласия от ${p}`,
    greeting: 'Уважаемый(ая) пациент(ка),',
    body: (p) => `Клиника <strong style="color: #0f172a;">${p}</strong> создала для вас цифровую форму согласия. Пожалуйста, заполните её по ссылке ниже.`,
    button: 'Открыть форму →',
    expiry: (d) => `Действительна ${d} дней`,
    encryption: '🔒 Ваши данные передаются со сквозным шифрованием',
    preheader: (p) => `${p} создала форму согласия для вас`,
  },
};

export function getConsentLinkSubject(practiceName: string, locale: EmailLocale = 'de'): string {
  return (i18n[locale] || i18n.de).subject(practiceName);
}

export function consentLinkTemplate(
  practiceName: string,
  consentLink: string,
  expiryDays: number,
  locale: EmailLocale = 'de',
  brandColor?: string,
): string {
  const t = i18n[locale] || i18n.de;
  const accent = brandColor || '#0f172a';

  const content = `
  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 20px;">${t.greeting}</p>
  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 24px;">${t.body(practiceName)}</p>
  ${ctaButton(t.button, consentLink, accent, true)}
  ${infoBox(`
    <p style="font-size: 13px; color: #6b7280; margin: 0 0 6px;">${t.expiry(expiryDays)}</p>
    <p style="font-size: 13px; color: #6b7280; margin: 0;">${t.encryption}</p>
  `)}`;

  return baseLayout(content, {
    locale,
    preheaderText: t.preheader(practiceName),
    practiceName,
    brandColor,
  });
}
