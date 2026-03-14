# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow

**This is a pre-launch startup. Speed to market matters. Be fast by default, thorough when it matters.**

Before any code change, quickly assess the size and act accordingly:

### Small (most requests): Just do it well
**Applies to:** bug fixes, text changes, styling, adding a field, small UI tweaks, config changes.
- Read the relevant files fully before editing (never modify code you haven't read)
- Implement the change following Code Quality Standards below
- Run `npx tsc --noEmit` in affected package to verify
- Run relevant tests if they exist

### Medium: Think first, then build
**Applies to:** new API endpoints, new pages/components, adding a filter or form, schema changes, anything touching 5+ files.
- Search the codebase first — do NOT reinvent what exists. Check similar modules and follow the same patterns
- Briefly outline what files you'll create/modify and what approach you'll take
- Implement, then run the `code-hygienist` agent to clean up dead code
- Run tests and TypeScript check

### Large: Plan before building
**Applies to:** new features, redesigns, refactoring core systems, anything touching encryption/auth/billing/data models.
- Use the `researcher` agent if the domain is unfamiliar or there are multiple viable approaches
- Use the `feature-planner` agent to create a structured implementation plan
- **Present the plan and get user approval BEFORE writing code**
- If new API endpoints are needed, use the `api-designer` agent during planning
- Implement in order, then run `code-hygienist` agent
- Run `code-reviewer` agent after implementation
- If UI text was added, run `i18n-sync` agent
- If encryption/auth was touched, run `security-auditor` agent

### Escalation triggers
These topics ALWAYS escalate to Large, regardless of how small the request seems:
- Anything touching `crypto.ts`, `use-vault.ts`, or `encrypted_*` columns
- Changes to auth guards, JWT strategy, or role-based access
- Prisma schema changes to patient-related models
- Billing/Stripe webhook changes
- Changes to the public consent form flow (`/consent/[token]`)

---

## Code Quality Standards

**CRITICAL: These standards apply to EVERY code change, no exceptions. You are a senior solution architect, not a junior developer applying quick fixes.**

### The Golden Rule: Refactor, Never Patch

When the user asks you to change, update, rework, or redesign something:

1. **Understand the full picture FIRST.** Read the entire module/component/file being changed and all its dependents. Never modify code you haven't fully read and understood.
2. **Rewrite properly, don't wrap old code.** If a feature's requirements changed, rewrite the implementation to match the new requirements cleanly — as if you were writing it from scratch with today's knowledge. Do NOT add conditional branches, wrapper functions, or adapter layers around old logic.
3. **Delete, don't comment out.** When code is no longer needed, remove it entirely. Never leave commented-out code, `// TODO: remove`, `// OLD:`, or dead branches. Git history preserves the old version.
4. **Follow the ripple.** Every change has consequences. When you modify something, trace all references and update them:
   - Changed a component's props? → Update every file that uses it
   - Removed a feature? → Remove its routes, translations, API endpoints, tests, types, and imports
   - Changed a DB model? → Update DTOs, services, controllers, frontend types, and seed data
   - Changed a UI layout? → Remove unused CSS classes, components, and assets
5. **One pattern, not two.** If you're introducing a better way to do something, migrate ALL instances to the new pattern. Never leave the codebase in a state where two patterns coexist for the same thing.

### What "Clean Code" Means in This Project

After every change, the codebase should look as if it was **written today from scratch with the current requirements**. Specifically:

- **No dead code**: Every file, function, component, variable, import, translation key, route, and type is actively used. Nothing exists "just in case" or "for backwards compatibility."
- **No orphaned files**: If a feature is removed or replaced, ALL its artifacts are removed — components, tests, translations, API endpoints, DTOs, Prisma models, routes, hooks.
- **No stale references**: Every import resolves. Every type matches. Every route leads somewhere. Every translation key has text in all 8 locales and is used in at least one component.
- **No dual patterns**: There is ONE way to do each thing — one data fetching pattern, one form pattern, one auth pattern, one error handling pattern. If a better pattern is introduced, the old one is fully migrated away.
- **No wrapper hacks**: No adapter functions, compatibility shims, or glue code that exists solely because old code wasn't properly updated. If the interface changed, update the callers.

### Specific Anti-Patterns to NEVER Do

| Anti-Pattern | What to Do Instead |
|---|---|
| Adding `if (newMode) { ... } else { oldCode }` | Rewrite the function for the new behavior, delete old path |
| Commenting out old code "for reference" | Delete it. Use git history if you need it back |
| Creating `ComponentV2` alongside `Component` | Rename and update `Component` in-place, update all imports |
| Leaving unused imports after refactoring | Remove every unused import immediately |
| Keeping old API endpoints "for compatibility" | This is pre-launch — there are no external consumers. Delete the old endpoint |
| Adding a wrapper around a library you're replacing | Complete the replacement in one pass |
| Leaving `// TODO: clean up later` | Clean up now. There is no "later" |
| Keeping unused translation keys | Delete from all 8 locale files |
| Leaving empty files or stub implementations | Delete the file entirely |

### The "Fresh Eyes" Test

After completing any change, ask yourself: **"If a new senior developer joined and read this code for the first time, would they see any evidence that this was iteratively modified? Or would it look like it was designed this way from the start?"**

If they would see patches, layers, or artifacts of previous versions → you're not done. Keep refactoring until it looks intentional and clean.

---

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

### Deployment & Infrastructure

- **Cloud**: DigitalOcean — DOKS (Kubernetes), Managed PostgreSQL, Container Registry (DOCR)
- **Domains**: `consent.eblaisian.com` (frontend), `api.consent.eblaisian.com` (backend)
- **Orchestration**: Kubernetes (DOKS) — cluster provisioned via DO console
- **Manifests**: Kustomize — `infra/kubernetes/base/` + `overlays/prod/`
- **CI/CD**: GitHub Actions — `ci.yml` (test on PR), `deploy.yml` (build → deploy to production on push to master)
- **TLS**: cert-manager + Let's Encrypt (automatic HTTPS)
- **Containers**: Docker multi-stage builds (Node 20-alpine, linux/amd64). Dockerfiles in each package directory.
- **Deploy script**: `infra/scripts/deploy-env.sh` — Kustomize apply + Prisma migration job + rollout wait
- **Docker Compose**: `docker-compose.yml` (dev — PostgreSQL on port 5433), `docker-compose.prod.yml` (full stack with resource limits)
- **Load testing**: k6 scripts in `tests/load/`

### Product Strategy

See `docs/STRATEGY.md` for full product strategy, target market, and roadmap. Key context:
- Target market: Dermatology practices in Germany (DACH region)
- Pre-launch status — not yet released
- Product documentation: `docs/` (VitePress — setup, guides, API reference, design system)

## Key Environment Variables

Backend requires: `DATABASE_URL`, `AUTH_SECRET`, `FRONTEND_URL`. Optional: Stripe keys, `RESEND_API_KEY`, Supabase credentials, `PLATFORM_ENCRYPTION_KEY` (for encrypting secrets in PlatformConfig DB). Frontend requires: `NEXT_PUBLIC_API_URL`. OAuth provider keys are optional (providers auto-register when env vars present). See `.env.example` for full list.

## UI/UX Design Workflow

This project has a structured UI/UX workflow to produce polished, professional interfaces.

### Design → Build → Polish Pipeline

When building any UI:

1. **Design phase**: Use `/frontend-design` skill to commit to an aesthetic direction, define typography/color/spacing rules, and plan all component states before writing code
2. **Build phase**: Implement using shadcn/ui components, Tailwind theme tokens, and the design system defined in step 1
3. **Polish phase**: Run skills in sequence:
   - `/baseline-ui` — Fix spacing, typography, interaction states, visual consistency
   - `/fix-accessibility` — Keyboard nav, ARIA labels, focus management, semantic HTML
   - `/fix-motion` — Animation performance + `prefers-reduced-motion` compliance
4. **Review phase**: Use `/ui-review` for comprehensive design quality audit

### Visual Feedback Loop (Playwright MCP)

When `make dev` is running, use the Playwright MCP to close the visual feedback loop:
1. Navigate to `localhost:3000` and the page being built
2. Take a screenshot → visually verify the design
3. Iterate until it looks intentionally designed, not AI-generated

### Reference Designs

Drop screenshots of admired UIs into `.claude/ui-references/` for visual anchoring. Reference them when building new pages.

---

## Claude Code Setup

This project has custom skills, agents, and rules configured in `.claude/`:

### Skills (invoke with `/command`)

**Development:**
- `/test-backend [pattern]` — Run backend Jest tests
- `/test-frontend [file]` — Run frontend Vitest tests
- `/db-migrate` — Safe migration workflow (status → migrate → generate → test)
- `/db-seed` — Seed database with test data
- `/db-reset` — Reset database to clean state (destructive)
- `/dev-start` — Start full dev environment
- `/build` — Full production build with TypeScript checks
- `/review-changes` — Review uncommitted changes for quality/security
- `/pr [title]` — Create pull request with template
- `/deploy [staging|production]` — Deployment workflow
- `/load-test` — Run k6 load tests

**UI/UX Design:**
- `/frontend-design` — Design direction + production code with full state handling
- `/baseline-ui [path]` — Polish spacing, typography, interaction states, visual consistency (ibelick/ui-skills)
- `/fix-accessibility [path]` — Fix keyboard nav, ARIA labels, focus, semantic HTML
- `/fix-motion [path]` — Fix animation performance + reduced-motion compliance
- `/fixing-accessibility [path]` — WCAG compliance audit (ibelick/ui-skills)
- `/fixing-motion-performance [path]` — Animation perf audit (ibelick/ui-skills)
- `/fixing-metadata [path]` — SEO, Open Graph, meta tags audit (ibelick/ui-skills)
- `/ui-review [path]` — Comprehensive UI design quality review and audit
- `/web-design-guidelines [path]` — 100+ Web Interface Guidelines rules (Vercel)
- `/composition-patterns` — React composition patterns: compound components, context, variants (Vercel)
- `/react-best-practices` — 57 React/Next.js performance optimization rules (Vercel)

### Agents

**Before building (Large changes):**
- **researcher** — Research technologies, libraries, competitors when approach is unclear
- **feature-planner** — Structured implementation plan for features touching 5+ files
- **api-designer** — Design REST API endpoints following existing NestJS patterns

**After building (Medium + Large changes):**
- **code-hygienist** — Scan and remove dead code, orphaned files, stale translations
- **code-reviewer** — Review for security, encryption, and quality (Large changes, sensitive areas)
- **i18n-sync** — Check/sync translation keys across all 8 locales
- **security-auditor** — Deep healthcare compliance audit (runs on Opus — use for sensitive changes and pre-release)

**UI/UX:**
- **ui-designer** — Senior UI/UX designer agent (runs on Opus) — designs and builds polished interfaces from scratch

**On-demand:**
- **debugger** — Investigate bugs and failing tests
- **infra-advisor** — Debug deployment, Kubernetes, Terraform, and CI/CD issues
- **pre-deploy-check** — Full validation checklist before deploying/merging
