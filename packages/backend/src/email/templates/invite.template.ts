import { baseLayout, ctaButton, infoBox } from './base-layout';
import type { EmailLocale } from './types';

const roleLabels: Record<string, Record<EmailLocale, string>> = {
  ADMIN: { de: 'Administrator', en: 'Administrator', es: 'Administrador', fr: 'Administrateur', ar: 'مدير', tr: 'Yönetici', pl: 'Administrator', ru: 'Администратор' },
  ARZT: { de: 'Arzt', en: 'Doctor', es: 'Médico', fr: 'Médecin', ar: 'طبيب', tr: 'Doktor', pl: 'Lekarz', ru: 'Врач' },
  EMPFANG: { de: 'Empfang', en: 'Reception', es: 'Recepción', fr: 'Réception', ar: 'استقبال', tr: 'Resepsiyon', pl: 'Recepcja', ru: 'Ресепшн' },
  PLATFORM_ADMIN: { de: 'Plattform-Administrator', en: 'Platform Administrator', es: 'Administrador de plataforma', fr: 'Administrateur de plateforme', ar: 'مدير المنصة', tr: 'Platform Yöneticisi', pl: 'Administrator platformy', ru: 'Администратор платформы' },
};

const i18n: Record<EmailLocale, {
  subject: (practiceName: string) => string;
  heading: string;
  body: string;
  practiceLabel: string;
  roleLabel: string;
  button: string;
  expiry: string;
  whatIs: string;
  whatIsDesc: string;
  preheader: (practiceName: string) => string;
}> = {
  de: {
    subject: (p) => `Einladung zu ${p} — DermaConsent`,
    heading: 'Sie wurden eingeladen',
    body: 'Sie wurden eingeladen, einem Team auf DermaConsent beizutreten.',
    practiceLabel: 'Praxis',
    roleLabel: 'Rolle',
    button: 'Einladung annehmen →',
    expiry: 'Diese Einladung ist 7 Tage gültig.',
    whatIs: 'Was ist DermaConsent?',
    whatIsDesc: 'Eine DSGVO-konforme Plattform für digitale Einwilligungsformulare in dermatologischen Praxen — mit Ende-zu-Ende-Verschlüsselung.',
    preheader: (p) => `Sie wurden zu ${p} eingeladen`,
  },
  en: {
    subject: (p) => `Invitation to ${p} — DermaConsent`,
    heading: 'You\'ve been invited',
    body: 'You\'ve been invited to join a team on DermaConsent.',
    practiceLabel: 'Practice',
    roleLabel: 'Role',
    button: 'Accept invitation →',
    expiry: 'This invitation is valid for 7 days.',
    whatIs: 'What is DermaConsent?',
    whatIsDesc: 'A GDPR-compliant platform for digital consent forms in dermatology practices — with end-to-end encryption.',
    preheader: (p) => `You've been invited to join ${p}`,
  },
  es: {
    subject: (p) => `Invitación a ${p} — DermaConsent`,
    heading: 'Ha sido invitado/a',
    body: 'Ha sido invitado/a a unirse a un equipo en DermaConsent.',
    practiceLabel: 'Consulta',
    roleLabel: 'Rol',
    button: 'Aceptar invitación →',
    expiry: 'Esta invitación es válida durante 7 días.',
    whatIs: '¿Qué es DermaConsent?',
    whatIsDesc: 'Una plataforma conforme al RGPD para formularios de consentimiento digital en consultas dermatológicas — con cifrado de extremo a extremo.',
    preheader: (p) => `Ha sido invitado/a a ${p}`,
  },
  fr: {
    subject: (p) => `Invitation à ${p} — DermaConsent`,
    heading: 'Vous avez été invité(e)',
    body: 'Vous avez été invité(e) à rejoindre une équipe sur DermaConsent.',
    practiceLabel: 'Cabinet',
    roleLabel: 'Rôle',
    button: 'Accepter l\'invitation →',
    expiry: 'Cette invitation est valable 7 jours.',
    whatIs: 'Qu\'est-ce que DermaConsent ?',
    whatIsDesc: 'Une plateforme conforme au RGPD pour les formulaires de consentement numériques en dermatologie — avec chiffrement de bout en bout.',
    preheader: (p) => `Vous avez été invité(e) à rejoindre ${p}`,
  },
  ar: {
    subject: (p) => `دعوة إلى ${p} — DermaConsent`,
    heading: 'لقد تمت دعوتك',
    body: 'لقد تمت دعوتك للانضمام إلى فريق على DermaConsent.',
    practiceLabel: 'العيادة',
    roleLabel: 'الدور',
    button: '← قبول الدعوة',
    expiry: 'هذه الدعوة صالحة لمدة 7 أيام.',
    whatIs: 'ما هو DermaConsent؟',
    whatIsDesc: 'منصة متوافقة مع GDPR لنماذج الموافقة الرقمية في عيادات الأمراض الجلدية — مع تشفير من طرف إلى طرف.',
    preheader: (p) => `لقد تمت دعوتك للانضمام إلى ${p}`,
  },
  tr: {
    subject: (p) => `${p} daveti — DermaConsent`,
    heading: 'Davet edildiniz',
    body: 'DermaConsent üzerinde bir ekibe katılmaya davet edildiniz.',
    practiceLabel: 'Klinik',
    roleLabel: 'Rol',
    button: 'Daveti kabul et →',
    expiry: 'Bu davet 7 gün geçerlidir.',
    whatIs: 'DermaConsent nedir?',
    whatIsDesc: 'Dermatoloji kliniklerinde dijital onay formları için KVKK uyumlu bir platform — uçtan uca şifreleme ile.',
    preheader: (p) => `${p} ekibine katılmaya davet edildiniz`,
  },
  pl: {
    subject: (p) => `Zaproszenie do ${p} — DermaConsent`,
    heading: 'Zostałeś/aś zaproszony/a',
    body: 'Zostałeś/aś zaproszony/a do dołączenia do zespołu na DermaConsent.',
    practiceLabel: 'Gabinet',
    roleLabel: 'Rola',
    button: 'Przyjmij zaproszenie →',
    expiry: 'To zaproszenie jest ważne przez 7 dni.',
    whatIs: 'Czym jest DermaConsent?',
    whatIsDesc: 'Platforma zgodna z RODO do cyfrowych formularzy zgody w gabinetach dermatologicznych — z szyfrowaniem end-to-end.',
    preheader: (p) => `Zostałeś/aś zaproszony/a do ${p}`,
  },
  ru: {
    subject: (p) => `Приглашение в ${p} — DermaConsent`,
    heading: 'Вас пригласили',
    body: 'Вас пригласили присоединиться к команде на DermaConsent.',
    practiceLabel: 'Клиника',
    roleLabel: 'Роль',
    button: 'Принять приглашение →',
    expiry: 'Это приглашение действительно 7 дней.',
    whatIs: 'Что такое DermaConsent?',
    whatIsDesc: 'GDPR-совместимая платформа для цифровых форм согласия в дерматологических клиниках — со сквозным шифрованием.',
    preheader: (p) => `Вас пригласили присоединиться к ${p}`,
  },
};

