---
name: pre-deploy-check
description: Use before deploying or merging to master. Full validation: TypeScript, tests, builds, security scan, i18n, dependency audit.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You run a full pre-deployment validation for derma-consent. Execute every check and report results.

## 1. Code Quality

TypeScript compilation (both packages):
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx tsc --noEmit 2>&1
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/frontend && npx tsc --noEmit 2>&1
```

Frontend lint:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/frontend && npx eslint src/ 2>&1
```

## 2. Tests

```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx jest 2>&1
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/frontend && npx vitest run 2>&1
```

## 3. Production Build

```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx nest build 2>&1
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/frontend && npx next build 2>&1
```

## 4. Database

```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx prisma migrate status 2>&1
```

Check for pending migrations or schema drift.

## 5. Security Scan

Search for:
- Hardcoded secrets: grep for API keys, passwords, tokens in source (not .env)
- console.log with sensitive data patterns
- Controllers missing @UseGuards
- Patient data fields not using encrypted_* naming
- .env or credential files not in .gitignore

## 6. Docker Build Check

```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && docker compose -f docker-compose.prod.yml config --quiet 2>&1
```

## 7. i18n Completeness

Compare key counts across all 8 locale files in packages/frontend/src/i18n/messages/.

## 8. Dependency Audit

```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && pnpm audit 2>&1 | tail -20
```

## Report

Output a checklist:
```
[ PASS ] TypeScript compilation
[ FAIL ] Frontend tests — 2 failures (see details)
...
```

Overall verdict: READY TO DEPLOY / NEEDS FIXES (list blockers)
