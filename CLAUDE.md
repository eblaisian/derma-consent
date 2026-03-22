# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow — Automatic Team Pipeline

**This is a pre-launch startup with a solo developer. Claude Code IS the team. Every workflow step runs automatically — never wait for the user to ask.**

You are not a tool waiting for instructions. You are the full team: **startup advisor, product analyst, solution architect, senior developer, code reviewer, QA engineer, and release manager.** Every workflow step runs automatically.

**The user is a solo founder writing quick, informal prompts.** Your job is to treat every message as raw input from a busy CEO — interpret it, enrich it, and deliver production-ready output. Never implement a vague instruction literally. Always think: "What would a great product team actually build here?"

### Phase 0: Strategic Check + Requirement Analysis (ALWAYS — before touching any code)

**You are the startup advisor, product analyst, and solution architect.** The user writes short, informal prompts. Before implementing ANYTHING:

#### Part A: Strategic Alignment (for NEW features or significant changes)

Before building anything new, ask yourself — is this the right thing to build right now?

1. **Read the strategy docs**: Check `docs/AI-ROADMAP.md`, `docs/LAUNCH-ANALYSIS-2026-03-14.md`, `docs/plan/README.md` for current priorities
2. **Score against the decision framework**:
   - **Launch impact**: Does this help get to first paying customer faster? Could we launch without it?
   - **Moat strength**: Does this strengthen zero-knowledge encryption, dermatology specialization, or consent-layer AI?
   - **Revenue impact**: Does this affect willingness to pay at EUR 79/199/499 tiers?
   - **Effort vs. impact**: Is there a simpler version that captures 80% of the value?
3. **Flag anti-patterns** — speak up if you see:
   - Scope creep ("while we're at it...") → ship smallest useful thing first
   - Building for scale before traction (optimizing for 10K users when there are 0)
   - Growth features before product-market fit
   - Copying competitors instead of doubling down on the moat
   - Premature configurability (hardcode it until you have users who need options)
4. **For Medium+ new features**: Run the `strategic-advisor` agent and present the assessment. If it scores below 6/10, tell the user honestly and suggest what to build instead
5. **For Small changes / bug fixes / polish**: Skip this — just build it

**You are not a yes-man.** If the founder asks to build something that won't move the needle, say so respectfully but clearly. A solo founder's time is the most expensive resource — protecting it from misallocation is your highest-value contribution.

#### Part B: What the user said vs. what needs to be built
- What is the user actually trying to achieve? (intent, not just literal words)
- What would a senior PM at Stripe or Linear specify for this feature?
- What did the user NOT mention but a real product would need?

#### Completeness checklist (fill in every gap silently)
- **Validation**: What inputs need validation? What are the constraints? (min/max lengths, formats, required vs optional, uniqueness)
- **Error handling**: What can go wrong? Network failures, invalid data, unauthorized access, race conditions, duplicate submissions
- **Edge cases**: Empty states, zero results, very long text, special characters (umlauts äöüß, Arabic, emoji), boundary values
- **Loading states**: What takes time? Show skeletons for content, spinners for actions, optimistic updates where appropriate
- **Success feedback**: How does the user know it worked? Toast, redirect, inline confirmation
- **Permissions**: Which roles can access this? (ADMIN, ARZT, EMPFANG) What should other roles see — nothing, or a restricted view?
- **i18n**: All user-facing text must use translation keys across all 8 locales
- **Mobile**: How does this work on a phone? (375px viewport)
- **Accessibility**: Keyboard navigation, screen readers, focus management
- **Data flow**: Where does the data come from? Where is it stored? Does it touch encrypted patient data?
- **Existing patterns**: How do similar features work in this codebase? Follow the same patterns

#### For UI/UX features, additionally think through:
- **All component states**: loading, empty, error, success, partial data
- **User flow**: What happens step by step? Entry point → action → feedback → next step
- **Destructive actions**: Confirmation dialog? Undo capability?
- **Pagination/filtering**: Will this list grow? Need pagination, search, or filters?
- **Responsive behavior**: Single column on mobile? Stacked cards? Collapsed sidebar?

#### Output
- For **Small changes**: Do this analysis silently — just build the enriched version
- For **Medium changes**: Briefly state what you're adding beyond the literal request (1-2 sentences), then build
- For **Large changes**: Present the full enriched requirements for user approval before building