export function getInviteSubject(practiceName: string, locale: EmailLocale = 'de'): string {
  return (i18n[locale] || i18n.de).subject(practiceName);
}

export function inviteTemplate(practiceName: string, role: string, inviteLink: string, locale: EmailLocale = 'de'): string {
  const t = i18n[locale] || i18n.de;
  const roleLabel = roleLabels[role]?.[locale] || role;

  const content = `
  <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px; letter-spacing: -0.02em;">${t.heading}</h1>
  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 20px;">${t.body}</p>

  ${infoBox(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 0 0 8px;">
          <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;">${t.practiceLabel}</span><br>
          <span style="font-size: 15px; font-weight: 600; color: #0f172a;">${practiceName}</span>
        </td>
      </tr>
      <tr>
        <td>
          <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;">${t.roleLabel}</span><br>
          <span style="display: inline-block; font-size: 13px; font-weight: 500; color: #374151; background-color: #f3f4f6; padding: 2px 10px; border-radius: 12px; margin-top: 4px;">${roleLabel}</span>
        </td>
      </tr>
    </table>
  `)}

  ${ctaButton(t.button, inviteLink)}
  <p style="font-size: 13px; color: #9ca3af; margin: 0 0 24px;">${t.expiry}</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 20px;">
  <p style="font-size: 13px; font-weight: 600; color: #6b7280; margin: 0 0 6px;">${t.whatIs}</p>
  <p style="font-size: 13px; line-height: 1.5; color: #9ca3af; margin: 0;">${t.whatIsDesc}</p>`;

  return baseLayout(content, { locale, preheaderText: t.preheader(practiceName) });
}
