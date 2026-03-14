---
paths:
  - "packages/backend/prisma/schema.prisma"
---

# Prisma Schema Change Rules

When modifying the database schema:

1. **Was this planned?** Schema changes should come from an approved feature plan, not ad-hoc decisions.
2. Column names: use snake_case via `@@map`, model fields use camelCase
3. Patient PII fields MUST be named `encrypted_*` and use String/Bytes type
4. Add lookup hash fields (SHA-256) for any field that needs searchability without decryption
5. After changes, run: `make migrate && make generate`
6. Update seed script if new required fields are added: `packages/backend/prisma/seed.ts`
7. Run backend tests to verify: `make test-backend`
8. Consider: does the migration need to be reversible? Document in migration file.
