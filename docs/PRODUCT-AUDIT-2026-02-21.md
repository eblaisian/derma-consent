# DermaConsent — Product Audit & Production Readiness Report

> Comprehensive feature audit, gap analysis, and prioritized roadmap for production launch.
> Date: 2026-02-21 | Scope: Full codebase audit (backend, frontend, infra, competitive positioning)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Feature Inventory](#2-current-feature-inventory)
3. [Features Requiring Polish to Complete](#3-features-requiring-polish-to-complete)
4. [Must-Have Features for Launch](#4-must-have-features-for-launch)
5. [Nice-to-Have Features](#5-nice-to-have-features)
6. [Differentiating Features & Competitive Moat](#6-differentiating-features--competitive-moat)
7. [Technical Debt & Infrastructure Gaps](#7-technical-debt--infrastructure-gaps)
8. [Prioritized Launch Checklist](#8-prioritized-launch-checklist)
9. [Risk Register](#9-risk-register)

---

## 1. Executive Summary

### Product Snapshot

| Dimension | Status |
|-----------|--------|
| **Backend (NestJS)** | 54 endpoints, 14 modules — all fully implemented, no stubs |
| **Frontend (Next.js)** | 12 routes, 30+ components — ~85% production-ready |
| **Database (Prisma/PostgreSQL)** | 14 models, 12 enums, proper indexes — well-designed |
| **Security** | Zero-knowledge encryption (RSA-4096 + AES-256-GCM), JWT auth, RBAC, rate limiting, Helmet, PII redaction |
| **i18n** | 4 locales (de, en, es, fr), 548+ translation keys |
| **Infrastructure** | Docker multi-stage builds, CI/CD (GitHub Actions), Makefile automation |
| **Test Coverage** | Low — only crypto (frontend) and GDT (backend) have tests |

### Verdict

**The core application is functionally complete.** All major features — consent lifecycle, patient management, team management, billing, analytics, audit logging, photo documentation, treatment planning, GDT integration — are implemented end-to-end. The zero-knowledge encryption architecture is robust and production-grade.

**What's blocking launch is not features — it's operational readiness:** test coverage, monitoring, database migration strategy, and a handful of UI polish items.

**Estimated effort to production: 3–4 weeks of focused work.**

---

## 2. Current Feature Inventory

### 2.1 Core Consent Engine (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Create consent form (6 treatment types) | POST /api/consent | New Consent Dialog | BOTOX, FILLER, LASER, CHEMICAL_PEEL, MICRONEEDLING, PRP |
| Public consent link with 7-day expiry | GET /api/consent/:token | /consent/[token] | 4-step flow: Form > Signature > Review > Submit |
| Client-side encryption before submission | — | crypto.ts + useVault | RSA-4096 wraps AES-256-GCM session key |
| Digital signature capture | — | react-signature-canvas | Timestamp + IP logging (Europe/Berlin TZ) |
| Consent status lifecycle | DB enum | Status badges | PENDING > FILLED > SIGNED > PAID > COMPLETED |
| Consent revocation (GDPR Art. 7) | PATCH /api/consent/:token/revoke | Revoke button + dialog | Audit logged |
| Decrypt & view consent data | — | DecryptedFormViewer | Requires vault unlock with master password |
| Payment via Stripe | POST /api/stripe/webhook | Stripe checkout redirect | Application fee (5% default) |
| PDF generation on payment | pdf.service.ts | — | PDFKit, stored in Supabase, digital fingerprint (SHA-256) |

**Assessment: Production-ready.** This is the strongest part of the product.

### 2.2 Patient Management (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Patient list with pagination | GET /api/patients | /patients page | Encrypted names, vault-unlock to decrypt |
| Patient detail with consent history | GET /api/patients/:id | /patients/[id] page | Photos, treatment plans, consents |
| Privacy-preserving lookup (SHA-256 hash) | GET /api/patients/lookup/:hash | Hash-based search | Deduplication without decryption |
| Patient creation (encrypted) | POST /api/patients | Auto-created on consent submit | Manual creation UI placeholder only |
| GDPR Art. 17 right to erasure | DELETE /api/patients/:id | Delete button + confirmation | Cascading: photos > plans > consents > patient |

### 2.3 Photo Documentation (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Encrypted photo upload | POST /api/photos | PhotoUploadDialog | Client-side encryption, Supabase storage |
| Before/After tagging | DTO: type (BEFORE/AFTER) | Type selector | 12 body regions |
| Photo gallery by body region | GET /api/photos/patient/:id | PhotoGallery component | Grouped display, date formatting |
| Encrypted photo download/view | GET /api/photos/:id/download | EncryptedPhotoViewer | Client-side decryption |
| Photo comparison (before/after) | — | PhotoComparisonViewer | Side-by-side view |
| Photo consent tracking | PATCH /api/photos/:id/consent | — | Separate consent flag per photo |

### 2.4 Treatment Planning (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Treatment plan CRUD | 5 endpoints | TreatmentPlanEditor | Encrypted data, linked to patient |
| Anatomical diagrams | — | AnatomicalDiagram (SVG) | Face-front, face-side, body-front |
| Interactive injection points | — | InjectionPointMarker | Product, units, batch, technique per point |
| Treatment templates | 4 endpoints | TemplatePickerDialog | Practice-scoped, reusable protocols |
| Treatment history | — | TreatmentHistory component | Timeline view |

### 2.5 Team Management (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Team member list | GET /api/team/members | /team page | ADMIN-only |
| Invite by email + role | POST /api/team/invite | Invite dialog | 7-day expiry, prevents duplicates |
| Accept invitation | POST /api/team/invite/:token/accept | /invite/[token] page | Sign-in gate |
| Role management (ADMIN/ARZT/EMPFANG) | PATCH /api/team/members/:userId/role | Role dropdown | Prevents last-admin removal |
| Remove member | DELETE /api/team/members/:userId | Remove button | Prevents self-removal |

### 2.6 Billing & Subscriptions (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Subscription management | GET /api/billing/subscription | /billing page | FREE_TRIAL, STARTER, PROFESSIONAL, ENTERPRISE |
| Stripe Checkout | POST /api/billing/checkout | Plan cards + checkout redirect | Monthly/yearly pricing |
| Stripe Billing Portal | POST /api/billing/portal | Portal link | Self-service management |
| Webhook handling | POST /api/billing/webhook | — | subscription.created/updated/deleted, payment_failed |
| Subscription guard | SubscriptionGuard | — | Blocks expired trials + inactive subscriptions |

### 2.7 Analytics (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Overview metrics | GET /api/analytics/overview | Analytics cards | Total, Pending, Signed, Patients |
| Consent by type (pie chart) | GET /api/analytics/by-type | Recharts PieChart | Grouped by ConsentType |
| Daily trend (line chart) | GET /api/analytics/by-period | Recharts LineChart | Created vs Signed, configurable days |
| Conversion rate | GET /api/analytics/conversion | Progress bar | (SIGNED+PAID+COMPLETED) / total |
| Revenue report | GET /api/analytics/revenue | — | ADMIN-only, payment intent metadata |

### 2.8 Audit Logging (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Comprehensive audit trail | AuditService (global) | /audit page | 20+ action types tracked |
| Filtering (action, date range) | GET /api/audit | Filter controls | Pagination (25/page) |
| CSV export | GET /api/audit/export | Export button | Timestamp, action, user, entity, IP |
| Vault events | POST /api/audit/vault-event | — | Lock/unlock logging |

### 2.9 Settings (MOSTLY COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Language switcher | — | LanguageSwitcher | Cookie-based, 4 locales |
| Default consent expiry | PATCH /api/settings | Settings form | 1–90 days |
| Brand color | PATCH /api/settings | Color picker | Stored but not yet applied to consent forms |
| Logo upload | POST /api/settings/logo | File upload | Supabase storage |
| Enabled consent types | PATCH /api/settings | — | Backend supports, frontend not wired |

### 2.10 Authentication (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Email/password registration | POST /api/auth/register | /register page | bcrypt (salt=12), min 8 chars |
| Email/password login | POST /api/auth/login | /login page | JWT 7-day tokens |
| OAuth (Google) | POST /api/auth/sync | Login button | Conditional on env vars |
| OAuth (Microsoft Entra) | POST /api/auth/sync | Login button | Conditional on env vars |
| OAuth (Apple) | POST /api/auth/sync | Login button | Conditional on env vars |
| Practice setup with keypair | POST /api/practice | /setup page | RSA-4096 generation, PBKDF2 master password |

### 2.11 GDT Integration (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| GDT 2.1 record generation | POST /api/gdt/generate | — | Full spec: Satzarten 6300-6311, 50+ field IDs |
| GDT parsing | gdt.service.parseRecord() | — | ISO-8859-1 encoding, CRLF terminators |
| **Comprehensive test suite** | gdt.service.spec.ts | — | Best-tested module (16 tests) |

### 2.12 Email Notifications (COMPLETE)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Consent link email | EmailService.sendConsentLink() | — | HTML template, 7-day expiry notice |
| Team invite email | EmailService.sendInvite() | — | Role label translation |
| Welcome email | EmailService.sendWelcome() | — | Registration confirmation |
| Subscription notices | EmailService.sendSubscriptionNotice() | — | Trial expiring, payment failed |

**Provider:** Resend API (graceful no-op if not configured)

---

## 3. Features Requiring Polish to Complete

These are features where code exists but needs finishing touches before they can be considered launch-ready.

### P1 — Practice Info Not Editable from Settings UI

**Current state:** Practice name and DSGVO contact email are displayed in settings but cannot be updated.
**Backend:** No PATCH endpoint for practice entity (only settings sub-resource).
**Fix required:**
- Add `PATCH /api/practice` endpoint
- Wire the frontend settings form to save practice name + DSGVO contact
**Effort:** 2–4 hours
**Impact:** Settings page feels broken without this

### P2 — Brand Color Not Applied to Consent Forms

**Current state:** Brand color picker works and saves to database, but the public consent form (`/consent/[token]`) does not consume the practice's brand color.
**Fix required:**
- Include `brandColor` in the public consent endpoint response
- Apply it as CSS custom property on the consent form page
**Effort:** 2–3 hours
**Impact:** Branding is a selling point — without this, the setting is misleading

### P3 — Manual Patient Creation Not Implemented

**Current state:** "New Patient" button exists on the patients page but shows a placeholder message ("Manual creation will be supported in a future version").
**Backend:** `POST /api/patients` endpoint exists and works.
**Fix required:**
- Build a patient creation form with encrypted fields (name, DOB, email)
- Generate lookup hash (SHA-256) client-side
- Submit encrypted data to existing endpoint
**Effort:** 4–6 hours
**Impact:** Critical for practices that want to pre-register patients before sending consent links

### P4 — Enterprise Plan "Contact Us" Button Non-Functional

**Current state:** Enterprise plan card has a disabled button with no action.
**Fix required:**
- Link to a contact email (mailto:) or external form
- Or implement a simple contact request endpoint
**Effort:** 1 hour
**Impact:** Lost enterprise leads

### P5 — Enabled Consent Types Not Configurable in UI

**Current state:** Backend supports `enabledConsentTypes` in settings, but the frontend settings page doesn't expose this toggle.
**Fix required:**
- Add checkbox group for the 6 consent types in settings
- Filter available types in the "New Consent" dialog based on this setting
**Effort:** 3–4 hours
**Impact:** Practices that only do Botox + Filler shouldn't see LASER/PRP options

### P6 — Revenue Analytics Shows Metadata Only

**Current state:** Revenue endpoint returns payment intent IDs but not actual EUR amounts.
**Fix required:**
- Fetch payment intent amounts from Stripe API
- Display total revenue, average transaction, and trend
**Effort:** 4–6 hours
**Impact:** The analytics page promises revenue insights it can't deliver

### P7 — Missing Error Boundaries on All Authenticated Pages

**Current state:** No React Error Boundaries. An unhandled error in any component crashes the entire page.
**Fix required:**
- Add `error.tsx` files to the authenticated layout and key routes
- Implement graceful fallback UI with retry button
**Effort:** 2–3 hours
**Impact:** Production stability — one bad API response shouldn't white-screen the app

### P8 — Session Expiry Not Handled Gracefully

**Current state:** If the JWT expires mid-session, API calls fail silently or show generic errors. Vault does not auto-lock.
**Fix required:**
- Detect 401 responses in `auth-fetch.ts` and redirect to login
- Auto-lock vault on session expiry
- Show "Session expired" toast notification
**Effort:** 3–4 hours
**Impact:** Poor UX when tokens expire after 7 days of inactivity

---

## 4. Must-Have Features for Launch

These features do not exist yet but are required for a credible production launch in the DACH dermatology market.

### M1 — Health Check Endpoint

**Why:** Required for container orchestration, load balancers, uptime monitoring. Cannot operate a production service without knowing if it's alive.
**Scope:**
- `GET /api/health` — returns 200 with DB connectivity status
- `GET /api/health/ready` — checks DB + Supabase + Stripe connectivity
**Effort:** 2–3 hours

### M2 — Versioned Database Migrations

**Why:** Currently using `prisma db push` which is destructive and unsuitable for production. Any schema change could cause data loss.
**Scope:**
- Switch to `prisma migrate` with versioned migration files
- Add migration step to CI/CD pipeline
- Document rollback procedures
**Effort:** 4–6 hours

### M3 — Global Exception Filter with Structured Logging

**Why:** Unhandled exceptions currently return inconsistent error responses. No structured logging for aggregation (ELK, CloudWatch, Datadog).
**Scope:**
- NestJS global exception filter with consistent error response shape
- JSON-structured logging with request ID correlation
- Error severity classification
**Effort:** 6–8 hours

### M4 — Test Coverage for Critical Paths

**Why:** Only GDT (backend) and crypto (frontend) have tests. Auth, consent submission, patient CRUD, billing webhooks — all untested. Shipping medical software without tests is a liability risk.
**Scope (minimum viable):**
- Auth: register, login, JWT validation (3–5 tests)
- Consent: create, submit with encryption, revoke (3–5 tests)
- Patient: CRUD + cascading delete (3–4 tests)
- Billing: webhook handler for subscription state changes (3–4 tests)
- Frontend: consent form submission flow, vault unlock/lock (3–4 tests)
**Effort:** 2–3 days
**Target:** 60%+ coverage on critical modules

### M5 — Content Security Policy (CSP) Header

**Why:** Current security headers include X-Frame-Options and X-XSS-Protection but no CSP. Without CSP, the app is vulnerable to XSS via injected scripts.
**Scope:**
- Define CSP policy allowing only required sources (self, Stripe.js, fonts, analytics)
- Add to Next.js config headers and backend Helmet config
**Effort:** 3–4 hours

### M6 — HSTS (HTTP Strict Transport Security) Header

**Why:** Forces HTTPS on all connections. Without it, the first request could be intercepted via HTTP downgrade attack. Critical for a medical data platform.
**Scope:**
- Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` to both backend and frontend
**Effort:** 30 minutes

### M7 — 404 and Error Pages

**Why:** Navigating to a non-existent route shows the default Next.js 404. Looks unfinished.
**Scope:**
- Custom `not-found.tsx` with navigation back to dashboard
- Custom `error.tsx` at root layout level
**Effort:** 1–2 hours

### M8 — Pagination Limit Enforcement

**Why:** No max limit on pagination queries. A client could request `?limit=999999` and DOS the database.
**Scope:**
- Enforce `max: 100` on all paginated endpoints
- Add validation to pagination DTOs
**Effort:** 1–2 hours

### M9 — Landing Page / Marketing Site

**Why:** The current home page (`/`) is a minimal CTA stub. No product description, no pricing display, no trust signals. First impression for potential customers.
**Scope:**
- Hero section with value proposition
- Feature highlights (consent, photos, encryption, i18n)
- Pricing table (matching billing page tiers)
- Trust signals (DSGVO compliance, encryption, ISO references)
- Call-to-action for free trial
**Effort:** 2–3 days

### M10 — Onboarding Flow

**Why:** After registration and practice setup, users land on an empty dashboard with no guidance. No tooltips, no wizard, no sample data.
**Scope:**
- Post-setup welcome modal with 3–4 step walkthrough
- "Create your first consent" guided prompt
- Optional: seed a sample consent form to demonstrate the workflow
**Effort:** 1–2 days

---

## 5. Nice-to-Have Features

These improve competitiveness but are not blockers for initial launch.

### N1 — Additional Languages (Turkish, Arabic, Russian, Polish)

**Why:** Most common non-German languages in German healthcare. Thieme offers 17 languages. Expanding from 4 to 8 languages covers ~95% of patients in German practices.
**Effort:** 2–3 days per language (translation + RTL support for Arabic)
**Tier:** Starter+

### N2 — SMS/WhatsApp Consent Link Delivery

**Why:** Nelly's key UX advantage. Email open rates are ~20%; SMS is ~98%. WhatsApp is the dominant messaging platform in Germany.
**Effort:** 1–2 days (Twilio/MessageBird integration)
**Tier:** Professional

### N3 — Patient Comprehension Verification

**Why:** No competitor verifies that patients actually understood the consent content. A simple quiz or reading-time tracker would strengthen legal defensibility.
**Effort:** 2–3 days
**Tier:** Professional

### N4 — AI Risk Assessment Summaries

**Why:** Already on the strategy roadmap (Priority 4). Analyze patient medical history to flag contraindications and auto-populate risk sections. Would be a massive differentiator.
**Effort:** 2–3 weeks (LLM integration, prompt engineering, audit trail)
**Tier:** Enterprise

### N5 — GOA/EBM Billing Code Integration

**Why:** Link consent forms to billing codes for automated invoicing. Solves the dual GKV/IGeL complexity that every practice faces.
**Effort:** 1–2 weeks
**Tier:** Professional+

### N6 — PVS Integration (CGM M1, Medistar, Turbomed)

**Why:** GDT module exists but no PVS connectors are implemented. Practices need bidirectional sync with their existing systems. This is the #1 request from larger practices.
**Effort:** 2–4 weeks per PVS system
**Tier:** Professional+

### N7 — Multi-Location Practice Support

**Why:** Chains and MVZ (Medizinische Versorgungszentren) need centralized management across locations. Enterprise revenue opportunity.
**Effort:** 2–3 weeks
**Tier:** Enterprise

### N8 — Video Patient Education

**Why:** medudoc proves this improves comprehension by 85%. Can be as simple as embedding procedure-specific YouTube/Vimeo links in consent forms, or as complex as a proprietary content library.
**Effort:** 1 day (embed) to 3+ months (custom library)
**Tier:** Professional

### N9 — Dark Mode

**Why:** TailwindCSS 4 supports it natively. Low effort, high perceived polish. Medical professionals often work in dim exam rooms.
**Effort:** 1–2 days
**Tier:** All

### N10 — PWA / Offline Support

**Why:** Tablet-based consent signing in exam rooms may have spotty connectivity. Service worker caching ensures the consent form works offline and syncs when reconnected.
**Effort:** 1–2 weeks
**Tier:** Professional+

### N11 — ePA/TI Integration

**Why:** Mandatory since October 2025. No aesthetic consent tool currently integrates. First-mover advantage is significant, but gematik certification is expensive and slow.
**Effort:** 3–6 months (certification process)
**Tier:** Enterprise

### N12 — Two-Factor Authentication (2FA/MFA)

**Why:** Medical data platform should offer 2FA. TOTP (authenticator app) is the minimum expectation for enterprise customers.
**Effort:** 1–2 days (speakeasy or otplib)
**Tier:** All

---

## 6. Differentiating Features & Competitive Moat

### Primary Differentiator: Zero-Knowledge Encryption

**This is DermaConsent's single most powerful competitive advantage.** No competitor in the DACH consent management market offers zero-knowledge architecture.

| Aspect | DermaConsent | Thieme | Nelly | Idana | medudoc |
|--------|-------------|--------|-------|-------|---------|
| Encryption model | Zero-knowledge (client-side) | Server-side at rest | Server-side at rest | E2E encryption | Server-side at rest |
| Vendor data access | Mathematically impossible | Has access | Has access | Limited | Has access |
| Key management | Practice-owned RSA-4096 keypair | Vendor-managed | Vendor-managed | Unknown | Vendor-managed |
| Encryption standard | AES-256-GCM + RSA-4096 | Unknown | Unknown | Unknown | Unknown |

**Why this wins:**

1. **Trust argument:** "We literally cannot see your patient data — even if compelled by a court order, we do not have the keys." This resonates deeply with German physicians who are legally responsible for patient data under BDSG/DSGVO.

2. **Regulatory argument:** GDPR Article 25 mandates "data protection by design." Zero-knowledge is the strongest possible implementation of this principle.

3. **Breach-proof argument:** If DermaConsent's servers are compromised, attackers get ciphertext that is computationally infeasible to decrypt without the practice's master password.

4. **Marketing clarity:** "Zero-Knowledge" is a simple, memorable concept that non-technical physicians can understand and value.

**Recommendation:** Make zero-knowledge encryption the centerpiece of all marketing, landing page, and sales materials. Commission an independent security audit to validate the implementation and publish the results.

### Secondary Differentiator: Dermatology Specialization

No DACH competitor is purpose-built for dermatology. DermaConsent has:

| Capability | Generic tools (Nelly, Doctolib) | DermaConsent |
|------------|-------------------------------|--------------|
| Treatment-specific consent forms | Generic templates | 6 dermatology-specific types with field-level customization |
| Anatomical injection mapping | Not available | Interactive SVG diagrams (face, body) with per-point data |
| Before/after photo management | Not available | Encrypted upload, body region tagging, comparison viewer |
| Treatment plan templates | Not available | Practice-scoped templates with injection protocols |
| Batch number tracking | Not available | Per-injection-point batch recording |

**Why this wins:** A dermatologist evaluating Nelly (generic) vs DermaConsent (built for their specialty) will choose the tool that speaks their clinical language. Specialty focus = faster sales cycles, higher conversion, stronger word-of-mouth.

### Tertiary Differentiator: Transparent Pricing

The DACH medical software market is notorious for opaque pricing. Thieme, medudoc, and Samedi all require custom quotes. Even Nelly's pricing is hidden behind a sales call.

**DermaConsent publishes clear tier pricing.** This is a trust signal and a lead generation advantage:
- Small practices can self-evaluate without a sales call
- Transparent pricing attracts the "I just want to buy, don't sell me" demographic
- Reduces sales cycle length

### Differentiator Moat Analysis

| Differentiator | Defensibility | Time to Copy | Moat Strength |
|----------------|--------------|-------------|---------------|
| Zero-knowledge encryption | High — architectural decision, hard to retrofit | 6–12 months | Strong |
| Dermatology specialization | Medium — content can be replicated | 3–6 months | Medium |
| Transparent pricing | Low — anyone can publish prices | 1 day | Weak (but first-mover advantage in trust) |
| GDPR Art. 25 "by design" compliance | High — requires architectural commitment | 6–12 months | Strong |
| GDT integration | Medium — standard exists, implementation is known | 2–4 weeks | Weak (but table stakes for PVS integration) |
| Before/after photo encryption | High — combining medical photos with E2E encryption is novel | 3–6 months | Medium-Strong |

### Core Business Model Recommendation

**Position: "The privacy-first consent platform for dermatology."**

The business model should be built around three pillars:

1. **Trust (Zero-Knowledge)** — The foundational differentiator. Charge a premium because security is not a feature, it's the architecture. Practices pay for the peace of mind that a breach cannot expose their patients.

2. **Specialty (Dermatology-First)** — The wedge into the market. Start narrow, win the vertical, then expand. Dermatology has the highest ratio of aesthetic (self-pay) procedures and the most acute consent documentation burden.

3. **Workflow (Consent-to-Treatment)** — The expansion play. Start with consent, expand into photos, treatment planning, billing, and eventually become the dermatology practice OS. Each feature layer increases switching costs and ARPU.

**Revenue model progression:**
- **Year 1:** SaaS subscriptions (EUR 79–399/mo) — consent + basic features
- **Year 2:** Add payment processing (1.5–3% transaction fee on IGeL payments) — aligns incentives
- **Year 3:** Add AI features (EUR 49–99/mo add-on) + template marketplace + API access

---

## 7. Technical Debt & Infrastructure Gaps

### 7.1 Critical Infrastructure Gaps

| Gap | Risk | Effort | Priority |
|-----|------|--------|----------|
| **No monitoring/observability** | Cannot detect outages, slow queries, or errors in production | 2–3 days (Sentry + uptime monitor) | CRITICAL |
| **No versioned DB migrations** | Schema changes can cause data loss in production | 4–6 hours | CRITICAL |
| **No health check endpoints** | Load balancers, orchestrators cannot verify service health | 2–3 hours | CRITICAL |
| **CI/CD deploys without testing** | Docker images pushed before tests pass (deploy.yml) | 1–2 hours | HIGH |
| **No global exception filter** | Inconsistent error responses, unhandled exceptions crash requests | 4–6 hours | HIGH |
| **No structured logging** | Cannot aggregate, search, or alert on logs | 4–6 hours | HIGH |
| **No LICENSE file** | Legal ambiguity for users and contributors | 30 minutes | HIGH |

### 7.2 Security Gaps

| Gap | Risk | Effort | Priority |
|-----|------|--------|----------|
| **No Content Security Policy** | XSS vulnerability via injected scripts | 3–4 hours | HIGH |
| **No HSTS header** | HTTP downgrade attacks possible | 30 minutes | HIGH |
| **Backend Dockerfile runs as root** | Container escape = full system access | 30 minutes | MEDIUM |
| **No 2FA/MFA** | Single-factor auth for medical data platform | 1–2 days | MEDIUM |
| **No request idempotency** | Duplicate POST requests (network retry) can create duplicate records | 1 day | MEDIUM |
| **No account lockout** | Brute-force login attempts not rate-limited per-account | 2–3 hours | MEDIUM |

### 7.3 Test Debt

| Area | Current Tests | Minimum Required | Effort |
|------|---------------|-----------------|--------|
| Backend — Auth | 0 | 5 (register, login, JWT, roles, guard) | 4–6 hours |
| Backend — Consent | 0 | 5 (create, submit, revoke, expiry, lifecycle) | 4–6 hours |
| Backend — Patient | 0 | 4 (CRUD, cascade delete, lookup hash) | 3–4 hours |
| Backend — Billing | 0 | 4 (webhook events, subscription guard, plan mapping) | 3–4 hours |
| Backend — GDT | 16 | Sufficient | — |
| Frontend — Crypto | 10 | Sufficient | — |
| Frontend — Components | 0 | 5 (consent form, vault, settings, patient list) | 1 day |
| E2E | 0 | 3 (register > setup > create consent > submit) | 1–2 days |

---

## 8. Prioritized Launch Checklist

### Phase 0: Blockers (Week 1) — Must resolve before any deployment

- [ ] Switch to versioned Prisma migrations (`prisma migrate`)
- [ ] Add health check endpoints (`/api/health`, `/api/health/ready`)
- [ ] Add global exception filter with consistent error responses
- [ ] Add HSTS header
- [ ] Add Content Security Policy header
- [ ] Fix CI/CD: require passing tests before Docker image push
- [ ] Add non-root user to backend Dockerfile
- [ ] Add LICENSE file (recommend BSL or AGPL for SaaS)
- [ ] Enforce pagination max limit (100) on all endpoints

### Phase 1: Stability (Week 2) — Production confidence

- [ ] Set up error monitoring (Sentry or equivalent)
- [ ] Set up uptime monitoring (UptimeRobot, Better Stack, or equivalent)
- [ ] Add structured JSON logging with request ID correlation
- [ ] Write critical path tests (auth, consent, patient, billing — ~20 tests)
- [ ] Add React Error Boundaries to authenticated layout
- [ ] Handle session expiry gracefully (401 detection, redirect, vault auto-lock)
- [ ] Add custom 404 and error pages
- [ ] Set up automated database backups

### Phase 2: Polish (Week 3) — Feature completeness

- [ ] Make practice info editable in settings (name, DSGVO contact)
- [ ] Apply brand color to public consent forms
- [ ] Implement manual patient creation form
- [ ] Wire enabled consent types toggle in settings
- [ ] Fix enterprise "Contact Us" button
- [ ] Add revenue amounts to analytics (Stripe API fetch)
- [ ] Build landing page with pricing, features, trust signals
- [ ] Build onboarding flow (post-setup welcome + guided first consent)

### Phase 3: Launch (Week 4) — Go live

- [ ] Independent security audit of zero-knowledge encryption
- [ ] Load testing (target: 100 concurrent consent submissions)
- [ ] Set up production environment (hosting, DNS, SSL certificates)
- [ ] Configure production environment variables
- [ ] Test all OAuth providers in production
- [ ] Test Stripe integration end-to-end in production
- [ ] Test email delivery in production
- [ ] Deploy and verify
- [ ] Begin early-adopter outreach (target: 10 practices)

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Data loss from unversioned migrations** | High (if schema changes) | Critical | Switch to `prisma migrate` before any production deployment |
| **Zero-knowledge key loss** | Medium | Critical (permanent data loss) | Document key backup procedures prominently in onboarding. Consider key escrow option. |
| **NextAuth v5 breaking changes** | Medium (beta dependency) | High | Pin version, monitor releases, plan migration path |
| **Stripe webhook failure** | Low | High (consent stuck in SIGNED) | Add webhook retry logic, manual status override for admins |
| **react-signature-canvas alpha** | Medium (alpha dependency) | Medium | Pin version, have fallback plan (replace with stable lib) |
| **Legal challenge to digital consent validity** | Low | Very High | Ensure timestamp + IP + audit trail meet BGB 630e requirements. Consult legal counsel. |
| **Competitor copies zero-knowledge claim** | Medium (12–18 months) | Medium | File prior art documentation. Publish technical architecture. Build brand recognition first. |
| **GDPR enforcement action** | Low (if compliant) | Very High | Complete Article 30 records of processing. Appoint DPO if >20 staff process data. |

---

*This document should be reviewed and updated monthly. Next review: 2026-03-21.*
*Generated from full codebase audit of 54 backend endpoints, 12 frontend routes, 30+ components, 14 database models.*
