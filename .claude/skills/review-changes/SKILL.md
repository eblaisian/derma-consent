---
name: review-changes
description: Review current uncommitted changes for issues
disable-model-invocation: true
---

Review all uncommitted changes in the derma-consent repo:

1. Get the diff of all changes:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && git diff && git diff --cached
```

2. Also check for untracked files:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && git status
```

3. Review the changes and check for:
   - Security issues (exposed secrets, SQL injection, XSS, missing auth guards)
   - Encryption concerns (patient PII must use encrypted_* columns, zero-knowledge pattern)
   - Missing error handling
   - TypeScript type issues
   - Broken imports or missing dependencies
   - Test coverage gaps for new functionality

4. Provide a concise review with:
   - **Issues found** (with file:line references)
   - **Suggestions** for improvement
   - **Overall assessment** — safe to commit or needs fixes