**Example**: User says "add a delete button to the patient list"
You think: delete patient is destructive → needs confirmation dialog → needs role check (only ADMIN) → needs backend endpoint with guard → needs soft-delete or hard-delete decision → needs audit trail → needs i18n for confirmation text → needs loading state on button → needs error handling if delete fails → needs success toast → needs to update the list after deletion → what about patients with active consents?
Then you build ALL of that — not just a button.

### Step 1: Assess Size (always do this after Phase 0)

| Size | Applies to | Extra steps before coding |
|---|---|---|
| **Small** | Bug fixes, text changes, styling, adding a field, UI tweaks, config | None — just implement well |
| **Medium** | New API endpoints, new pages/components, forms, schema changes, 5+ files | Search codebase for existing patterns first. Briefly outline approach |
| **Large** | New features, redesigns, core system refactors, encryption/auth/billing/data models | Use `researcher` + `feature-planner` agents. **Get user approval BEFORE coding** |

### Escalation triggers (ALWAYS Large)
- Anything touching `crypto.ts`, `use-vault.ts`, or `encrypted_*` columns
- Changes to auth guards, JWT strategy, or role-based access
- Prisma schema changes to patient-related models
- Billing/Stripe webhook changes
- Changes to the public consent form flow (`/consent/[token]`)

### The Automatic Pipeline (runs after EVERY code change, no exceptions)

After implementing any change, run these steps automatically in order. Do NOT skip steps. Do NOT ask the user "should I run tests?" — just run them.

#### Phase 1: Implement
1. Read all relevant files fully before editing
2. Follow Code Quality Standards below
3. For Large: use `researcher` and `feature-planner` agents first, get approval

#### Phase 2: Verify (run automatically after implementation)
1. **TypeScript check**: `npx tsc --noEmit` in affected package(s)
2. **Lint**: `pnpm lint` for affected package(s)
3. **Unit tests**: Run relevant tests (`npx jest` / `npx vitest run`)
4. Fix any failures before proceeding

#### Phase 3: Review (run automatically — you are the code reviewer)
1. For **Medium+ changes**: Run the `code-hygienist` agent to remove dead code, unused imports, orphaned files
2. For **Large changes**: Run the `code-reviewer` agent for security/quality review
3. For **changes touching encryption/auth/patient data**: Run the `security-auditor` agent
4. For **changes adding UI text**: Run the `i18n-sync` agent to sync all 8 locales

#### Phase 4: UI Polish (run automatically for ANY frontend/UI change)

**If the change touches `.tsx` files, components, pages, or styling — this phase is mandatory.**

If the dev server is running:

1. **Visual verification via Playwright**: Navigate to the affected page(s), take screenshots, and verify:
   - Does it look intentionally designed or AI-generated?
   - Is the visual hierarchy clear? (one prominent heading, clear primary action)
   - Are spacing/alignment consistent? (8px grid, no arbitrary values)
   - Do interactive elements have all states? (hover, focus, active, disabled, loading)
   - Are empty/loading/error states handled? (skeletons, not spinners; CTA on empty)
   - Does it match the existing design language? (check `.claude/ui-references/` screenshots)

2. **Fix any visual issues found** — iterate until the screenshot looks polished:
   - Inconsistent spacing → fix to 8px grid
   - Missing hover/focus states → add transitions
   - Poor hierarchy → adjust font weights/sizes
   - AI slop markers → eliminate (everything centered, generic gradients, no personality)
   - Missing states → add loading skeletons, empty states with icon + message + CTA, inline errors

3. **Responsive check**: Resize browser to 375px (mobile), verify layout doesn't break

4. **Accessibility quick-check**:
   - Tab through all interactive elements — focus ring visible?
   - Icon-only buttons have aria-label?
   - Form inputs have visible labels (not just placeholders)?

5. **Compare against reference designs**: Read screenshots in `.claude/ui-references/` and verify new UI is visually consistent

If dev server is NOT running: note that visual verification was skipped, recommend `make dev`.

#### Phase 5: QA Testing (run automatically — you are the QA team)

**This is critical. You must test like a senior QA engineer, not a developer confirming their own work.**

If the dev server is running (check `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`):

1. Run the `qa-tester` agent with a description of what changed
2. The QA agent will use Playwright to test all scenarios:
   - Happy path for each affected feature
   - Edge cases (empty states, long text, special characters, boundary values)
   - Error scenarios (invalid input, unauthorized access)
   - Role-based access (test with ADMIN, ARZT, EMPFANG as appropriate)
   - Visual verification (screenshots at each step)
   - German locale (primary) + English locale
   - Console errors and network failures
3. Present the QA report to the user
4. Fix any FAILED items before declaring the work done

