import { baseLayout, ctaButton, infoBox } from './base-layout';
import type { EmailLocale } from './types';

const i18n: Record<EmailLocale, {
  subject: string;
  body: string;
  button: string;
  expiry: string;
  ignore: string;
  security: string;
  preheader: string;
}> = {
  de: {
    subject: 'Passwort zurücksetzen — DermaConsent',
    body: 'Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.',
    button: 'Passwort zurücksetzen →',
    expiry: 'Dieser Link ist 1 Stunde gültig.',
    ignore: 'Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.',
    security: '🔒 Dieser Link kann nur einmal verwendet werden',
    preheader: 'Setzen Sie Ihr DermaConsent-Passwort zurück',
  },
  en: {
    subject: 'Reset password — DermaConsent',
    body: 'You have received a request to reset your password.',
    button: 'Reset password →',
    expiry: 'This link is valid for 1 hour.',
    ignore: 'If you did not request this, please ignore this email.',
    security: '🔒 This link can only be used once',
    preheader: 'Reset your DermaConsent password',
  },
  es: {
    subject: 'Restablecer contraseña — DermaConsent',
    body: 'Ha recibido una solicitud para restablecer su contraseña.',
    button: 'Restablecer contraseña →',
    expiry: 'Este enlace es válido durante 1 hora.',
    ignore: 'Si no solicitó esto, ignore este correo.',
    security: '🔒 Este enlace solo se puede usar una vez',
    preheader: 'Restablezca su contraseña de DermaConsent',
  },
  fr: {
    subject: 'Réinitialiser le mot de passe — DermaConsent',
    body: 'Vous avez reçu une demande de réinitialisation de votre mot de passe.',
    button: 'Réinitialiser le mot de passe →',
    expiry: 'Ce lien est valable 1 heure.',
    ignore: 'Si vous n\'avez pas fait cette demande, ignorez cet e-mail.',
    security: '🔒 Ce lien ne peut être utilisé qu\'une seule fois',
    preheader: 'Réinitialisez votre mot de passe DermaConsent',
  },
  ar: {
    subject: 'إعادة تعيين كلمة المرور — DermaConsent',
    body: 'لقد تلقيت طلباً لإعادة تعيين كلمة المرور الخاصة بك.',
    button: '← إعادة تعيين كلمة المرور',
    expiry: 'هذا الرابط صالح لمدة ساعة واحدة.',
    ignore: 'إذا لم تطلب ذلك، يرجى تجاهل هذا البريد الإلكتروني.',
    security: '🔒 يمكن استخدام هذا الرابط مرة واحدة فقط',
    preheader: 'أعد تعيين كلمة مرور DermaConsent',
  },
  tr: {
    subject: 'Şifre sıfırlama — DermaConsent',
    body: 'Şifrenizi sıfırlamak için bir istek aldınız.',
    button: 'Şifreyi sıfırla →',
    expiry: 'Bu bağlantı 1 saat geçerlidir.',
    ignore: 'Bunu talep etmediyseniz, bu e-postayı görmezden gelin.',
    security: '🔒 Bu bağlantı yalnızca bir kez kullanılabilir',
    preheader: 'DermaConsent şifrenizi sıfırlayın',
  },
  pl: {
    subject: 'Resetowanie hasła — DermaConsent',
    body: 'Otrzymałeś/aś prośbę o zresetowanie hasła.',
    button: 'Zresetuj hasło →',
    expiry: 'Ten link jest ważny przez 1 godzinę.',
    ignore: 'Jeśli nie prosiłeś/aś o to, zignoruj tego e-maila.',
    security: '🔒 Ten link może być użyty tylko raz',
    preheader: 'Zresetuj swoje hasło DermaConsent',
  },
  ru: {
    subject: 'Сброс пароля — DermaConsent',
    body: 'Вы получили запрос на сброс пароля.',
    button: 'Сбросить пароль →',
    expiry: 'Эта ссылка действительна 1 час.',
    ignore: 'Если вы не запрашивали это, проигнорируйте это письмо.',
    security: '🔒 Эта ссылка может быть использована только один раз',
    preheader: 'Сбросьте пароль DermaConsent',
  },
};

export function getPasswordResetSubject(locale: EmailLocale = 'de'): string {
  return (i18n[locale] || i18n.de).subject;
}

export function passwordResetTemplate(resetLink: string, locale: EmailLocale = 'de'): string {
  const t = i18n[locale] || i18n.de;

  const content = `
  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 4px;">${t.body}</p>
  ${ctaButton(t.button, resetLink)}
  <p style="font-size: 13px; color: #6b7280; margin: 0 0 6px;">${t.expiry}</p>
  <p style="font-size: 13px; color: #6b7280; margin: 0 0 20px;">${t.ignore}</p>
  ${infoBox(`<p style="font-size: 13px; color: #6b7280; margin: 0;">${t.security}</p>`)}`;

  return baseLayout(content, { locale, preheaderText: t.preheader });
}
