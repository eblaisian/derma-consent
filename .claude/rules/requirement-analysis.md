---
paths:
  - "packages/backend/src/**/*.ts"
  - "packages/frontend/src/**/*.ts"
  - "packages/frontend/src/**/*.tsx"
  - "packages/backend/prisma/**"
---

# Requirement Enrichment — Think Before You Build

Before implementing ANY user request, you must think like a senior product analyst. The user writes informal, quick prompts. Your job is to deliver what a product team would build, not a literal interpretation of the words.

## Strategic Alignment (for NEW features or significant changes)

Before building anything new, first check:
1. Read `docs/plan/README.md` — where does this fit in the execution plan?
2. Read `docs/AI-ROADMAP.md` — is this on the roadmap? What phase?
3. Score: Does this help get to first paying customer? Strengthen the moat? Justify pricing?
4. If this is a Medium+ new feature, run the `strategic-advisor` agent
5. If score is low, tell the user honestly: "This won't move the needle right now. Here's what I'd build instead..."

**Anti-patterns to flag:**
- Scope creep → suggest shipping the smallest useful version
- Building for scale before traction → hardcode it, add config later
- Growth features before product-market fit → focus on core consent workflow
- Copying competitors → double down on the moat (encryption, dermatology, consent AI)

## The Enrichment Process

For every request, silently run through this checklist and fill in the gaps:

### 1. Validation & Constraints
- What inputs exist? What are their types, min/max lengths, formats?
- Which fields are required vs optional?
- Are there uniqueness constraints? (e.g., email per practice)
- What values are invalid? How do we handle them?
- Server-side validation (class-validator DTOs) AND client-side (Zod schemas)

### 2. Error Handling
- What API errors can occur? (400, 401, 403, 404, 409, 500)
- What network failures are possible?
- How is each error displayed to the user? (inline, toast, full-page)
- Is there a recovery action? ("Try again", "Go back", "Contact support")
- Double-submit prevention? (disable button, debounce)

### 3. Permissions & Security
- Which roles can access this? (ADMIN, ARZT, EMPFANG, PLATFORM_ADMIN)
- What should unauthorized roles see? (hidden, disabled, or "no access" message)
- Does this touch patient data? → encrypted_* columns, zero-knowledge encryption
- Does the backend endpoint have proper guards? (JwtAuthGuard, RolesGuard)
- Is there an audit trail needed?

### 4. Data & State
- Where does the data come from? (API endpoint, local state, URL params)
- What's the loading state? (skeleton for content, spinner for actions)
- What's the empty state? (icon + message + CTA — never a blank page)
- What happens with 1 item? 100 items? 10,000 items? (pagination)
- Does the list need search, sort, or filter?
- Optimistic updates where appropriate?

### 5. User Experience
- What is the complete user flow? (entry point → action → feedback → next step)
- What feedback does the user get on success? (toast, redirect, inline)
- Is this action destructive? → confirmation dialog (AlertDialog)
- Is this action reversible? → consider undo
- What's the mobile experience? (375px)
- Are all interactive states covered? (hover, focus, active, disabled, loading)

### 6. Internationalization
- All user-facing strings → translation keys in all 8 locales
- Consider text length variation (German is ~30% longer than English)
- RTL support for Arabic locale?
- Date/number formatting per locale

### 7. Existing Patterns
- How do similar features work in this codebase?
- Is there an existing component/hook/pattern that does 80% of this?
- Follow the established patterns — don't invent new ones

## When to Show Your Work

- **Small changes**: Enrich silently, just build the complete version
- **Medium changes**: One sentence about what you're adding beyond the literal ask
- **Large changes**: Present enriched requirements for approval before building

## The "Stripe Test"

After enrichment, ask: **"If this were a Stripe or Linear feature, would they ship it with these requirements?"** If not — you missed something. Keep thinking.
