import { consentLinkTemplate, getConsentLinkSubject } from './consent-link.template';
import { consentReminderTemplate, getConsentReminderSubject } from './consent-reminder.template';
import { welcomeTemplate, getWelcomeSubject } from './welcome.template';
import { inviteTemplate, getInviteSubject } from './invite.template';
import { subscriptionTemplate, getSubscriptionSubject } from './subscription.template';
import { passwordResetTemplate, getPasswordResetSubject } from './password-reset.template';
import { emailVerificationTemplate, getEmailVerificationSubject } from './email-verification.template';
import type { EmailLocale } from './types';

const locales: EmailLocale[] = ['de', 'en', 'es', 'fr', 'ar', 'tr', 'pl', 'ru'];

function assertBaseStructure(html: string, locale: EmailLocale) {
  expect(html).toContain('<!DOCTYPE html>');
  expect(html).toContain(`lang="${locale}"`);
  expect(html).toContain('<meta name="viewport"');
  expect(html).toContain('derma-consent.de/impressum');
}

function assertNoAsciiUmlauts(html: string) {
  // These patterns should NOT appear in German text — umlauts must be proper Unicode
  expect(html).not.toMatch(/\bfuer\b/);
  expect(html).not.toMatch(/\boeffnen\b/);
  expect(html).not.toMatch(/\bgueltig\b/);
  expect(html).not.toMatch(/\bverschluesselt\b/);
  expect(html).not.toMatch(/\bfuellen\b/);
  expect(html).not.toMatch(/\bausfuellen\b/);
  expect(html).not.toMatch(/\blaeuft\b/);
  expect(html).not.toMatch(/\bkoennen\b/);
  expect(html).not.toMatch(/\bwaehlen\b/);
  expect(html).not.toMatch(/\bzuruecksetzen\b/i);
  expect(html).not.toMatch(/\bbestaetigen\b/i);
}

function assertGermanUmlauts(html: string) {
  // At least some umlauts should be present in German output
  expect(html).toMatch(/[üäöß]/);
}

function assertSpanishAccents(html: string) {
  expect(html).toMatch(/[áéíóúñ]/);
}

function assertFrenchAccents(html: string) {
  expect(html).toMatch(/[éèêàçô]/);
}

// ── consent-link ──

describe('consentLinkTemplate', () => {
  it.each(locales)('renders valid HTML for locale %s', (locale) => {
    const html = consentLinkTemplate('Test Praxis', 'https://example.com/consent/abc', 7, locale);
    assertBaseStructure(html, locale);
  });

  it('contains correct German characters', () => {
    const html = consentLinkTemplate('Test Praxis', 'https://example.com/consent/abc', 7, 'de');
    assertNoAsciiUmlauts(html);
    assertGermanUmlauts(html);
  });

  it('contains correct Spanish characters', () => {
    const html = consentLinkTemplate('Test Praxis', 'https://example.com/consent/abc', 7, 'es');
    assertSpanishAccents(html);
  });

  it('contains correct French characters', () => {
    const html = consentLinkTemplate('Test Praxis', 'https://example.com/consent/abc', 7, 'fr');
    assertFrenchAccents(html);
  });

  it('includes practice name and consent link', () => {
    const html = consentLinkTemplate('Dr. Mueller', 'https://example.com/consent/xyz', 14, 'en');
    expect(html).toContain('Dr. Mueller');
    expect(html).toContain('https://example.com/consent/xyz');
  });

  it('includes expiry days in output', () => {
    const html = consentLinkTemplate('Test', 'https://example.com', 14, 'en');
    expect(html).toContain('14');
  });

  it('contains CTA button with consent link href', () => {
    const html = consentLinkTemplate('Test', 'https://example.com/consent/abc', 7, 'en');
    expect(html).toContain('href="https://example.com/consent/abc"');
  });

  it.each(locales)('snapshot for locale %s', (locale) => {
    expect(consentLinkTemplate('Test Practice', 'https://example.com/consent/abc', 7, locale))
      .toMatchSnapshot();
  });

  it('returns localized subject', () => {
    expect(getConsentLinkSubject('Test', 'de')).toContain('Einwilligungsformular');
    expect(getConsentLinkSubject('Test', 'en')).toContain('Consent form');
  });
});

// ── consent-reminder ──

