---
paths:
  - "packages/backend/src/**/*.ts"
  - "packages/frontend/src/**/*.ts"
  - "packages/frontend/src/**/*.tsx"
---

# Automatic Team Pipeline — Mandatory Checklist

You are the full engineering team. Every step below is mandatory and automatic — never ask the user "should I do X?" Just do it.

## Before Writing Code

### Requirement Enrichment (ALWAYS — the user writes quick prompts, you deliver product-ready output)
1. **What did the user NOT say?** Fill in: validation, error handling, edge cases, loading/empty/error states, permissions, i18n, mobile, accessibility
2. **What would Stripe/Linear build?** Not a literal implementation of the words — a complete product feature
3. **For destructive actions**: confirmation dialog, audit trail, role restrictions
4. **For lists**: pagination, search/filter, empty state, loading skeleton
5. **For forms**: validation (client + server), error messages, loading state on submit, success feedback, double-submit prevention

### Then:
1. **Read the full file.** Never edit a file you haven't read completely.
2. **Search for existing patterns.** Check if similar functionality exists. Follow the same patterns.
3. **Assess size.** If touching 5+ files, encryption, auth, billing, or data models → this is Large. Use `feature-planner` agent and get user approval first.

## After Writing Code (run ALL of these automatically)

### Verify (always)
- [ ] `npx tsc --noEmit` in affected package(s) — fix all errors
- [ ] Run relevant unit tests — fix all failures
- [ ] `pnpm lint` — fix all warnings

### Review (Medium+ changes)
- [ ] Run `code-hygienist` agent — remove dead code, unused imports, orphaned files
- [ ] If Large: run `code-reviewer` agent
- [ ] If encryption/auth/patient data touched: run `security-auditor` agent
- [ ] If UI text added: run `i18n-sync` agent

### UI Polish (all .tsx changes — pages, components, layouts)
- [ ] Navigate to affected page via Playwright, take screenshot
- [ ] Compare against `.claude/ui-references/` for consistency
- [ ] Check: hierarchy, spacing (8px grid), interactive states (hover/focus/active/disabled), component states (loading/empty/error)
- [ ] Fix any visual issues, re-screenshot until polished
- [ ] Resize to 375px mobile, verify layout, fix if broken
- [ ] Pass the "would a designer pay for this?" test
- [ ] If dev server not running: note visual verification was skipped

### QA Test (all UI changes, all API changes)
- [ ] Check if dev server is running at localhost:3000
- [ ] If running: launch `qa-tester` agent with description of changes
- [ ] QA agent tests: happy path, edge cases, error scenarios, role-based access, visual verification, i18n
- [ ] Fix any FAILED scenarios before declaring done
- [ ] If dev server not running: inform user, recommend `make dev` then `/qa`

### Report
- [ ] Summarize: what changed, verification results, QA results
- [ ] Flag anything requiring manual user review
