/**
 * Centralized company/legal entity information.
 * Used by Impressum, Datenschutz, and any other page that displays legal details.
 * Update this file when company details change — all pages pull from here.
 */
export const company = {
  name: 'Eblaisian',
  street: 'Sigmund-Freud-Str',
  city: '60435 Frankfurt am Main',
  country: 'Deutschland',
  phone: '+491747767645',
  email: 'info@eblaisian.com',
  vatId: 'In Beantragung',
  responsiblePerson: 'Sohaib Faroukh',

  /** Product name (shown in UI, emails, 2FA issuer) */
  productName: 'DermaConsent',

  /** Default sender email for transactional emails */
  noreplyEmail: 'noreply@eblaisian.com',
} as const;
