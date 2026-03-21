import { baseLayout, ctaButton, calloutBox, infoBox, stripHtmlToText } from './base-layout';
import type { EmailLocale } from './types';

describe('baseLayout', () => {
  it('contains DOCTYPE and viewport meta', () => {
    const html = baseLayout('<p>Hello</p>', { locale: 'en' });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain('width=device-width');
  });

  it('contains dark mode meta tags', () => {
    const html = baseLayout('<p>Hello</p>', { locale: 'en' });
    expect(html).toContain('color-scheme');
    expect(html).toContain('prefers-color-scheme: dark');
  });

  it('contains Impressum link', () => {
    const html = baseLayout('<p>Hello</p>', { locale: 'de' });
    expect(html).toContain('derma-consent.de/impressum');
    expect(html).toContain('Impressum');
  });

  it('contains DermaConsent wordmark in header', () => {
    const html = baseLayout('<p>Test</p>', { locale: 'en' });
    expect(html).toContain('DermaConsent');
  });

  it.each(['de', 'en', 'es', 'fr', 'ar', 'tr', 'pl', 'ru'] as EmailLocale[])('sets lang="%s" attribute', (locale) => {
    const html = baseLayout('<p>Test</p>', { locale });
    expect(html).toContain(`lang="${locale}"`);
  });

  it('sets dir="rtl" for Arabic', () => {
    const html = baseLayout('<p>Test</p>', { locale: 'ar' });
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('direction: rtl');
  });

  it('sets dir="ltr" for non-RTL locales', () => {
    const html = baseLayout('<p>Test</p>', { locale: 'en' });
    expect(html).toContain('dir="ltr"');
  });

  it('has footer text for all 8 locales', () => {
    expect(baseLayout('', { locale: 'ar' })).toContain('أُرسل عبر DermaConsent');
    expect(baseLayout('', { locale: 'tr' })).toContain('DermaConsent üzerinden gönderildi');
    expect(baseLayout('', { locale: 'pl' })).toContain('Wysłano przez DermaConsent');
    expect(baseLayout('', { locale: 'ru' })).toContain('Отправлено через DermaConsent');
  });

  it('renders preheader when provided', () => {
    const html = baseLayout('<p>Test</p>', { locale: 'en', preheaderText: 'Preview text here' });
    expect(html).toContain('Preview text here');
    expect(html).toContain('display:none');
  });

  it('omits preheader when not provided', () => {
    const html = baseLayout('<p>Test</p>', { locale: 'en' });
    expect(html).not.toContain('display:none;font-size:1px');
  });

  it('renders practice name in header when provided', () => {
    const html = baseLayout('<p>Test</p>', { locale: 'en', practiceName: 'Dr. Mueller' });
    expect(html).toContain('Dr. Mueller');
  });

  it('uses custom brandColor in link styles', () => {
    const html = baseLayout('<p>Test</p>', { locale: 'en', brandColor: '#ff0000' });
    expect(html).toContain('#ff0000');
  });

  it('defaults brandColor to #0f172a', () => {
    const html = baseLayout('<p>Test</p>', { locale: 'en' });
    expect(html).toContain('color: #0f172a');
  });

  it('uses 560px max-width card', () => {
    const html = baseLayout('<p>Test</p>', { locale: 'en' });
    expect(html).toContain('max-width: 560px');
  });

  it('uses faint border instead of shadow on card', () => {
    const html = baseLayout('<p>Test</p>', { locale: 'en' });
    expect(html).toContain('border: 1px solid #e5e7eb');
    expect(html).not.toContain('box-shadow');
  });

  it('uses localized footer text for each locale', () => {
    expect(baseLayout('', { locale: 'de' })).toContain('Gesendet über DermaConsent');
    expect(baseLayout('', { locale: 'en' })).toContain('Sent via DermaConsent');
    expect(baseLayout('', { locale: 'es' })).toContain('Enviado a través de DermaConsent');
    expect(baseLayout('', { locale: 'fr' })).toContain('Envoyé via DermaConsent');
  });
});

describe('ctaButton', () => {
  it('renders button with href and text', () => {
    const html = ctaButton('Click me', 'https://example.com');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('Click me');
  });

  it('uses custom color', () => {
    const html = ctaButton('Click', 'https://example.com', '#b91c1c');
    expect(html).toContain('#b91c1c');
  });

  it('defaults to #0f172a', () => {
    const html = ctaButton('Click', 'https://example.com');
    expect(html).toContain('#0f172a');
  });

  it('renders full-width when requested', () => {
    const html = ctaButton('Click', 'https://example.com', undefined, true);
    expect(html).toContain('width="100%"');
  });

  it('uses table-based structure for Outlook compatibility', () => {
    const html = ctaButton('Click', 'https://example.com');
    expect(html).toContain('role="presentation"');
  });
});

describe('calloutBox', () => {
  it('renders with default colors', () => {
    const html = calloutBox('<p>Warning text</p>');
    expect(html).toContain('Warning text');
    expect(html).toContain('border-left: 3px solid');
    expect(html).toContain('#f9fafb');
  });

  it('renders with custom colors', () => {
    const html = calloutBox('<p>Alert</p>', { borderColor: '#d97706', bgColor: '#fffbeb' });
    expect(html).toContain('#d97706');
    expect(html).toContain('#fffbeb');
  });
});

describe('infoBox', () => {
  it('renders with border and background', () => {
    const html = infoBox('<p>Info text</p>');
    expect(html).toContain('Info text');
    expect(html).toContain('#f9fafb');
    expect(html).toContain('border: 1px solid #e5e7eb');
    expect(html).toContain('border-radius: 6px');
  });
});

describe('stripHtmlToText', () => {
  it('converts links to text (URL) format', () => {
    const result = stripHtmlToText('<a href="https://example.com">Click here</a>');
    expect(result).toBe('Click here (https://example.com)');
  });

  it('converts list items to dashes', () => {
    const result = stripHtmlToText('<ul><li>First</li><li>Second</li></ul>');
    expect(result).toContain('- First');
    expect(result).toContain('- Second');
  });

  it('strips all remaining HTML tags', () => {
    const result = stripHtmlToText('<div><strong>Bold</strong> and <em>italic</em></div>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toContain('Bold');
    expect(result).toContain('italic');
  });

  it('normalizes whitespace', () => {
    const result = stripHtmlToText('<p>First</p>\n\n\n\n<p>Second</p>');
    expect(result).not.toContain('\n\n\n');
  });

  it('decodes HTML entities', () => {
    const result = stripHtmlToText('&amp; &lt; &gt; &quot; &#39;');
    expect(result).toBe('& < > " \'');
  });

  it('converts <br> to newlines', () => {
    const result = stripHtmlToText('Line one<br>Line two');
    expect(result).toContain('Line one\nLine two');
  });
});
