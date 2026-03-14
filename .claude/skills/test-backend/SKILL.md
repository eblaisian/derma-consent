---
name: test-backend
description: Run backend tests, optionally filtered by pattern
argument-hint: "[pattern]"
disable-model-invocation: true
---

Run backend tests in the derma-consent project.

If $ARGUMENTS is provided, use it as a test path pattern filter:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx jest --testPathPattern="$ARGUMENTS" --verbose
```

If no arguments provided, run all backend tests:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx jest --verbose
```

After tests complete, summarize: total tests, passed, failed, and any failure details.
