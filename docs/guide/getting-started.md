# Getting Started

Get Derma Consent running locally in 5 commands.

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Docker** (for PostgreSQL)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/derma-consent.git
cd derma-consent

# 2. Start everything (installs deps, starts DB, runs migrations, launches dev servers)
make dev
```

That's it. The `make dev` command handles the full setup:

1. Copies `.env.example` to `.env` if missing
2. Runs `pnpm install`
3. Starts PostgreSQL via Docker Compose
4. Pushes the Prisma schema to the database
5. Generates the Prisma client
6. Starts the backend (port 3001) and frontend (port 3000) concurrently

## Seed Test Data

To populate the database with sample practices, users, patients, and consent forms:

```bash
make seed
```

This creates two practices with users across all three roles. All accounts use password `Test1234!`. See [Test Credentials](https://github.com/your-org/derma-consent/blob/main/docs/TEST-CREDENTIALS.md) for the full list.

## Open the App

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

Log in with any seeded account (e.g. `admin@praxis-mueller.de` / `Test1234!`), then unlock the vault with master password `Test1234!` to view decrypted patient data.

## Useful Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start everything |
| `make seed` | Seed test data |
| `make test` | Run all tests |
| `make build` | Production build |
| `make clean` | Remove build artifacts and Docker volumes |
| `pnpm lint` | Lint all packages |

See the [Makefile reference](/development/setup#makefile-targets) for the full list.
