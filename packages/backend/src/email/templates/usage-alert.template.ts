import { baseLayout, ctaButton, calloutBox } from './base-layout';
import type { EmailLocale } from './types';

const RESOURCE_LABELS: Record<string, Record<EmailLocale, string>> = {
  SMS: {
    de: 'SMS', en: 'SMS', es: 'SMS', fr: 'SMS',
    ar: 'الرسائل القصيرة', tr: 'SMS', pl: 'SMS', ru: 'SMS',
  },
  EMAIL: {
    de: 'E-Mail', en: 'Email', es: 'Correo electrónico', fr: 'E-mail',
    ar: 'البريد الإلكتروني', tr: 'E-posta', pl: 'E-mail', ru: 'Электронная почта',
  },
  AI_EXPLAINER: {
    de: 'KI-Erklärer', en: 'AI Explainer', es: 'Explicador IA', fr: 'Explicateur IA',
    ar: 'مُفسر الذكاء الاصطناعي', tr: 'Yapay Zeka Açıklayıcı', pl: 'Wyjaśniacz AI', ru: 'ИИ-объяснитель',
  },
  STORAGE_BYTES: {
    de: 'Speicher', en: 'Storage', es: 'Almacenamiento', fr: 'Stockage',
    ar: 'التخزين', tr: 'Depolama', pl: 'Pamięć', ru: 'Хранилище',
  },
};

const i18n: Record<EmailLocale, {
  subject: (resource: string, percent: number) => string;
  heading: string;
  body: (resource: string, percent: number, used: string, limit: string) => string;
  cta: string;
  button: string;
  preheader: (resource: string, percent: number) => string;
}> = {
  de: {
    subject: (r, p) => `Nutzungslimit: ${r} bei ${p}%`,
    heading: 'Nutzungslimit fast erreicht',
    body: (r, p, used, limit) =>
      `Ihre <strong style="color: #0f172a;">${r}</strong>-Nutzung hat <strong style="color: #0f172a;">${p}%</strong> des monatlichen Limits erreicht (<strong>${used}</strong> von <strong>${limit}</strong>).`,
    cta: 'Erwägen Sie ein Upgrade Ihres Tarifs, um Unterbrechungen zu vermeiden.',
    button: 'Tarif upgraden →',
    preheader: (r, p) => `${r}-Nutzung bei ${p}%`,
  },
  en: {
    subject: (r, p) => `Usage limit: ${r} at ${p}%`,
    heading: 'Usage limit almost reached',
    body: (r, p, used, limit) =>
      `Your <strong style="color: #0f172a;">${r}</strong> usage has reached <strong style="color: #0f172a;">${p}%</strong> of the monthly limit (<strong>${used}</strong> of <strong>${limit}</strong>).`,
    cta: 'Consider upgrading your plan to avoid service interruptions.',
    button: 'Upgrade plan →',
    preheader: (r, p) => `${r} usage at ${p}%`,
  },
  es: {
    subject: (r, p) => `Límite de uso: ${r} al ${p}%`,
    heading: 'Límite de uso casi alcanzado',
    body: (r, p, used, limit) =>
      `Su uso de <strong style="color: #0f172a;">${r}</strong> ha alcanzado el <strong style="color: #0f172a;">${p}%</strong> del límite mensual (<strong>${used}</strong> de <strong>${limit}</strong>).`,
    cta: 'Considere actualizar su plan para evitar interrupciones del servicio.',
    button: 'Actualizar plan →',
    preheader: (r, p) => `Uso de ${r} al ${p}%`,
  },
  fr: {
    subject: (r, p) => `Limite d'utilisation : ${r} à ${p}%`,
    heading: 'Limite d\'utilisation presque atteinte',
    body: (r, p, used, limit) =>
      `Votre utilisation de <strong style="color: #0f172a;">${r}</strong> a atteint <strong style="color: #0f172a;">${p}%</strong> de la limite mensuelle (<strong>${used}</strong> sur <strong>${limit}</strong>).`,
    cta: 'Envisagez de mettre à niveau votre forfait pour éviter les interruptions de service.',
    button: 'Mettre à niveau →',
    preheader: (r, p) => `Utilisation de ${r} à ${p}%`,
  },
  ar: {
    subject: (r, p) => `حد الاستخدام: ${r} عند ${p}%`,
    heading: 'حد الاستخدام شارف على الانتهاء',
    body: (r, p, used, limit) =>
      `وصل استخدامك لـ <strong style="color: #0f172a;">${r}</strong> إلى <strong style="color: #0f172a;">${p}%</strong> من الحد الشهري (<strong>${used}</strong> من <strong>${limit}</strong>).`,
    cta: 'فكر في ترقية خطتك لتجنب انقطاع الخدمة.',
    button: '← ترقية الخطة',
    preheader: (r, p) => `استخدام ${r} عند ${p}%`,
  },
  tr: {
    subject: (r, p) => `Kullanım limiti: ${r} %${p}`,
    heading: 'Kullanım limitine yaklaşıldı',
    body: (r, p, used, limit) =>
      `<strong style="color: #0f172a;">${r}</strong> kullanımınız aylık limitin <strong style="color: #0f172a;">%${p}</strong>'ine ulaştı (<strong>${used}</strong> / <strong>${limit}</strong>).`,
    cta: 'Hizmet kesintilerini önlemek için planınızı yükseltmeyi düşünün.',
    button: 'Planı yükselt →',
    preheader: (r, p) => `${r} kullanımı %${p}`,
  },
  pl: {
    subject: (r, p) => `Limit użycia: ${r} na ${p}%`,
    heading: 'Limit użycia prawie osiągnięty',
    body: (r, p, used, limit) =>
      `Twoje użycie <strong style="color: #0f172a;">${r}</strong> osiągnęło <strong style="color: #0f172a;">${p}%</strong> miesięcznego limitu (<strong>${used}</strong> z <strong>${limit}</strong>).`,
    cta: 'Rozważ ulepszenie planu, aby uniknąć przerw w usłudze.',
    button: 'Ulepsz plan →',
    preheader: (r, p) => `Użycie ${r} na ${p}%`,
  },
  ru: {
    subject: (r, p) => `Лимит использования: ${r} на ${p}%`,
    heading: 'Лимит использования почти достигнут',
    body: (r, p, used, limit) =>
      `Использование <strong style="color: #0f172a;">${r}</strong> достигло <strong style="color: #0f172a;">${p}%</strong> месячного лимита (<strong>${used}</strong> из <strong>${limit}</strong>).`,
    cta: 'Рассмотрите возможность обновления тарифа, чтобы избежать перебоев в обслуживании.',
    button: 'Обновить тариф →',
    preheader: (r, p) => `Использование ${r} на ${p}%`,
  },
};

