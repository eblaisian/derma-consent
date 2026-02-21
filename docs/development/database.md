# Database & Prisma

Derma Consent uses **Prisma 6** as the ORM with **PostgreSQL**.

## Schema Location

The Prisma schema is at `packages/backend/prisma/schema.prisma`.

## Naming Conventions

- **Prisma models** use PascalCase: `ConsentForm`, `TreatmentPlan`
- **Database columns** use snake_case via `@@map` / `@map` directives
- **Enums** use SCREAMING_SNAKE_CASE: `CONSENT_CREATED`, `FREE_TRIAL`

## Key Models

| Model | Description |
|-------|-------------|
| `Practice` | Organization entity with encryption keys and Stripe Connect ID |
| `User` | Team member with role (ADMIN, ARZT, EMPFANG) |
| `Patient` | Encrypted PII with lookup hash for deduplication |
| `ConsentForm` | Consent document with type, status, token, encrypted responses |
| `Subscription` | Stripe subscription (plan, status, trial dates) |
| `AuditLog` | Compliance logging (action, entity, IP, metadata) |
| `PracticeSettings` | Branding, logo, consent config |
| `TreatmentPlan` | Treatment records with encrypted data |
| `TreatmentPhoto` | Before/after photos with encrypted metadata |
| `TreatmentTemplate` | Reusable treatment templates |
| `Account` | OAuth account storage |
| `Invite` | Team member invitations |

## Encrypted Fields

Patient data is stored in `encrypted_*` columns:

- `encrypted_first_name`
- `encrypted_last_name`
- `encrypted_date_of_birth`
- `encrypted_email`

These columns contain ciphertext — the server never sees plaintext values. A `lookup_hash` (SHA-256) enables deduplication without decryption.

## Common Commands

```bash
# Push schema changes to the database (dev)
make migrate
# or: cd packages/backend && npx prisma db push

# Regenerate Prisma client after schema changes
make generate
# or: cd packages/backend && npx prisma generate

# Open Prisma Studio (visual database browser)
cd packages/backend && npx prisma studio

# Seed test data
make seed
# or: cd packages/backend && npx tsx prisma/seed.ts
```

## Making Schema Changes

1. Edit `packages/backend/prisma/schema.prisma`
2. Run `make migrate` to push changes to the database
3. Run `make generate` to regenerate the Prisma client
4. Update any affected DTOs, services, or controllers

::: warning
`prisma db push` is used for development. For production, consider using `prisma migrate` for versioned migrations.
:::

## Enums

### UserRole
| Value | Description |
|-------|-------------|
| `ADMIN` | Practice owner/administrator |
| `ARZT` | Doctor/physician |
| `EMPFANG` | Reception/administrative staff |

### ConsentType
`BOTOX`, `FILLER`, `LASER`, `CHEMICAL_PEEL`, `MICRONEEDLING`, `PRP`

### ConsentStatus
`PENDING`, `FILLED`, `SIGNED`, `PAID`, `COMPLETED`, `EXPIRED`, `REVOKED`

### SubscriptionPlan
`FREE_TRIAL`, `STARTER`, `PROFESSIONAL`, `ENTERPRISE`

### SubscriptionStatus
`TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, `EXPIRED`
