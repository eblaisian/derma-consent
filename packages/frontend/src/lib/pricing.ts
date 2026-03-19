/**
 * Single source of truth for all plan pricing.
 * Landing page, billing page, and translations all derive from these values.
 * Backend validation in platform-config.service.ts must match (amounts in cents).
 */
export const PRICING = {
  starter: {
    monthly: 49,
    yearly: 470,
  },
  professional: {
    monthly: 99,
    yearly: 950,
  },
  enterprise: {
    monthly: 199,
    yearly: 1990,
  },
} as const;