describe('consentReminderTemplate', () => {
  it.each(locales)('renders valid HTML for locale %s', (locale) => {
    const html = consentReminderTemplate('Test Praxis', 'https://example.com/consent/abc', locale);
    assertBaseStructure(html, locale);
  });

  it('contains correct German characters', () => {
    const html = consentReminderTemplate('Test', 'https://example.com', 'de');
    assertNoAsciiUmlauts(html);
    assertGermanUmlauts(html);
  });

  it('contains CTA button', () => {
    const html = consentReminderTemplate('Test', 'https://example.com/consent/abc', 'en');
    expect(html).toContain('href="https://example.com/consent/abc"');
  });

  it.each(locales)('snapshot for locale %s', (locale) => {
    expect(consentReminderTemplate('Test Practice', 'https://example.com/consent/abc', locale))
      .toMatchSnapshot();
  });

  it('returns localized subject', () => {
    expect(getConsentReminderSubject('Test', 'de')).toContain('Erinnerung');
    expect(getConsentReminderSubject('Test', 'en')).toContain('Reminder');
  });
});

// ── welcome ──

describe('welcomeTemplate', () => {
  it.each(locales)('renders valid HTML for locale %s', (locale) => {
    const html = welcomeTemplate('Max', locale);
    assertBaseStructure(html, locale);
  });

  it('contains correct German characters', () => {
    const html = welcomeTemplate('Max', 'de');
    assertNoAsciiUmlauts(html);
    assertGermanUmlauts(html);
  });

  it('contains CTA button linking to dashboard', () => {
    const html = welcomeTemplate('Max', 'en');
    expect(html).toContain('/dashboard');
    expect(html).toContain('href=');
  });

  it('includes user name', () => {
    const html = welcomeTemplate('Dr. Mueller', 'en');
    expect(html).toContain('Dr. Mueller');
  });

  it.each(locales)('snapshot for locale %s', (locale) => {
    expect(welcomeTemplate('Test User', locale)).toMatchSnapshot();
  });

  it('returns localized subject', () => {
    expect(getWelcomeSubject('de')).toContain('Willkommen');
    expect(getWelcomeSubject('en')).toContain('Welcome');
  });
});

// ── invite ──

describe('inviteTemplate', () => {
  it.each(locales)('renders valid HTML for locale %s', (locale) => {
    const html = inviteTemplate('Test Praxis', 'ADMIN', 'https://example.com/invite/abc', locale);
    assertBaseStructure(html, locale);
  });

  it('contains correct German characters', () => {
    const html = inviteTemplate('Test', 'ADMIN', 'https://example.com', 'de');
    assertNoAsciiUmlauts(html);
    assertGermanUmlauts(html);
  });

  it.each(['ADMIN', 'ARZT', 'EMPFANG', 'PLATFORM_ADMIN'])('renders role label for %s', (role) => {
    const html = inviteTemplate('Test', role, 'https://example.com', 'en');
    // Should contain a human-readable role label, not the raw role code (except PLATFORM_ADMIN has "Platform" in the label)
    expect(html).not.toContain(`>${role}<`);
  });

  it('renders PLATFORM_ADMIN role label in all locales', () => {
    expect(inviteTemplate('Test', 'PLATFORM_ADMIN', 'https://example.com', 'de')).toContain('Plattform-Administrator');
    expect(inviteTemplate('Test', 'PLATFORM_ADMIN', 'https://example.com', 'en')).toContain('Platform Administrator');
    expect(inviteTemplate('Test', 'PLATFORM_ADMIN', 'https://example.com', 'es')).toContain('Administrador de plataforma');
    expect(inviteTemplate('Test', 'PLATFORM_ADMIN', 'https://example.com', 'fr')).toContain('Administrateur de plateforme');
  });

  it('contains CTA button with invite link', () => {
    const html = inviteTemplate('Test', 'ADMIN', 'https://example.com/invite/abc', 'en');
    expect(html).toContain('href="https://example.com/invite/abc"');
  });

  it.each(locales)('snapshot for locale %s', (locale) => {
    expect(inviteTemplate('Test Practice', 'ADMIN', 'https://example.com/invite/abc', locale))
      .toMatchSnapshot();
  });

  it('returns localized subject', () => {
    expect(getInviteSubject('Test', 'de')).toContain('Einladung');
    expect(getInviteSubject('Test', 'en')).toContain('Invitation');
  });
});

// ── subscription ──