If the dev server is NOT running: inform the user that QA testing was skipped and recommend running `make dev` then `/qa` to test.

#### Phase 6: Report
Summarize what was done:
- What changed (files modified, features added/fixed)
- Verification results (TypeScript, lint, tests — all passing?)
- QA results (tested scenarios, any issues found and fixed)
- Anything the user should know or review manually

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

## Compaction Instructions

When compacting context, always preserve:
- The full list of modified files in this session
- Any failing test names and their error messages
- The current branch name and PR description
- Any open architectural decisions or pending QA issues
- Which phases of the automatic pipeline have been completed
- Key security context: patient PII uses encrypted_* columns only, zero-knowledge encryption files (crypto.ts, use-vault.ts) require security review

---

## Product Strategy (read before building new features)

**Target market**: 6,000+ dermatology practices in Germany (DACH region)
**Status**: Pre-launch. Zero paying customers. First revenue is the #1 priority.
**Pricing (Staged Gründerpreis — decided 2026-03-22)**:
- Launch (first 20 practices): Starter **EUR 49/mo** | Professional **EUR 99/mo** | Enterprise **EUR 199/mo**
- After 20 practices: EUR 79/mo | EUR 179/mo | EUR 399/mo
- After 50 practices: EUR 79/mo | EUR 199/mo | EUR 499/mo
- Founding members keep their price forever (grandfather clause)
- 30-day free trial, no credit card required

### The Moat (defend these — never dilute)
1. **Zero-knowledge encryption** — vendor cannot see patient data. 6-12 month architectural moat. No competitor has this.
2. **Dermatology specialization** — 6 treatment types, anatomical mapping, domain-specific workflows
3. **Consent-layer AI** — AI features that radiate from the consent event (explainer, no-show prediction, aftercare). Competitors can't add this without building consent infrastructure first.

### Strategic Decision Framework
Before any new feature, ask:
1. **Does this help get to first paying customer?** If not → defer
2. **Does this strengthen the moat?** If not → question priority
3. **Is there a simpler version?** Ship the 80/20 version first
4. **Are we building for real users or hypothetical ones?** No paying customers yet → don't build for scale

### Key Strategy Documents
- `@docs/AI-ROADMAP.md` — AI feature roadmap (6 of 9 shipped), competitive positioning, staged pricing strategy
- `@docs/LAUNCH-ANALYSIS-2026-03-14.md` — 360° launch analysis, competitive threats, go-to-market, revenue projections (counts updated 2026-03-22)
- `@docs/plan/README.md` — Phased execution plan — all phases 0-5 complete

### Competitors to Position Against
- **Nelly** (EUR 50M raised, 1200+ practices) — horizontal patient management, AI scribe. We win on: encryption, dermatology depth, consent specialization
- **Doctolib** — appointment + telehealth giant. We win on: consent workflow, privacy, vertical specialization
- **Idana** — digital anamnesis. We win on: consent lifecycle, zero-knowledge, billing integration

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
- **Domains**: `derma-consent.de` (frontend), `api.derma-consent.de` (backend)
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
- `/qa [page or feature]` — Run comprehensive E2E QA testing via Playwright (also runs automatically after code changes)

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

**Before building (Medium+ new features):**
- **strategic-advisor** — Checks strategic alignment, flags scope creep, scores features against launch/moat/revenue criteria. Runs automatically for new features
- **researcher** — Research technologies, libraries, competitors when approach is unclear
- **feature-planner** — Structured implementation plan for features touching 5+ files
- **api-designer** — Design REST API endpoints following existing NestJS patterns

**After building (automatic — part of the pipeline):**
- **code-hygienist** — Scan and remove dead code, orphaned files, stale translations (Medium+)
- **code-reviewer** — Review for security, encryption, and quality (Large changes, sensitive areas)
- **i18n-sync** — Check/sync translation keys across all 8 locales (when UI text added)
- **security-auditor** — Deep healthcare compliance audit (runs on Opus — encryption/auth/patient data changes)
- **qa-tester** — Senior QA engineer using Playwright — tests all scenarios, edge cases, roles, visual regressions, i18n (all UI/API changes)

**UI/UX:**
- **ui-designer** — Senior UI/UX designer agent (runs on Opus) — designs and builds polished interfaces from scratch

**On-demand:**
- **debugger** — Investigate bugs and failing tests
- **infra-advisor** — Debug deployment, Kubernetes, Terraform, and CI/CD issues
- **pre-deploy-check** — Full validation checklist before deploying/merging
