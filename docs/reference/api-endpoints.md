# API Endpoints

All backend endpoints are prefixed with `/api`. Protected endpoints require a JWT `Authorization: Bearer <token>` header.

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Register with email + password |
| `POST` | `/api/auth/login` | No | Login with credentials |
| `POST` | `/api/auth/sync` | Special | OAuth user sync (requires `x-auth-secret` header) |

Auth endpoints are rate-limited to 5 requests per 60 seconds.

## Consent Forms

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/consent` | ADMIN, ARZT | Create a consent form |
| `GET` | `/api/consent/practice` | ADMIN, ARZT | List practice consent forms |
| `PATCH` | `/api/consent/:token/revoke` | ADMIN, ARZT | Revoke a consent form |
| `GET` | `/api/consent/:token` | Public | Get consent form by token |
| `POST` | `/api/consent/:token/submit` | Public | Submit consent (encrypted) |

## Patients

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/api/patients` | ADMIN, ARZT | List all patients |
| `GET` | `/api/patients/:id` | ADMIN, ARZT | Get patient by ID |
| `POST` | `/api/patients` | ADMIN, ARZT | Create a patient |
| `GET` | `/api/patients/lookup/:hash` | ADMIN, ARZT | Find patient by lookup hash |
| `DELETE` | `/api/patients/:id` | ADMIN | Delete a patient |

## Practice

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/practice` | Authenticated | Create a practice |
| `GET` | `/api/practice` | Authenticated | Get practice details |

## Team

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/api/team/members` | ADMIN | List team members |
| `POST` | `/api/team/invite` | ADMIN | Send team invite |
| `DELETE` | `/api/team/members/:userId` | ADMIN | Remove team member |
| `PATCH` | `/api/team/members/:userId/role` | ADMIN | Change member role |
| `GET` | `/api/team/invite/:token` | Public | Get invite details |
| `POST` | `/api/team/invite/:token/accept` | Public | Accept team invite |

## Billing

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/api/billing/subscription` | ADMIN | Get subscription details |
| `POST` | `/api/billing/checkout` | ADMIN | Create Stripe checkout session |
| `POST` | `/api/billing/portal` | ADMIN | Create Stripe portal session |
| `POST` | `/api/billing/webhook` | Public | Stripe webhook handler |

## Audit

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/api/audit` | ADMIN | List audit logs (filterable by action, date range) |
| `GET` | `/api/audit/export` | ADMIN | Export audit logs as CSV |
| `POST` | `/api/audit/vault-event` | Authenticated | Log vault lock/unlock event |

## Analytics

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/api/analytics/overview` | ADMIN, ARZT | Dashboard overview |
| `GET` | `/api/analytics/by-type` | ADMIN, ARZT | Analytics by consent type |
| `GET` | `/api/analytics/by-period` | ADMIN, ARZT | Analytics by time period |
| `GET` | `/api/analytics/conversion` | ADMIN, ARZT | Conversion metrics |
| `GET` | `/api/analytics/revenue` | ADMIN | Revenue metrics |

## Settings

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/api/settings` | ADMIN | Get practice settings |
| `PATCH` | `/api/settings` | ADMIN | Update practice settings |
| `POST` | `/api/settings/logo` | ADMIN | Upload practice logo |
| `DELETE` | `/api/settings/logo` | ADMIN | Delete practice logo |

## Photos

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/photos` | ADMIN, ARZT | Upload photo (encrypted) |
| `GET` | `/api/photos/patient/:patientId` | ADMIN, ARZT | List photos by patient |
| `GET` | `/api/photos/:id` | ADMIN, ARZT | Get photo details |
| `GET` | `/api/photos/:id/download` | ADMIN, ARZT | Download encrypted photo |
| `DELETE` | `/api/photos/:id` | ADMIN, ARZT | Delete photo |
| `PATCH` | `/api/photos/:id/consent` | ADMIN, ARZT | Update photo consent status |

## Treatment Plans

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/treatment-plans` | ADMIN, ARZT | Create treatment plan |
| `GET` | `/api/treatment-plans/patient/:patientId` | ADMIN, ARZT | List plans by patient |
| `GET` | `/api/treatment-plans/:id` | ADMIN, ARZT | Get treatment plan |
| `PATCH` | `/api/treatment-plans/:id` | ADMIN, ARZT | Update treatment plan |
| `DELETE` | `/api/treatment-plans/:id` | ADMIN, ARZT | Delete treatment plan |

## Treatment Templates

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/api/treatment-templates` | ADMIN, ARZT | List templates |
| `POST` | `/api/treatment-templates` | ADMIN, ARZT | Create template |
| `PATCH` | `/api/treatment-templates/:id` | ADMIN, ARZT | Update template |
| `DELETE` | `/api/treatment-templates/:id` | ADMIN, ARZT | Delete template |

## GDT Export

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/gdt/generate` | Authenticated | Generate GDT consent record file |
