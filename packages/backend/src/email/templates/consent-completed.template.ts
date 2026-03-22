import { baseLayout, ctaButton, infoBox } from './base-layout';
import type { EmailLocale } from './types';

const i18n: Record<EmailLocale, {
  subject: (practiceName: string) => string;
  greeting: string;
  body: (practiceName: string, treatmentType: string) => string;
  button: string;
  info: string;
  encryption: string;
  preheader: (practiceName: string) => string;
}> = {
  de: {
    subject: (p) => `Ihre Einwilligungserklärung — ${p}`,
    greeting: 'Sehr geehrte/r Patient/in,',
    body: (p, t) => `Ihre Einwilligungserklärung für <strong style="color: #0f172a;">${t}</strong> bei <strong style="color: #0f172a;">${p}</strong> wurde erfolgreich abgeschlossen. Sie können Ihr Dokument über den folgenden Link einsehen.`,
    button: 'Dokument anzeigen →',
    info: 'Über den Link können Sie die Echtheit Ihres Einwilligungsdokuments verifizieren. Aus Datenschutzgründen werden keine personenbezogenen Daten angezeigt.',
    encryption: '🔒 Ende-zu-Ende verschlüsselt',
    preheader: (p) => `Ihre Einwilligung bei ${p} ist abgeschlossen`,
  },
  en: {
    subject: (p) => `Your consent document — ${p}`,
    greeting: 'Dear Patient,',
    body: (p, t) => `Your consent form for <strong style="color: #0f172a;">${t}</strong> at <strong style="color: #0f172a;">${p}</strong> has been completed successfully. You can view your document using the link below.`,
    button: 'View document →',
    info: 'This link allows you to verify the authenticity of your consent document. For privacy reasons, no personal data is displayed.',
    encryption: '🔒 End-to-end encrypted',
    preheader: (p) => `Your consent at ${p} is complete`,
  },
  es: {
    subject: (p) => `Su documento de consentimiento — ${p}`,
    greeting: 'Estimado/a paciente,',
    body: (p, t) => `Su formulario de consentimiento para <strong style="color: #0f172a;">${t}</strong> en <strong style="color: #0f172a;">${p}</strong> se ha completado con éxito. Puede ver su documento a través del siguiente enlace.`,
    button: 'Ver documento →',
    info: 'Este enlace le permite verificar la autenticidad de su documento de consentimiento. Por razones de privacidad, no se muestran datos personales.',
    encryption: '🔒 Cifrado de extremo a extremo',
    preheader: (p) => `Su consentimiento en ${p} está completo`,
  },
  fr: {
    subject: (p) => `Votre document de consentement — ${p}`,
    greeting: 'Cher(e) Patient(e),',
    body: (p, t) => `Votre formulaire de consentement pour <strong style="color: #0f172a;">${t}</strong> chez <strong style="color: #0f172a;">${p}</strong> a été complété avec succès. Vous pouvez consulter votre document via le lien ci-dessous.`,
    button: 'Voir le document →',
    info: 'Ce lien vous permet de vérifier l\'authenticité de votre document de consentement. Pour des raisons de confidentialité, aucune donnée personnelle n\'est affichée.',
    encryption: '🔒 Chiffrement de bout en bout',
    preheader: (p) => `Votre consentement chez ${p} est terminé`,
  },
  ar: {
    subject: (p) => `مستند الموافقة الخاص بك — ${p}`,
    greeting: 'عزيزي/عزيزتي المريض/ة،',
    body: (p, t) => `تم إكمال نموذج الموافقة الخاص بك لـ <strong style="color: #0f172a;">${t}</strong> في <strong style="color: #0f172a;">${p}</strong> بنجاح. يمكنك عرض المستند الخاص بك عبر الرابط أدناه.`,
    button: 'عرض المستند →',
    info: 'يتيح لك هذا الرابط التحقق من صحة مستند الموافقة الخاص بك. لأسباب تتعلق بالخصوصية، لا يتم عرض أي بيانات شخصية.',
    encryption: '🔒 تشفير من طرف إلى طرف',
    preheader: (p) => `تم إكمال موافقتك في ${p}`,
  },
  tr: {
    subject: (p) => `Onam belgeniz — ${p}`,
    greeting: 'Sayın Hasta,',
    body: (p, t) => `<strong style="color: #0f172a;">${p}</strong> kliniğindeki <strong style="color: #0f172a;">${t}</strong> için onam formunuz başarıyla tamamlandı. Belgenizi aşağıdaki bağlantıdan görüntüleyebilirsiniz.`,
    button: 'Belgeyi görüntüle →',
    info: 'Bu bağlantı, onam belgenizin gerçekliğini doğrulamanızı sağlar. Gizlilik nedeniyle kişisel veriler görüntülenmez.',
    encryption: '🔒 Uçtan uca şifreli',
    preheader: (p) => `${p} kliniğindeki onamınız tamamlandı`,
  },
  pl: {
    subject: (p) => `Twój dokument zgody — ${p}`,
    greeting: 'Szanowny/a Pacjencie/tko,',
    body: (p, t) => `Twój formularz zgody na <strong style="color: #0f172a;">${t}</strong> w <strong style="color: #0f172a;">${p}</strong> został pomyślnie wypełniony. Możesz zobaczyć swój dokument, klikając poniższy link.`,
    button: 'Zobacz dokument →',
    info: 'Ten link pozwala zweryfikować autentyczność dokumentu zgody. Ze względu na ochronę prywatności nie są wyświetlane żadne dane osobowe.',
    encryption: '🔒 Szyfrowanie end-to-end',
    preheader: (p) => `Twoja zgoda w ${p} została zakończona`,
  },
  ru: {
    subject: (p) => `Ваш документ о согласии — ${p}`,
    greeting: 'Уважаемый пациент,',
    body: (p, t) => `Ваша форма согласия на <strong style="color: #0f172a;">${t}</strong> в <strong style="color: #0f172a;">${p}</strong> успешно оформлена. Вы можете просмотреть ваш документ по ссылке ниже.`,
    button: 'Просмотреть документ →',
    info: 'Эта ссылка позволяет проверить подлинность вашего документа о согласии. По соображениям конфиденциальности личные данные не отображаются.',
    encryption: '🔒 Сквозное шифрование',
    preheader: (p) => `Ваше согласие в ${p} оформлено`,
  },
};

export function consentCompletedTemplate(
  practiceName: string,
  treatmentType: string,
  verifyUrl: string,
  locale: EmailLocale = 'de',
  brandColor?: string,
): string {
  const t = i18n[locale] || i18n.de;

  const content = `
    <p style="font-size: 15px; color: #374151; margin: 0 0 16px;">${t.greeting}</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 20px; line-height: 1.6;">
      ${t.body(practiceName, treatmentType)}
    </p>
    ${ctaButton(t.button, verifyUrl, brandColor)}
    <div style="margin-top: 20px;">
      ${infoBox(`<p style="font-size: 13px; color: #6b7280; margin: 0;">${t.info}</p>`)}
    </div>
    <p style="font-size: 13px; color: #9ca3af; margin: 20px 0 0; text-align: center;">
      ${t.encryption}
    </p>
  `;

  return baseLayout(content, {
    locale,
    preheaderText: t.preheader(practiceName),
    practiceName,
    brandColor,
  });
}

export function getConsentCompletedSubject(
  practiceName: string,
  locale: EmailLocale = 'de',
): string {
  const t = i18n[locale] || i18n.de;
  return t.subject(practiceName);
}
