---
name: build
description: Run full production build for both packages
disable-model-invocation: true
---

Run a full production build to catch errors before deploy.

1. TypeScript check (both packages in parallel):
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx tsc --noEmit
```
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/frontend && npx tsc --noEmit
```

2. Backend build:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx nest build
```

3. Frontend build:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/frontend && npx next build
```

Report: pass/fail for each step, total build time, and any errors with file:line references.
