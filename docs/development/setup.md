# Local Setup

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org))
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker** ([download](https://docker.com)) — for PostgreSQL

## First-Time Setup

```bash
git clone https://github.com/your-org/derma-consent.git
cd derma-consent
make dev
```

`make dev` is an all-in-one command that runs `make setup` (install, DB, migrations) and starts both dev servers.

## What `make setup` Does

1. Creates `.env` from `.env.example` if it doesn't exist
2. Runs `pnpm install --recursive`
3. Starts PostgreSQL via `docker compose up -d`
4. Pushes the Prisma schema to the database (`prisma db push`)
5. Generates the Prisma client (`prisma generate`)

## Makefile Targets

| Target | Description |
|--------|-------------|
| `make dev` | Full setup + start dev servers |
| `make setup` | Install deps, start DB, run migrations |
| `make db` | Start PostgreSQL only |
| `make db-stop` | Stop PostgreSQL |
| `make migrate` | Push Prisma schema to DB |
| `make generate` | Regenerate Prisma client |
| `make seed` | Seed DB with test data |
| `make test` | Run all tests |
| `make test-backend` | Run backend tests (Jest) |
| `make test-frontend` | Run frontend tests (Vitest) |
| `make build` | Production build |
| `make clean` | Remove node_modules, dist, .next, Docker volumes |
| `make kill-ports` | Free ports 3000 and 3001 |
| `make docs` | Start documentation dev server |

## Running Individual Packages

```bash
# Backend only
pnpm --filter @derma-consent/backend dev

# Frontend only
pnpm --filter @derma-consent/frontend dev
```

## Ports

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend | 3001 |
| PostgreSQL | 5433 (mapped from Docker) |

## Seed Data

After running `make seed`, you get two test practices with users, patients, and consent forms. All passwords are `Test1234!`. See `docs/TEST-CREDENTIALS.md` for the full list.
