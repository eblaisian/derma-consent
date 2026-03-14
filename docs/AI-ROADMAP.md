# DermaConsent — AI Roadmap

**Date:** 2026-03-14
**Strategic Position:** AI features that radiate from the consent layer — the moment between "form sent" and "form signed" that no competitor owns.
**Architecture Constraint:** Zero-knowledge encryption. AI features must operate on metadata and templates, never on encrypted patient PII.

## Strategic Thesis

DermaConsent sits at the intersection of the patient-consent event and the clinical workflow. The AI strategy is NOT to compete with ambient scribes (Nelly, ModMed, Doctolib own that). The strategy IS to own intelligent consent — making every consent interaction smarter for patients, doctors, and staff.

Positioning: "The consent platform that makes your practice smarter — without seeing your patients' data."

## Market Validation

- Doctolib charges EUR 99/month for just an AI phone assistant in Germany
- ModMed Scribe: $150-300/provider/month (US)
- Nelly raised EUR 50M Series B (Jan 2025), 1,200+ practices, launched AI Scribe Agent
- AI-enhanced SaaS features command 60-85% price premium with 45-55% adoption rates
- German practices are comfortable paying incremental SaaS fees for discrete AI capabilities

## AI Features by Role

### For Patients (Public, No Auth)

1. **Consent Explainer** — SHIPPED. Plain-language AI explanation of consent form in 8 languages. POST /api/consent/:token/explain. No PII sent to LLM.

### For Doctors (ARZT)

2. **Aftercare Instructions Generator** — AI drafts personalized post-procedure care docs based on treatment type + body region. Doctor reviews and approves. ZK-safe (uses non-PII template data). Effort: 2-3 weeks.
3. **GOÄ Billing Code Suggestion** — Suggests relevant GOÄ positions after documenting a treatment. Maps treatment type + body region + product to billing codes. Effort: 3-4 weeks. High accuracy bar — needs domain expert validation.
4. **AI Contraindication Pre-Screening** — Flags drug interactions and condition contraindications from medical history. Partially ZK-compatible (can work on unencrypted form template questions). Effort: 2-3 weeks.

### For Receptionists (EMPFANG)

5. **No-Show Risk Score** — Red/yellow/green badge per pending consent based on behavioral signals (time since sent, link opens, consent type, day of week). Rule-based initially, ML later. ZK-safe. Effort: 2 weeks.
6. **Smart Communication Templates** — AI drafts multilingual patient messages by context (reminder, follow-up, re-engagement). ZK-safe. Effort: 1 week.
7. **Send Time Optimizer** — Recommends optimal time to send consent links based on historical open rates. ZK-safe. Effort: 1 week.

### For Practice Admins (ADMIN)

8. **Analytics Natural Language Insights** — "Your BOTOX completion rate dropped 18% this month. Consider enabling Day 2 reminders." ZK-safe. Effort: 2 weeks.
9. **Patient Retention Flagging** — Identifies patients overdue for follow-up based on treatment cadence (Botox every 3-4 months, etc.). ZK-safe (uses metadata timestamps). Effort: 2 weeks.

## Zero-Knowledge Compatibility Matrix

| Feature | ZK-Safe | Data Used | Notes |
|---|---|---|---|
| Consent Explainer | Yes | Consent template text (not PII) | Shipped |
| Aftercare Generator | Yes | Treatment type + body region | Non-PII fields |
| GOÄ Billing Suggestion | Yes | Treatment type + region + units | Non-PII fields |
| No-Show Risk Score | Yes | Behavioral metadata (timestamps, counts) | No patient identity needed |
| Communication Templates | Yes | Context type + locale | Template-level, no PII |
| Send Time Optimizer | Yes | Aggregate open-rate statistics | Anonymized |
| Analytics Insights | Yes | Aggregate practice metrics | Non-PII |
| Retention Flagging | Yes | Last-consent timestamps per patient ID | ID only, name encrypted |
| Clinical Ambient Scribe | NO | Patient conversation (encrypted PII) | Let competitors own this |
| Before/After Photo Analysis | NO | Encrypted photo bytes | Would break ZK boundary |
| Full Contraindication Check | Partial | Encrypted patient history | Could work client-side in future |

