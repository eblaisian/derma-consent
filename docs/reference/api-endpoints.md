# API Endpoints

> Auto-generated from codebase audit on 2026-03-22. Total: **114 endpoints**.

All backend endpoints are prefixed with `/api`. Protected endpoints require a JWT `Authorization: Bearer <token>` header. Rate limits use a sliding window per IP.

---

## Health (`/api/health`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/health` | Public | — | No throttle | Liveness check |
| GET | `/api/health/ready` | Public | — | No throttle | Readiness check (tests DB connectivity) |

---

## Authentication (`/api/auth`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/auth/sync` | x-auth-secret header | — | — | Sync OAuth user from NextAuth to backend |
| POST | `/api/auth/register` | Public | — | 5/min | Register new account with email + password |
| POST | `/api/auth/login` | Public | — | 5/min | Login with credentials, returns JWT |
| POST | `/api/auth/forgot-password` | Public | — | 3/min | Send password reset email |
| POST | `/api/auth/reset-password` | Public | — | 5/min | Reset password using token from email |
| POST | `/api/auth/verify-email` | Public | — | 5/min | Verify email address using token |
| POST | `/api/auth/resend-verification` | Public | — | 2/min | Resend email verification link |
| GET | `/api/auth/2fa/status` | JwtAuthGuard | — | — | Get current 2FA status for user |
| POST | `/api/auth/2fa/setup` | JwtAuthGuard | — | — | Generate 2FA setup secret + QR URI |
| POST | `/api/auth/2fa/enable` | JwtAuthGuard | — | — | Enable 2FA with TOTP token |
| POST | `/api/auth/2fa/disable` | JwtAuthGuard | — | — | Disable 2FA with TOTP token |
| POST | `/api/auth/2fa/verify` | Public | — | 5/min | Verify 2FA token during login |
| POST | `/api/auth/refresh-token` | JwtAuthGuard | — | — | Refresh JWT access token |
| GET | `/api/auth/account/profile` | JwtAuthGuard | — | — | Get authenticated user's profile |
| PATCH | `/api/auth/account/profile` | JwtAuthGuard | — | — | Update profile (name, etc.) |
| POST | `/api/auth/account/change-password` | JwtAuthGuard | — | 5/min | Change password (requires current password) |
| GET | `/api/auth/account/export` | JwtAuthGuard | — | — | GDPR Art. 15 — Data Subject Access Request (DSAR) |

---

## Consent Forms — Authenticated (`/api/consent`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/consent` | JwtAuthGuard | ADMIN, ARZT, EMPFANG | — | Create a new consent form and optionally send link via email |
| GET | `/api/consent/practice` | JwtAuthGuard | ADMIN, ARZT, EMPFANG | — | List consent forms for the practice (paginated) |
| POST | `/api/consent/:id/generate-pdf` | JwtAuthGuard | ADMIN, ARZT | — | Generate PDF for a signed/paid/completed consent |
| GET | `/api/consent/:id/pdf` | JwtAuthGuard | ADMIN, ARZT | — | Download generated PDF for a consent form |
| POST | `/api/consent/:id/send-copy` | JwtAuthGuard | ADMIN, ARZT | — | Send completed consent PDF copy to patient via email |
| PATCH | `/api/consent/:token/revoke` | JwtAuthGuard | ADMIN, ARZT | — | Revoke a consent form (staff-initiated) |

---

## Consent Forms — Public (`/api/consent`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/consent/:token` | Public | — | 10/min | Get consent form by public token |
| POST | `/api/consent/:token/submit` | Public | — | 3/min | Submit filled + signed consent form |
| POST | `/api/consent/:token/revoke` | Public | — | 3/min | GDPR Art. 7(3) — Patient-initiated consent revocation |
| POST | `/api/consent/:token/explain` | Public | — | 5/min | AI plain-language consent explanation for patients |

---

## Consent Verification (`/api/verify`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/verify/:id` | Public | — | 20/min | Verify consent authenticity by ID (public link) |

---

## Patients (`/api/patients`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/patients` | JwtAuthGuard | ADMIN, ARZT, EMPFANG | — | List patients for the practice (paginated) |
| GET | `/api/patients/:id` | JwtAuthGuard | ADMIN, ARZT, EMPFANG | — | Get patient by ID |
| POST | `/api/patients` | JwtAuthGuard | ADMIN, ARZT, EMPFANG | — | Create a new patient record |
| GET | `/api/patients/lookup/:hash` | JwtAuthGuard | ADMIN, ARZT, EMPFANG | — | Find patient by SHA-256 lookup hash |
| DELETE | `/api/patients/:id` | JwtAuthGuard | ADMIN | — | Delete a patient record |

---

