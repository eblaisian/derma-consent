# Test Credentials

All seed data is created by `npx tsx prisma/seed.ts` (or `make seed`).

## Master Password (Vault)

All practices use the same master password for the zero-knowledge vault:

```
Test1234!
```

## User Accounts

All accounts use password: **`Test1234!`**

### Practice 1 — Dermatologie Praxis Dr. Mueller (Berlin)

| Email | Role | Description |
|-------|------|-------------|
| `admin@praxis-mueller.de` | ADMIN | Practice administrator |
| `dr.mueller@praxis-mueller.de` | ARZT | Treating physician |
| `empfang@praxis-mueller.de` | EMPFANG | Front desk / reception |

- Subscription: **PROFESSIONAL** (active)
- Practice ID: `seed-practice-001`
- 6 patients, 12 consent forms, 5 treatment plans, 8 photos

### Practice 2 — Hautklinik Dr. Schmidt (Munich)

| Email | Role | Description |
|-------|------|-------------|
| `admin@hautklinik-schmidt.de` | ADMIN | Practice administrator |
| `dr.schmidt@hautklinik-schmidt.de` | ARZT | Treating physician |
| `empfang@hautklinik-schmidt.de` | EMPFANG | Front desk / reception |

- Subscription: **STARTER** (active)
- Practice ID: `seed-practice-002`
- 4 patients, 8 consent forms, 3 treatment plans, 4 photos

## Patients

### Practice 1

| Name | DOB | Email |
|------|-----|-------|
| Anna Weber | 1985-03-15 | anna.weber@example.de |
| Thomas Fischer | 1978-11-22 | thomas.fischer@example.de |
| Maria Hoffmann | 1990-07-08 | maria.hoffmann@example.de |
| Stefan Becker | 1972-01-30 | stefan.becker@example.de |
| Julia Schulz | 1995-09-12 | julia.schulz@example.de |
| Klaus Richter | 1968-05-25 | klaus.richter@example.de |

### Practice 2

| Name | DOB | Email |
|------|-----|-------|
| Sabine Klein | 1982-04-18 | sabine.klein@example.de |
| Michael Wolf | 1975-12-03 | michael.wolf@example.de |
| Laura Braun | 1993-06-27 | laura.braun@example.de |
| Peter Neumann | 1960-08-14 | peter.neumann@example.de |

> Patient data is encrypted — names, DOBs, and emails only visible after unlocking the vault.

## Consent Form Tokens

Pending consent forms can be opened in a browser to test the patient flow:

| Token | Type | Practice |
|-------|------|----------|
| `seed-token-m09-filler` | FILLER | Dr. Mueller |
| `seed-token-m10-laser` | LASER | Dr. Mueller |
| `seed-token-m11-botox` | BOTOX | Dr. Mueller |
| `seed-token-s05-botox` | BOTOX | Dr. Schmidt |
| `seed-token-s07-peel` | CHEMICAL_PEEL | Dr. Schmidt |

Open at: `http://localhost:3000/consent/<token>`

## Testing Guide

### 1. Run the seed

```bash
make seed
# or: cd packages/backend && npx tsx prisma/seed.ts
```

### 2. Start the app

```bash
make dev
```

### 3. Login

Go to http://localhost:3000/login and use any account above with password `Test1234!`.

### 4. Unlock the vault

Navigate to the vault / patients section and enter master password `Test1234!` to decrypt patient data.

### 5. Test the patient consent flow

Open one of the pending consent links above in an incognito window to simulate a patient filling out and signing a consent form.

### 6. Verify data across roles

- **ADMIN**: Can manage team, settings, billing, view audit logs
- **ARZT**: Can view patients, consent forms, create treatment plans
- **EMPFANG**: Can create consent forms, view patient list

## Consent Form Status Distribution

| Status | Count |
|--------|-------|
| PENDING | 5 |
| SIGNED | 3 |
| COMPLETED | 7 |
| REVOKED | 2 |
| EXPIRED | 3 |

## Re-seeding

Running `make seed` again is safe — it deletes all data for the two seed practices before recreating everything. Non-seed data is unaffected.
