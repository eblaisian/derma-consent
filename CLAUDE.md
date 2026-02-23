# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
make dev              # Start everything (PostgreSQL + backend + frontend)
make setup            # Install deps, start DB, run migrations, generate Prisma client
make test             # Run all tests (backend + frontend)
make test-backend     # Backend tests only (Jest): cd packages/backend && npx jest
make test-frontend    # Frontend tests only (Vitest): cd packages/frontend && npx vitest run
make build            # Production build of both packages
make migrate          # Run Prisma migrations (prisma migrate dev)
make migrate-deploy   # Run Prisma migrations for production (prisma migrate deploy)
make generate         # Regenerate Prisma client after schema changes
make seed             # Seed DB with test data (see Test Credentials below)
make clean            # Remove node_modules, dist, .next, Docker volumes
pnpm lint             # Lint all packages
```

Run a single backend test: `cd packages/backend && npx jest --testPathPattern=<pattern>`
Run a single frontend test: `cd packages/frontend && npx vitest run <file>`

Backend runs on port 3001, frontend on port 3000. PostgreSQL via Docker Compose.

## Architecture Overview

**pnpm monorepo** with two packages:

- `packages/frontend` — Next.js 16 (App Router, React 19) with NextAuth 5, TailwindCSS 4, shadcn/ui
- `packages/backend` — NestJS 11 REST API with Prisma 6 + PostgreSQL

### Frontend

- **Routing**: Next.js App Router. Protected routes under `src/app/(authenticated)/` guarded by middleware (`src/middleware.ts`). Platform admin routes under `src/app/(platform-admin)/admin/`. Public routes: `/consent/[token]`, `/invite/[token]`, `/login`, `/register`.
- **Auth**: NextAuth 5 (beta) with OAuth (Google, Microsoft Entra, Apple) + credentials. Session stores a JWT `accessToken` from the backend. Config in `src/lib/auth.ts`.
- **Data fetching**: SWR with authenticated fetch wrapper (`src/lib/auth-fetch.ts`). API base URL via `NEXT_PUBLIC_API_URL`.
- **Forms**: react-hook-form + Zod validation schemas.
- **i18n**: next-intl with 8 locales (de, en, es, fr, ar, tr, pl, ru). Messages in `src/i18n/messages/`. Locale detected from browser and stored in cookie.
- **UI**: shadcn/ui components in `src/components/ui/`, feature components organized by domain (patients, team, billing, analytics, etc.).
- **Testing**: Vitest, tests in `src/lib/__tests__/`.

### Backend

- **Module structure**: Standard NestJS modules — each feature has a `*.module.ts`, `*.controller.ts`, `*.service.ts`, and DTOs validated with class-validator.
- **Auth**: JWT strategy (`src/auth/jwt.strategy.ts`), guards (`JwtAuthGuard`, `RolesGuard`, `PlatformAdminGuard`), `@CurrentUser()` decorator. Four roles: `ADMIN`, `ARZT`, `EMPFANG`, `PLATFORM_ADMIN`.
- **Database**: Prisma ORM. Schema at `packages/backend/prisma/schema.prisma`. Column names use snake_case via `@@map`. After schema changes, run `make migrate && make generate`.
- **Key modules**: auth, consent, patient, practice, team, billing, stripe, email, pdf, audit, analytics, gdt (German medical data format), settings, admin, platform-config.
- **Testing**: Jest, spec files alongside source (`*.spec.ts`).

### Zero-Knowledge Encryption

Critical architectural pattern — patient data is encrypted client-side before the server sees it.

- `src/lib/crypto.ts`: RSA-4096 + AES-256-GCM hybrid encryption using Web Crypto API (no external libs).
- **Flow**: Practice has RSA keypair (public in DB as JWK, private encrypted with master password via PBKDF2). Each consent form generates a fresh AES session key, encrypts data with it, then wraps the session key with the practice's RSA public key.
- Patient PII stored in `encrypted_*` columns. Lookup uses SHA-256 hash (`lookupHash`) for deduplication without decryption.
- `src/hooks/use-vault.ts`: Client-side vault for decrypted private key (unlocked with master password).
- `src/common/pii-sanitizer.interceptor.ts`: Backend interceptor that redacts encrypted fields from logs.

### Billing

Stripe Connect model — practices are connected accounts. Webhook handler at `src/billing/billing-webhook.controller.ts`. Plans: FREE_TRIAL, STARTER, PROFESSIONAL, ENTERPRISE.

### Consent Form Lifecycle

`PENDING` → `FILLED` → `SIGNED` → `PAID` → `COMPLETED` (or `EXPIRED`/`REVOKED`). Public form accessed via unique token URL (`/consent/[token]`). Includes signature canvas and client-side encryption before submission. PDFs generated with PDFKit, stored in Supabase.

### Platform Admin

Cross-practice administration layer accessible at `/admin`. Requires `PLATFORM_ADMIN` role.

- **Routes**: `/admin` (dashboard), `/admin/practices` (list/manage), `/admin/practices/[id]` (detail with tabs), `/admin/config` (configuration UI).
- **PlatformConfigService** (`src/platform-config/`): Global service for managing integration config (Stripe, Resend, Twilio, Supabase, plan limits). DB → env var → default fallback chain. Secrets encrypted with AES-256-GCM using `PLATFORM_ENCRYPTION_KEY`. 60s in-memory cache.
- **AdminModule** (`src/admin/`): Three controllers — dashboard stats, practice management (suspend/activate/override subscription), config CRUD + connection testing. All endpoints guarded with `JwtAuthGuard` + `PlatformAdminGuard`.
- **Practice suspension**: `isSuspended` flag on Practice model. `SubscriptionGuard` blocks API access for suspended practices.

## Test Credentials

After running `make seed`:

| Account | Email | Password | Role | Notes |
|---|---|---|---|---|
| **Platform Admin** | `admin@dermaconsent.de` | `AdminTest1234!` | `PLATFORM_ADMIN` | No practice. Login → redirected to `/admin` |
| Practice 1 Admin | `admin@praxis-mueller.de` | `Test1234!` | `ADMIN` | Dermatologie Praxis Dr. Mueller |
| Practice 1 Doctor | `dr.mueller@praxis-mueller.de` | `Test1234!` | `ARZT` | |
| Practice 1 Reception | `empfang@praxis-mueller.de` | `Test1234!` | `EMPFANG` | |
| Practice 2 Admin | `admin@hautklinik-schmidt.de` | `Test1234!` | `ADMIN` | Hautklinik Dr. Schmidt |
| Practice 2 Doctor | `dr.schmidt@hautklinik-schmidt.de` | `Test1234!` | `ARZT` | |
| Practice 2 Reception | `empfang@hautklinik-schmidt.de` | `Test1234!` | `EMPFANG` | |

**Master password** (vault unlock, all practices): `Test1234!`

## Key Environment Variables

Backend requires: `DATABASE_URL`, `AUTH_SECRET`, `FRONTEND_URL`. Optional: Stripe keys, `RESEND_API_KEY`, Supabase credentials, `PLATFORM_ENCRYPTION_KEY` (for encrypting secrets in PlatformConfig DB). Frontend requires: `NEXT_PUBLIC_API_URL`. OAuth provider keys are optional (providers auto-register when env vars present). See `.env.example` for full list.
