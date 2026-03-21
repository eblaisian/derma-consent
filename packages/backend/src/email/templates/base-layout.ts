import type { BaseLayoutOptions } from './types';
import { RTL_LOCALES } from './types';

const footerText: Record<string, { sentVia: string; impressum: string }> = {
  de: { sentVia: 'Gesendet über DermaConsent', impressum: 'Impressum' },
  en: { sentVia: 'Sent via DermaConsent', impressum: 'Legal Notice' },
  es: { sentVia: 'Enviado a través de DermaConsent', impressum: 'Aviso legal' },
  fr: { sentVia: 'Envoyé via DermaConsent', impressum: 'Mentions légales' },
  ar: { sentVia: 'أُرسل عبر DermaConsent', impressum: 'بيان قانوني' },
  tr: { sentVia: 'DermaConsent üzerinden gönderildi', impressum: 'Yasal Bildirim' },
  pl: { sentVia: 'Wysłano przez DermaConsent', impressum: 'Nota prawna' },
  ru: { sentVia: 'Отправлено через DermaConsent', impressum: 'Правовая информация' },
};

export function baseLayout(content: string, opts: BaseLayoutOptions): string {
  const { locale, preheaderText, practiceName, brandColor = '#0f172a' } = opts;
  const ft = footerText[locale] || footerText.de;
  const impressumUrl = 'https://consent.eblaisian.com/impressum';
  const isRtl = RTL_LOCALES.includes(locale);
  const dir = isRtl ? 'rtl' : 'ltr';
  const align = isRtl ? 'right' : 'left';

  const preheader = preheaderText
    ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheaderText}</span>`
    : '';

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    body { margin: 0; padding: 0; }
    a { color: ${brandColor}; }
    @media (prefers-color-scheme: dark) {
      .email-outer { background-color: #1a1a1a !important; }
      .email-card { background-color: #2a2a2a !important; border-color: #3a3a3a !important; }
      .email-header { border-color: #3a3a3a !important; }
      .email-body-text { color: #e5e5e5 !important; }
      .email-muted { color: #a3a3a3 !important; }
      .email-footer { border-color: #3a3a3a !important; color: #737373 !important; }
      .email-footer a { color: #737373 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #374151; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; direction: ${dir};">
  ${preheader}
  <table role="presentation" class="email-outer" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;" dir="${dir}">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Header -->
        <table role="presentation" class="email-header" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
          <tr>
            <td style="padding: 0 0 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="${align}" style="font-size: 15px; font-weight: 600; color: #0f172a; letter-spacing: -0.01em;">DermaConsent</td>
                  ${practiceName ? `<td align="${isRtl ? 'left' : 'right'}" style="font-size: 13px; color: #9ca3af;">${practiceName}</td>` : ''}
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" class="email-card" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 48px; text-align: ${align};" class="email-body-text">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" class="email-footer" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
          <tr>
            <td style="padding: 20px 0 0; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
                ${ft.sentVia} · <a href="${impressumUrl}" style="color: #9ca3af; text-decoration: underline;">${ft.impressum}</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ctaButton(text: string, href: string, color?: string, fullWidth?: boolean): string {
  const bg = color || '#0f172a';
  const widthStyle = fullWidth ? 'display: block; text-align: center; width: 100%; box-sizing: border-box;' : 'display: inline-block;';
  return `<table role="presentation" cellpadding="0" cellspacing="0" ${fullWidth ? 'width="100%"' : ''} style="margin: 24px 0;">
    <tr>
      <td align="center" style="border-radius: 6px; background-color: ${bg};">
        <a href="${href}" style="${widthStyle} background-color: ${bg}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; line-height: 1;">${text}</a>
      </td>
    </tr>
  </table>`;
}

export function calloutBox(content: string, opts?: { borderColor?: string; bgColor?: string }): string {
  const border = opts?.borderColor || '#e5e7eb';
  const bg = opts?.bgColor || '#f9fafb';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
    <tr>
      <td style="background-color: ${bg}; border-left: 3px solid ${border}; border-radius: 4px; padding: 16px 20px;">
        ${content}
      </td>
    </tr>
  </table>`;
}

export function infoBox(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
    <tr>
      <td style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px 20px;">
        ${content}
      </td>
    </tr>
  </table>`;
}

export function stripHtmlToText(html: string): string {
  let text = html;
  text = text.replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|div|tr|h[1-6])>/gi, '\n\n');
  text = text.replace(/<li[^>]*>/gi, '- ');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<hr[^>]*>/gi, '\n---\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.split('\n').map((l) => l.trim()).join('\n');
  return text.trim();
}