## Pricing Strategy

| Plan | AI Features |
|---|---|
| Starter (EUR 79/mo) | Consent Explainer only (patient-facing differentiator) |
| Professional (EUR 199/mo) | Full AI Suite: no-show scoring, communication templates, aftercare generator, retention flagging, analytics insights |
| Enterprise (EUR 499/mo) | AI Suite + GOÄ billing suggestions + priority features |

Alternative: AI Suite as EUR 49/month add-on to any plan. Recommended after 20+ paying practices to understand feature-level demand.

## Implementation Phases

### Phase 1 — Launch (Months 0-2)

- [x] Consent Explainer (shipped)
- [ ] No-Show Risk Score
- [ ] Smart Communication Templates

### Phase 2 — Growth (Months 2-4)

- [ ] Aftercare Instructions Generator
- [ ] Patient Retention Flagging
- [ ] Analytics Natural Language Insights

### Phase 3 — Premium (Months 5-8)

- [ ] GOÄ Billing Code Suggestion (requires GOÄ 2025 database)
- [ ] Send Time Optimizer
- [ ] AI Contraindication Pre-Screening

### Phase 4 — Future (12+ months)

- [ ] Photo Analysis (requires consent-gated ZK opt-out mechanism)
- [ ] In-browser AI for encrypted data processing (WebLLM/WASM)

## Technical Architecture

All AI features follow this pattern:

1. Backend service in `/src/consent/` or `/src/ai/` module
2. LLM calls via native `fetch` to OpenAI API (no SDK dependency)
3. API key stored in PlatformConfig (encrypted at rest)
4. All calls logged to AuditLog with action type
5. Rate-limited per endpoint
6. Only non-PII data sent to LLM — consent templates, treatment types, behavioral metadata
7. Results cached in-memory where applicable (e.g., 24h TTL for consent explainer)

## Competitive Positioning After AI Suite

| Capability | DermaConsent | Nelly | Doctolib | ModMed |
|---|---|---|---|---|
| Consent-layer AI | YES | No | No | No |
| Zero-knowledge encryption | YES | No | No | No |
| No-show prediction | YES | No | No | Yes (US only) |
| GOÄ billing AI | YES (Phase 3) | No | No | Yes (CPT, US only) |
| Ambient scribe | No (intentional) | Yes | Yes | Yes |
| Multilingual AI (8 locales) | YES | No | Partial | No |

The moat: no competitor can add consent-layer AI without first building the consent infrastructure. DermaConsent's AI radiates from a data surface (the consent event) that competitors don't have.

## Regulatory Requirements

- DPIA required before shipping any AI feature processing health data at scale
- LLM provider DPA (Data Processing Agreement) under GDPR Art. 28 — standard for non-PII calls
- EU AI Act: all AI features are "limited risk" (not high-risk) since they don't make autonomous clinical decisions
- All AI outputs are advisory — doctor/staff always confirms before acting
- Audit trail for every AI interaction (already implemented via AuditAction enum)

## Key Files

| Resource | Path |
|---|---|
| Consent Explainer Service | packages/backend/src/consent/consent-explainer.service.ts |
| Platform Config (AI keys) | packages/backend/src/platform-config/platform-config.service.ts |
| Audit Actions (includes CONSENT_EXPLAINER_REQUESTED) | packages/backend/prisma/schema.prisma |
| Consent Form Component (explainer button) | packages/frontend/src/components/consent-form/consent-explainer.tsx |
| Admin Config (AI tab) | packages/frontend/src/app/(platform-admin)/admin/config/page.tsx |