function formatStorageValue(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  return `${bytes} B`;
}

export function getUsageAlertSubject(
  resource: string,
  percentUsed: number,
  locale: EmailLocale = 'de',
): string {
  const t = i18n[locale] || i18n.de;
  const label = RESOURCE_LABELS[resource]?.[locale] || resource;
  return t.subject(label, percentUsed);
}

export function usageAlertTemplate(
  resource: string,
  percentUsed: number,
  used: number,
  limit: number,
  locale: EmailLocale = 'de',
): string {
  const t = i18n[locale] || i18n.de;
  const label = RESOURCE_LABELS[resource]?.[locale] || resource;
  const billingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing`;

  const usedStr = resource === 'STORAGE_BYTES' ? formatStorageValue(used) : String(used);
  const limitStr = resource === 'STORAGE_BYTES' ? formatStorageValue(limit) : String(limit);

  const content = `
  <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.02em;">${t.heading}</h1>
  ${calloutBox(
    `<p style="font-size: 15px; line-height: 1.5; color: #92400e; margin: 0;">${t.body(label, percentUsed, usedStr, limitStr)}</p>`,
    { borderColor: '#d97706', bgColor: '#fffbeb' },
  )}
  <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 4px;">${t.cta}</p>
  ${ctaButton(t.button, billingUrl)}`;

  return baseLayout(content, { locale, preheaderText: t.preheader(label, percentUsed) });
}
