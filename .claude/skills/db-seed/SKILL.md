---
name: db-seed
description: Seed the database with test data
disable-model-invocation: true
---

Seed the derma-consent database with test data.

1. Verify database is running:
```bash
pg_isready -h localhost -p 5433
```

If not running:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && docker compose up -d
```

2. Run seed:
```bash
cd /Users/sohaibfaroukh/Work/personal/derma-consent && make seed
```

3. Confirm seeded accounts:

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | admin@dermaconsent.de | AdminTest1234! |
| Practice 1 Admin | admin@praxis-mueller.de | Test1234! |
| Practice 1 Doctor | dr.mueller@praxis-mueller.de | Test1234! |
| Practice 1 Reception | empfang@praxis-mueller.de | Test1234! |
| Practice 2 Admin | admin@hautklinik-schmidt.de | Test1234! |

Master password (vault unlock): Test1234!