describe('subscriptionTemplate', () => {
  it.each(locales)('renders valid trial_expiring HTML for locale %s', (locale) => {
    const html = subscriptionTemplate('trial_expiring', 'Test Praxis', locale, 2);
    assertBaseStructure(html, locale);
  });

  it.each(locales)('renders valid payment_failed HTML for locale %s', (locale) => {
    const html = subscriptionTemplate('payment_failed', 'Test Praxis', locale);
    assertBaseStructure(html, locale);
  });

  it('contains correct German characters', () => {
    const html = subscriptionTemplate('trial_expiring', 'Test', 'de', 3);
    assertNoAsciiUmlauts(html);
    assertGermanUmlauts(html);
  });

  it('includes daysLeft in trial_expiring for all locales', () => {
    for (const locale of locales) {
      const html = subscriptionTemplate('trial_expiring', 'Test', locale, 5);
      expect(html).toContain('5');
    }
  });

  it('payment_failed contains red color', () => {
    const html = subscriptionTemplate('payment_failed', 'Test', 'en');
    expect(html).toContain('#b91c1c');
  });

  it('contains CTA button with billing link', () => {
    const html = subscriptionTemplate('trial_expiring', 'Test', 'en', 3);
    expect(html).toContain('/billing');
  });

  it.each(locales)('trial_expiring snapshot for locale %s', (locale) => {
    expect(subscriptionTemplate('trial_expiring', 'Test Practice', locale, 3))
      .toMatchSnapshot();
  });

  it.each(locales)('payment_failed snapshot for locale %s', (locale) => {
    expect(subscriptionTemplate('payment_failed', 'Test Practice', locale))
      .toMatchSnapshot();
  });

  it('returns localized subjects', () => {
    expect(getSubscriptionSubject('trial_expiring', 'Test', 'de')).toContain('Testphase');
    expect(getSubscriptionSubject('payment_failed', 'Test', 'en')).toContain('Payment');
  });
});

// ── password-reset ──

describe('passwordResetTemplate', () => {
  it.each(locales)('renders valid HTML for locale %s', (locale) => {
    const html = passwordResetTemplate('https://example.com/reset/abc', locale);
    assertBaseStructure(html, locale);
  });

  it('contains correct German characters', () => {
    const html = passwordResetTemplate('https://example.com', 'de');
    assertNoAsciiUmlauts(html);
    assertGermanUmlauts(html);
    expect(html).toContain('zurücksetzen');
  });

  it('contains correct Spanish characters', () => {
    const html = passwordResetTemplate('https://example.com', 'es');
    expect(html).toContain('contraseña');
  });

  it('contains correct French characters', () => {
    const html = passwordResetTemplate('https://example.com', 'fr');
    expect(html).toContain('Réinitialiser');
  });

  it('contains ignore security notice', () => {
    const html = passwordResetTemplate('https://example.com', 'en');
    expect(html).toContain('ignore');
  });

  it('contains CTA button with reset link', () => {
    const html = passwordResetTemplate('https://example.com/reset/abc', 'en');
    expect(html).toContain('href="https://example.com/reset/abc"');
  });

  it.each(locales)('snapshot for locale %s', (locale) => {
    expect(passwordResetTemplate('https://example.com/reset/abc', locale))
      .toMatchSnapshot();
  });

  it('returns localized subject', () => {
    expect(getPasswordResetSubject('de')).toContain('zurücksetzen');
    expect(getPasswordResetSubject('en')).toContain('Reset');
  });
});

// ── email-verification ──

describe('emailVerificationTemplate', () => {
  it.each(locales)('renders valid HTML for locale %s', (locale) => {
    const html = emailVerificationTemplate('https://example.com/verify/abc', locale);
    assertBaseStructure(html, locale);
  });

  it('contains correct German characters', () => {
    const html = emailVerificationTemplate('https://example.com', 'de');
    assertNoAsciiUmlauts(html);
    assertGermanUmlauts(html);
    expect(html).toContain('bestätigen');
  });

  it('contains correct Spanish characters', () => {
    const html = emailVerificationTemplate('https://example.com', 'es');
    expect(html).toContain('dirección');
  });

  it('contains correct French characters', () => {
    const html = emailVerificationTemplate('https://example.com', 'fr');
    expect(html).toContain('Vérifiez');
  });

  it('contains CTA button with verification link', () => {
    const html = emailVerificationTemplate('https://example.com/verify/abc', 'en');
    expect(html).toContain('href="https://example.com/verify/abc"');
  });

  it.each(locales)('snapshot for locale %s', (locale) => {
    expect(emailVerificationTemplate('https://example.com/verify/abc', locale))
      .toMatchSnapshot();
  });

  it('returns localized subject', () => {
    expect(getEmailVerificationSubject('de')).toContain('bestätigen');
    expect(getEmailVerificationSubject('en')).toContain('Verify');
  });
});
