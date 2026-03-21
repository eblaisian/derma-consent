import { baseLayout, ctaButton, infoBox } from './base-layout';
import type { EmailLocale } from './types';

const i18n: Record<EmailLocale, {
  subject: string;
  greeting: string;
  body: string;
  button: string;
  expiry: string;
  nextStep: string;
  preheader: string;
}> = {
  de: {
    subject: 'E-Mail bestätigen — DermaConsent',
    greeting: 'Vielen Dank für Ihre Registrierung!',
    body: 'Bitte bestätigen Sie Ihre E-Mail-Adresse, um loszulegen.',
    button: 'E-Mail bestätigen →',
    expiry: 'Dieser Link ist 24 Stunden gültig.',
    nextStep: 'Nach der Bestätigung können Sie Ihre Praxis einrichten und sofort loslegen.',
    preheader: 'Bestätigen Sie Ihre E-Mail-Adresse für DermaConsent',
  },
  en: {
    subject: 'Verify email — DermaConsent',
    greeting: 'Thank you for registering!',
    body: 'Please verify your email address to get started.',
    button: 'Verify email →',
    expiry: 'This link is valid for 24 hours.',
    nextStep: 'Once verified, you can set up your practice and start right away.',
    preheader: 'Verify your email address for DermaConsent',
  },
  es: {
    subject: 'Verificar correo — DermaConsent',
    greeting: '¡Gracias por registrarse!',
    body: 'Verifique su dirección de correo para comenzar.',
    button: 'Verificar correo →',
    expiry: 'Este enlace es válido durante 24 horas.',
    nextStep: 'Una vez verificado, puede configurar su consulta y comenzar de inmediato.',
    preheader: 'Verifique su dirección de correo para DermaConsent',
  },
  fr: {
    subject: 'Vérifier l\'e-mail — DermaConsent',
    greeting: 'Merci de vous être inscrit(e) !',
    body: 'Veuillez vérifier votre adresse e-mail pour commencer.',
    button: 'Vérifier l\'e-mail →',
    expiry: 'Ce lien est valable 24 heures.',
    nextStep: 'Une fois vérifié, vous pourrez configurer votre cabinet et commencer immédiatement.',
    preheader: 'Vérifiez votre adresse e-mail pour DermaConsent',
  },
  ar: {
    subject: 'تأكيد البريد الإلكتروني — DermaConsent',
    greeting: '!شكراً لتسجيلك',
    body: 'يرجى تأكيد عنوان بريدك الإلكتروني للبدء.',
    button: '← تأكيد البريد الإلكتروني',
    expiry: 'هذا الرابط صالح لمدة 24 ساعة.',
    nextStep: 'بعد التأكيد، يمكنك إعداد عيادتك والبدء فوراً.',
    preheader: 'أكد عنوان بريدك الإلكتروني لـ DermaConsent',
  },
  tr: {
    subject: 'E-posta doğrulama — DermaConsent',
    greeting: 'Kaydınız için teşekkürler!',
    body: 'Başlamak için lütfen e-posta adresinizi doğrulayın.',
    button: 'E-postayı doğrula →',
    expiry: 'Bu bağlantı 24 saat geçerlidir.',
    nextStep: 'Doğrulandıktan sonra kliniğinizi kurabilir ve hemen başlayabilirsiniz.',
    preheader: 'DermaConsent için e-posta adresinizi doğrulayın',
  },
  pl: {
    subject: 'Potwierdź e-mail — DermaConsent',
    greeting: 'Dziękujemy za rejestrację!',
    body: 'Potwierdź swój adres e-mail, aby rozpocząć.',
    button: 'Potwierdź e-mail →',
    expiry: 'Ten link jest ważny przez 24 godziny.',
    nextStep: 'Po potwierdzeniu możesz skonfigurować swój gabinet i od razu zacząć.',
    preheader: 'Potwierdź swój adres e-mail dla DermaConsent',
  },
  ru: {
    subject: 'Подтверждение e-mail — DermaConsent',
    greeting: 'Спасибо за регистрацию!',
    body: 'Пожалуйста, подтвердите ваш адрес электронной почты, чтобы начать.',
    button: 'Подтвердить e-mail →',
    expiry: 'Эта ссылка действительна 24 часа.',
    nextStep: 'После подтверждения вы сможете настроить свою клинику и сразу начать работу.',
    preheader: 'Подтвердите ваш e-mail для DermaConsent',
  },
};

export function getEmailVerificationSubject(locale: EmailLocale = 'de'): string {
  return (i18n[locale] || i18n.de).subject;
}

export function emailVerificationTemplate(verifyLink: string, locale: EmailLocale = 'de'): string {
  const t = i18n[locale] || i18n.de;

  const content = `
  <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px; letter-spacing: -0.02em;">${t.greeting}</h1>
  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 4px;">${t.body}</p>
  ${ctaButton(t.button, verifyLink)}
  <p style="font-size: 13px; color: #6b7280; margin: 0 0 20px;">${t.expiry}</p>
  ${infoBox(`<p style="font-size: 13px; color: #6b7280; margin: 0;">${t.nextStep}</p>`)}`;

  return baseLayout(content, { locale, preheaderText: t.preheader });
}
