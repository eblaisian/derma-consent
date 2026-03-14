---
name: test-frontend
description: Run frontend tests, optionally filtered by file
argument-hint: "[file]"
disable-model-invocation: true
---

Run frontend tests in the derma-consent project.

If $ARGUMENTS is provided, use it as a file filter:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/frontend && npx vitest run $ARGUMENTS
```

If no arguments provided, run all frontend tests:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/frontend && npx vitest run
```

After tests complete, summarize: total tests, passed, failed, and any failure details.
