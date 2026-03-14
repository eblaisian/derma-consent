---
name: db-reset
description: Reset database, run migrations, and re-seed
disable-model-invocation: true
---

Reset the derma-consent database to a clean state. This is destructive — confirm with the user first.

1. **Ask for confirmation** before proceeding — this drops all data.

2. Reset the database:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" npx prisma migrate reset --force
```

3. Re-seed with test data:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && make seed
```

4. Verify by checking migration status:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent/packages/backend && npx prisma migrate status
```

Report outcome and remind about test credentials.
