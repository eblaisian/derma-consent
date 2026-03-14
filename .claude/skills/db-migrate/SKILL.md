---
name: db-migrate
description: Run Prisma migrations safely with validation
disable-model-invocation: true
---

Run database migrations for derma-consent safely:

1. First check the current migration status:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx prisma migrate status
```

2. Run the migration:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx prisma migrate dev
```

3. Regenerate the Prisma client:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx prisma generate
```

4. Run backend tests to verify nothing broke:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx jest --verbose
```

Report the outcome of each step. If any step fails, stop and explain the issue.
