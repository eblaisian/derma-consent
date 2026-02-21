# DermaConsent — Execution Plan

> Source of truth for production launch execution. Each task is written as an AI-agent-executable specification.
> Created: 2026-02-21 | Target launch: 2026-03-21

---

## How to Use This Plan

Each phase contains numbered tasks with unique IDs (e.g., `T-0.1`). Each task includes:

- **Goal**: What to achieve (1 sentence)
- **Context**: Why this matters
- **Files**: Exact paths to create or modify
- **Steps**: Ordered implementation instructions
- **Acceptance Criteria**: How to verify completion
- **Dependencies**: Which tasks must complete first

**AI agents should execute tasks in ID order within each phase.** Cross-phase dependencies are explicitly noted.

---

## Progress Tracker

### Phase 0 — Infrastructure Blockers (Week 1)
> Must resolve before any production deployment.

| ID | Task | Status | Owner |
|----|------|--------|-------|
| T-0.1 | Versioned database migrations | `pending` | — |
| T-0.2 | Health check endpoints | `pending` | — |
| T-0.3 | Global exception filter + structured logging | `pending` | — |
| T-0.4 | HSTS header | `pending` | — |
| T-0.5 | Content Security Policy header | `pending` | — |
| T-0.6 | Fix CI/CD: tests before deploy | `pending` | — |
| T-0.7 | Non-root user in backend Dockerfile | `pending` | — |
| T-0.8 | Add LICENSE file | `pending` | — |
| T-0.9 | Pagination limit enforcement | `pending` | — |

### Phase 1 — Stability & Testing (Week 2)
> Production confidence through tests, error handling, and monitoring.

| ID | Task | Status | Owner |
|----|------|--------|-------|
| T-1.1 | Backend auth tests | `pending` | — |
| T-1.2 | Backend consent tests | `pending` | — |
| T-1.3 | Backend patient tests | `pending` | — |
| T-1.4 | Backend billing tests | `pending` | — |
| T-1.5 | Frontend component tests | `pending` | — |
| T-1.6 | React Error Boundaries | `pending` | — |
| T-1.7 | Session expiry handling | `pending` | — |
| T-1.8 | Custom 404 and error pages | `pending` | — |

### Phase 2 — Feature Polish (Week 3)
> Complete partially-implemented features and add must-have UX.

| ID | Task | Status | Owner |
|----|------|--------|-------|
| T-2.1 | Practice info editable in settings | `pending` | — |
| T-2.2 | Brand color on consent forms | `pending` | — |
| T-2.3 | Manual patient creation | `pending` | — |
| T-2.4 | Enabled consent types in settings UI | `pending` | — |
| T-2.5 | Enterprise contact button | `pending` | — |
| T-2.6 | Revenue analytics with Stripe amounts | `pending` | — |
| T-2.7 | Landing page | `pending` | — |
| T-2.8 | Onboarding flow | `pending` | — |

### Phase 3 — Launch Readiness (Week 4)
> Final hardening, verification, and go-live.

| ID | Task | Status | Owner |
|----|------|--------|-------|
| T-3.1 | Production environment setup | `pending` | — |
| T-3.2 | Load testing | `pending` | — |
| T-3.3 | OAuth provider production testing | `pending` | — |
| T-3.4 | Stripe production testing | `pending` | — |
| T-3.5 | Email delivery production testing | `pending` | — |
| T-3.6 | Smoke test full user journey | `pending` | — |

### Phase 4 — Post-Launch Enhancements
> Nice-to-have features for competitive advantage.

| ID | Task | Status | Owner |
|----|------|--------|-------|
| T-4.1 | Two-factor authentication (2FA) | `pending` | — |
| T-4.2 | Dark mode | `superseded by T-5.10` | — |
| T-4.3 | Additional languages (TR, AR, RU, PL) | `pending` | — |
| T-4.4 | SMS/WhatsApp consent delivery | `pending` | — |
| T-4.5 | Patient comprehension verification | `pending` | — |
| T-4.6 | Video patient education embeds | `pending` | — |

### Phase 5 — UI/UX Redesign (Parallel with Phases 0–2)
> Transform the visual identity from default shadcn/ui to a premium, branded design.
> Reference: `docs/DESIGN_SYSTEM.md` (1541-line specification).
> No backend changes required. Can execute in parallel with other phases.

| ID | Task | Status | Owner |
|----|------|--------|-------|
| T-5.1 | Design token foundation (globals.css) | `pending` | — |
| T-5.2 | Sidebar redesign | `pending` | — |
| T-5.3 | Status badge system | `pending` | — |
| T-5.4 | Card system upgrade (stat cards) | `pending` | — |
| T-5.5 | Table system upgrade | `pending` | — |
| T-5.6 | Consent form (patient-facing) redesign | `pending` | — |
| T-5.7 | Empty states & loading skeletons | `pending` | — |
| T-5.8 | Trust & security visual language | `pending` | — |
| T-5.9 | Animation & micro-interactions | `pending` | — |
| T-5.10 | Dark mode implementation | `pending` | — |
| T-5.11 | Dashboard page redesign | `pending` | — |
| T-5.12 | Icon consistency & Lucide config | `pending` | — |
| T-5.13 | Typography & spacing audit | `pending` | — |

---

## Architecture Reference

```
packages/backend/src/     — NestJS 11, Prisma 6, PostgreSQL
packages/frontend/src/    — Next.js 16, React 19, NextAuth 5, TailwindCSS 4
```

**Design system**: See `docs/DESIGN_SYSTEM.md` for comprehensive visual specifications (colors, typography, spacing, components, animations).

**Key patterns**: See `docs/plan/phase-*.md` files for exact import paths, naming conventions, and code patterns per task.

**Test commands**:
```bash
cd packages/backend && npx jest                    # Backend tests
cd packages/frontend && npx vitest run             # Frontend tests
cd packages/backend && npx jest --testPathPattern=<pattern>  # Single backend test
```

**Dev commands**:
```bash
make dev       # Start everything
make migrate   # Push schema changes
make generate  # Regenerate Prisma client
```
