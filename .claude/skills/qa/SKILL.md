---
name: qa
description: Run comprehensive E2E QA testing on the current changes using Playwright. Tests all scenarios, edge cases, roles, and visual regressions like a senior QA team.
argument-hint: "[page or feature to test]"
---

# QA Testing

Run the `qa-tester` agent to perform comprehensive E2E QA testing.

## Pre-flight

1. Verify dev server is running:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "DOWN"
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "DOWN"
   ```

2. If servers are down, inform the user: "Dev servers must be running for QA. Run `make dev` first."

3. If an argument was provided, pass it to the QA agent as the focus area. Otherwise, detect what changed:
   ```bash
   git diff --name-only HEAD~1
   git diff --name-only
   ```

4. Launch the `qa-tester` agent with the change context.

5. After QA completes, present the report to the user. If there are FAILED items, list them clearly with reproduction steps.
