import { baseLayout, ctaButton } from './base-layout';
import type { EmailLocale } from './types';

const i18n: Record<EmailLocale, {
  subject: string;
  heading: string;
  greeting: (name: string) => string;
  intro: string;
  features: { title: string; desc: string }[];
  button: string;
  help: string;
  preheader: string;
}> = {
  de: {
    subject: 'Willkommen bei DermaConsent',
    heading: 'Willkommen bei DermaConsent!',
    greeting: (n) => `Hallo ${n || 'dort'},`,
    intro: 'Ihr Konto wurde erfolgreich erstellt. Das können Sie jetzt tun:',
    features: [
      { title: 'Einwilligungsformulare', desc: 'Digital erstellen, versenden und verwalten' },
      { title: 'Patientendaten', desc: 'Ende-zu-Ende verschlüsselt speichern' },
      { title: 'DSGVO-Archivierung', desc: 'Konform dokumentieren und exportieren' },
    ],
    button: 'Zum Dashboard →',
    help: 'Fragen? Antworten Sie einfach auf diese E-Mail.',
    preheader: 'Ihr DermaConsent-Konto ist bereit',
  },
  en: {
    subject: 'Welcome to DermaConsent',
    heading: 'Welcome to DermaConsent!',
    greeting: (n) => `Hello ${n || 'there'},`,
    intro: 'Your account has been successfully created. Here\'s what you can do:',
    features: [
      { title: 'Consent forms', desc: 'Create, send, and manage digitally' },
      { title: 'Patient data', desc: 'Store with end-to-end encryption' },
      { title: 'GDPR archival', desc: 'Document and export in compliance' },
    ],
    button: 'Go to Dashboard →',
    help: 'Questions? Just reply to this email.',
    preheader: 'Your DermaConsent account is ready',
  },
  es: {
    subject: 'Bienvenido a DermaConsent',
    heading: '¡Bienvenido a DermaConsent!',
    greeting: (n) => `Hola ${n || ''},`,
    intro: 'Su cuenta ha sido creada exitosamente. Esto es lo que puede hacer:',
    features: [
      { title: 'Formularios de consentimiento', desc: 'Crear, enviar y gestionar digitalmente' },
      { title: 'Datos de pacientes', desc: 'Almacenar con cifrado de extremo a extremo' },
      { title: 'Archivo RGPD', desc: 'Documentar y exportar conforme a la normativa' },
    ],
    button: 'Ir al panel →',
    help: '¿Preguntas? Responda a este correo.',
    preheader: 'Su cuenta de DermaConsent está lista',
  },
  fr: {
    subject: 'Bienvenue sur DermaConsent',
    heading: 'Bienvenue sur DermaConsent !',
    greeting: (n) => `Bonjour ${n || ''},`,
    intro: 'Votre compte a été créé avec succès. Voici ce que vous pouvez faire :',
    features: [
      { title: 'Formulaires de consentement', desc: 'Créer, envoyer et gérer numériquement' },
      { title: 'Données patients', desc: 'Stocker avec chiffrement de bout en bout' },
      { title: 'Archivage RGPD', desc: 'Documenter et exporter en conformité' },
    ],
    button: 'Aller au tableau de bord →',
    help: 'Des questions ? Répondez à cet e-mail.',
    preheader: 'Votre compte DermaConsent est prêt',
  },
  ar: {
    subject: 'مرحباً بك في DermaConsent',
    heading: '!مرحباً بك في DermaConsent',
    greeting: (n) => `مرحباً ${n || ''},`,
    intro: 'تم إنشاء حسابك بنجاح. إليك ما يمكنك فعله:',
    features: [
      { title: 'نماذج الموافقة', desc: 'إنشاء وإرسال وإدارة رقمياً' },
      { title: 'بيانات المرضى', desc: 'تخزين بتشفير من طرف إلى طرف' },
      { title: 'أرشفة GDPR', desc: 'توثيق وتصدير بما يتوافق مع اللوائح' },
    ],
    button: '← الذهاب إلى لوحة التحكم',
    help: 'أسئلة؟ رد على هذا البريد الإلكتروني.',
    preheader: 'حسابك في DermaConsent جاهز',
  },
  tr: {
    subject: 'DermaConsent\'e hoş geldiniz',
    heading: 'DermaConsent\'e hoş geldiniz!',
    greeting: (n) => `Merhaba ${n || ''},`,
    intro: 'Hesabınız başarıyla oluşturuldu. İşte yapabilecekleriniz:',
    features: [
      { title: 'Onay formları', desc: 'Dijital olarak oluşturun, gönderin ve yönetin' },
      { title: 'Hasta verileri', desc: 'Uçtan uca şifreleme ile saklayın' },
      { title: 'KVKK arşivleme', desc: 'Mevzuata uygun belgeleyin ve dışa aktarın' },
    ],
    button: 'Panele git →',
    help: 'Sorularınız mı var? Bu e-postayı yanıtlayın.',
    preheader: 'DermaConsent hesabınız hazır',
  },
  pl: {
    subject: 'Witamy w DermaConsent',
    heading: 'Witamy w DermaConsent!',
    greeting: (n) => `Cześć ${n || ''},`,
    intro: 'Twoje konto zostało pomyślnie utworzone. Oto co możesz zrobić:',
    features: [
      { title: 'Formularze zgody', desc: 'Twórz, wysyłaj i zarządzaj cyfrowo' },
      { title: 'Dane pacjentów', desc: 'Przechowuj z szyfrowaniem end-to-end' },
      { title: 'Archiwizacja RODO', desc: 'Dokumentuj i eksportuj zgodnie z przepisami' },
    ],
    button: 'Przejdź do panelu →',
    help: 'Pytania? Odpowiedz na tego e-maila.',
    preheader: 'Twoje konto DermaConsent jest gotowe',
  },
  ru: {
    subject: 'Добро пожаловать в DermaConsent',
    heading: 'Добро пожаловать в DermaConsent!',
    greeting: (n) => `Здравствуйте, ${n || ''}`,
    intro: 'Ваша учётная запись успешно создана. Вот что вы можете сделать:',
    features: [
      { title: 'Формы согласия', desc: 'Создавайте, отправляйте и управляйте цифрово' },
      { title: 'Данные пациентов', desc: 'Храните со сквозным шифрованием' },
      { title: 'Архивация GDPR', desc: 'Документируйте и экспортируйте в соответствии с нормами' },
    ],
    button: 'Перейти в панель →',
    help: 'Вопросы? Ответьте на это письмо.',
    preheader: 'Ваш аккаунт DermaConsent готов',
  },
};

export function getWelcomeSubject(locale: EmailLocale = 'de'): string {
  return (i18n[locale] || i18n.de).subject;
}

export function welcomeTemplate(userName: string, locale: EmailLocale = 'de'): string {
  const t = i18n[locale] || i18n.de;
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

  const featureRows = t.features.map((f) => `
    <tr>
      <td style="padding: 12px 16px; background-color: #f9fafb; border-radius: 4px;">
        <p style="font-size: 14px; font-weight: 600; color: #0f172a; margin: 0 0 2px;">${f.title}</p>
        <p style="font-size: 13px; color: #6b7280; margin: 0;">${f.desc}</p>
      </td>
    </tr>
    <tr><td style="height: 8px;"></td></tr>`).join('');

  const content = `
  <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.02em;">${t.heading}</h1>
  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 8px;">${t.greeting(userName)}</p>
  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 24px;">${t.intro}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 8px;">
    ${featureRows}
  </table>
  ${ctaButton(t.button, dashboardUrl)}
  <p style="font-size: 13px; color: #9ca3af; margin: 0;">${t.help}</p>`;

  return baseLayout(content, { locale, preheaderText: t.preheader });
}
