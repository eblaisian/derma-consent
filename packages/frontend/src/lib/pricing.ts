/**
 * Single source of truth for plan pricing AND resource quotas.
 *
 * Landing page, billing page, plan comparison cards, and i18n feature lists
 * all derive from these values. Backend defaults in platform-config.service.ts
 * MUST match these numbers exactly.
 *
 * When updating quotas here, also update:
 *   - packages/backend/src/platform-config/platform-config.service.ts (DEFAULTS + CONFIG_METADATA)
 *   - All 8 i18n locale files (landing.starterF* / proF* / entF* keys)
 *   - All 8 i18n locale files (subscriptionPlans.starterFeature* keys)
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

/** Resource quotas per plan. null = unlimited. */
export const PLAN_QUOTAS = {
  FREE_TRIAL: {
    consents: 25,
    sms: 20,
    email: 200,
    aiExplainer: 50,
    storageGb: 1,
    teamMembers: 2,
  },
  STARTER: {
    consents: 100,
    sms: 100,
    email: 1_000,
    aiExplainer: 200,
    storageGb: 5,
    teamMembers: 3,
  },
  PROFESSIONAL: {
    consents: null,
    sms: 300,
    email: 5_000,
    aiExplainer: 500,
    storageGb: 20,
    teamMembers: null,
  },
  ENTERPRISE: {
    consents: null,
    sms: 2_000,
    email: null,
    aiExplainer: null,
    storageGb: 100,
    teamMembers: null,
  },
} as const;

export type PlanKey = keyof typeof PLAN_QUOTAS;

/**
 * Premium AI features gated to PROFESSIONAL and ENTERPRISE only.
 * Enforced in: packages/backend/src/communications/ai-status.controller.ts
 * Frontend gate: packages/frontend/src/components/premium-feature-gate.tsx
 *
 * FREE_TRIAL and STARTER users see a locked card with upgrade CTA.
 */
export const PREMIUM_AI_FEATURES = [
  'communications', // AI-drafted messages + multi-channel sending
  'aftercare',      // AI-generated post-treatment care instructions
  'analyticsInsights', // AI-powered practice insights
] as const;