## Team Management (`/api/team`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/team/members` | JwtAuthGuard | ADMIN | — | List all team members for the practice |
| POST | `/api/team/invite` | JwtAuthGuard | ADMIN | — | Create and send a team invite |
| DELETE | `/api/team/members/:userId` | JwtAuthGuard | ADMIN | — | Remove a team member |
| PATCH | `/api/team/members/:userId/role` | JwtAuthGuard | ADMIN | — | Change a team member's role |
| GET | `/api/team/invites` | JwtAuthGuard | ADMIN | — | List pending invites |
| PATCH | `/api/team/invites/:inviteId/resend` | JwtAuthGuard | ADMIN | — | Resend an invite email |
| DELETE | `/api/team/invites/:inviteId` | JwtAuthGuard | ADMIN | — | Revoke a pending invite |
| GET | `/api/team/invite/:token` | Public | — | — | Get invite details by token (public) |
| POST | `/api/team/invite/:token/accept` | JwtAuthGuard | ADMIN, ARZT, EMPFANG | — | Accept a team invite |

---

## Practice (`/api/practice`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/practice` | JwtAuthGuard | — | — | Create a new practice |
| GET | `/api/practice` | JwtAuthGuard | — | — | Get current user's practice |
| PATCH | `/api/practice` | JwtAuthGuard | ADMIN | — | Update practice details |
| PATCH | `/api/practice/rotate-key` | JwtAuthGuard | ADMIN | — | Rotate encryption keypair |

---

## Settings (`/api/settings`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/settings` | JwtAuthGuard | ADMIN | — | Get practice settings |
| PATCH | `/api/settings` | JwtAuthGuard | ADMIN | — | Update practice settings |
| POST | `/api/settings/logo` | JwtAuthGuard | ADMIN | — | Upload practice logo (multipart/form-data, max 10 MB) |
| DELETE | `/api/settings/logo` | JwtAuthGuard | ADMIN | — | Delete practice logo |

---

## Billing (`/api/billing`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/billing/plans` | Public | — | — | Get available subscription plans with Stripe price IDs |
| GET | `/api/billing/subscription` | JwtAuthGuard | ADMIN | — | Get current subscription status |
| GET | `/api/billing/usage` | JwtAuthGuard | ADMIN | — | Get usage summary (resource quotas + consent count) |
| POST | `/api/billing/checkout` | JwtAuthGuard | ADMIN | — | Create Stripe Checkout session |
| POST | `/api/billing/portal` | JwtAuthGuard | ADMIN | — | Create Stripe Customer Portal session |
| POST | `/api/billing/webhook` | Public (Stripe signature) | — | No throttle | Handle Stripe subscription webhooks |

---

## Stripe Connect (`/api/stripe/connect`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/stripe/connect/onboard` | JwtAuthGuard | ADMIN | — | Create Stripe Connect account + onboarding link |
| GET | `/api/stripe/connect/status` | JwtAuthGuard | ADMIN | — | Get Stripe Connect account status |
| POST | `/api/stripe/connect/dashboard-link` | JwtAuthGuard | ADMIN | — | Create Stripe Express Dashboard link |

---

## Stripe Webhooks (`/api/stripe`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/stripe/webhook` | Public (Stripe signature) | — | No throttle | Handle payment webhooks (checkout, refund, dispute) |

---

## Analytics (`/api/analytics`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/analytics/overview` | JwtAuthGuard | ADMIN | — | Dashboard overview stats |
| GET | `/api/analytics/by-type` | JwtAuthGuard | ADMIN | — | Consent counts grouped by treatment type |
| GET | `/api/analytics/by-period` | JwtAuthGuard | ADMIN | — | Consent counts over time (supports `days`, `startDate`, `endDate` query params) |
| GET | `/api/analytics/conversion` | JwtAuthGuard | ADMIN | — | Conversion funnel metrics |
| GET | `/api/analytics/revenue` | JwtAuthGuard | ADMIN | — | Revenue analytics (supports `startDate`, `endDate` query params) |
| GET | `/api/analytics/retention-flags` | JwtAuthGuard | ADMIN | — | Patient retention risk flags |
| GET | `/api/analytics/insights` | JwtAuthGuard | ADMIN | — | AI-generated analytics insights (supports `locale` query param) |

---

## Audit Log (`/api/audit`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/audit` | JwtAuthGuard | ADMIN | — | List audit log entries (paginated, filterable by `action`, `startDate`, `endDate`) |
| GET | `/api/audit/export` | JwtAuthGuard | ADMIN | — | Export audit log as CSV (filterable by `startDate`, `endDate`, `locale`) |
| POST | `/api/audit/vault-event` | JwtAuthGuard | ADMIN, ARZT, EMPFANG | — | Log vault lock/unlock event |

---

## Photos (`/api/photos`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/photos` | JwtAuthGuard | ADMIN, ARZT | No throttle | Upload encrypted photo (multipart/form-data, max 10 MB) |
| GET | `/api/photos/patient/:patientId` | JwtAuthGuard | ADMIN, ARZT | No throttle | List photos for a patient (filterable by `type`, `bodyRegion`, `treatmentPlanId`) |
| GET | `/api/photos/:id` | JwtAuthGuard | ADMIN, ARZT | No throttle | Get photo metadata by ID |
| GET | `/api/photos/:id/download` | JwtAuthGuard | ADMIN, ARZT | No throttle | Download encrypted photo blob |
| DELETE | `/api/photos/:id` | JwtAuthGuard | ADMIN, ARZT | No throttle | Delete a photo |
| PATCH | `/api/photos/:id/consent` | JwtAuthGuard | ADMIN, ARZT | No throttle | Update photo consent status |

---

## Treatment Plans (`/api/treatment-plans`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/treatment-plans` | JwtAuthGuard | ADMIN, ARZT | — | Create a treatment plan |
| GET | `/api/treatment-plans/patient/:patientId` | JwtAuthGuard | ADMIN, ARZT | — | List treatment plans for a patient (paginated) |
| GET | `/api/treatment-plans/:id` | JwtAuthGuard | ADMIN, ARZT | — | Get treatment plan by ID |
| PATCH | `/api/treatment-plans/:id` | JwtAuthGuard | ADMIN, ARZT | — | Update a treatment plan |
| DELETE | `/api/treatment-plans/:id` | JwtAuthGuard | ADMIN, ARZT | — | Delete a treatment plan |
| POST | `/api/treatment-plans/aftercare` | JwtAuthGuard | ADMIN, ARZT | — | Generate AI aftercare instructions |
| POST | `/api/treatment-plans/aftercare/send` | JwtAuthGuard | ADMIN, ARZT | — | Send aftercare instructions to patient |

---

## Treatment Templates (`/api/treatment-templates`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/treatment-templates` | JwtAuthGuard | ADMIN, ARZT | — | List treatment templates for the practice |
| POST | `/api/treatment-templates` | JwtAuthGuard | ADMIN, ARZT | — | Create a treatment template |
| PATCH | `/api/treatment-templates/:id` | JwtAuthGuard | ADMIN, ARZT | — | Update a treatment template |
| DELETE | `/api/treatment-templates/:id` | JwtAuthGuard | ADMIN, ARZT | — | Delete a treatment template |

---

## Communications (`/api/communications`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/communications/draft` | JwtAuthGuard | ADMIN, ARZT, EMPFANG | 10/min | Generate AI-drafted message for a patient |
| POST | `/api/communications/send` | JwtAuthGuard | ADMIN, ARZT, EMPFANG | 5/min | Send message to patient (email/SMS/WhatsApp) |

---

## AI Status (`/api/ai`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/ai/public-status` | Public | — | 20/min | Check if AI features are configured (public) |
| GET | `/api/ai/status` | JwtAuthGuard | — | — | Get AI feature availability based on subscription plan |

---

## GDT Export (`/api/gdt`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/gdt/generate` | JwtAuthGuard | — | — | Generate GDT file for PVS integration (German medical data format) |

---

## Feature Flags (`/api/features`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/features` | JwtAuthGuard | — | — | Get feature flags (e.g. WhatsApp enabled) |

---

## Contact (`/api/contact`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/contact` | Public | — | 3/min | Submit contact form (sends email to info@derma-consent.de) |

---

## Platform Admin — Dashboard (`/api/admin/dashboard`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/admin/dashboard` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | Platform dashboard stats (practices, users, consents, revenue) |
| GET | `/api/admin/dashboard/usage` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | Platform-wide resource usage aggregates |

---

## Platform Admin — Practices (`/api/admin/practices`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/admin/practices` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | List all practices (paginated, searchable) |
| GET | `/api/admin/practices/:id` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | Get practice detail (users, subscription, consent breakdown) |
| POST | `/api/admin/practices/:id/suspend` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | Suspend a practice |
| POST | `/api/admin/practices/:id/activate` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | Reactivate a suspended practice |
| PATCH | `/api/admin/practices/:id/subscription` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | Override a practice's subscription plan |
| GET | `/api/admin/practices/:id/usage` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | Get resource usage summary for a practice |

---

## Platform Admin — Config (`/api/admin/config`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/admin/config` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | No throttle | List all config entries (filterable by `category`) |
| GET | `/api/admin/config/:key` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | No throttle | Get a single config value |
| PUT | `/api/admin/config/:key` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | No throttle | Set a config value (secrets auto-encrypted) |
| DELETE | `/api/admin/config/:key` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | No throttle | Delete a config entry |
| POST | `/api/admin/config/test/:category` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | No throttle | Test connection for a service category (e.g. email, sms) |
| POST | `/api/admin/config/validate-all` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | No throttle | Validate all configured service connections |

---

## Platform Admin — Email (`/api/admin/email`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| POST | `/api/admin/email/send` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | No throttle | Send email to arbitrary recipients (admin tool) |

---

## Platform Admin — Notifications (`/api/admin/notifications`)

| Method | Path | Auth | Roles | Rate Limit | Description |
|--------|------|------|-------|------------|-------------|
| GET | `/api/admin/notifications` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | List notification logs (filterable by `status`, `channel`, `templateKey`, `practiceId`) |
| GET | `/api/admin/notifications/stats` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | Get notification delivery stats (total, sent, failed, pending) |
| POST | `/api/admin/notifications/test` | JwtAuthGuard + PlatformAdminGuard | PLATFORM_ADMIN | — | Send test notification (email, SMS, or WhatsApp) |
