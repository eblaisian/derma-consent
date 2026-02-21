# Development Overview

This section covers everything you need to contribute to Derma Consent.

## Project Structure

Derma Consent is a **pnpm monorepo** with two main packages:

| Package | Path | Technology |
|---------|------|------------|
| Frontend | `packages/frontend` | Next.js 16, React 19, TailwindCSS 4, shadcn/ui |
| Backend | `packages/backend` | NestJS 11, Prisma 6, PostgreSQL |
| Docs | `docs` | VitePress |

## Quick Reference

| Task | Command |
|------|---------|
| Start dev servers | `make dev` |
| Run all tests | `make test` |
| Run backend tests | `make test-backend` |
| Run frontend tests | `make test-frontend` |
| Lint | `pnpm lint` |
| Build | `make build` |
| Database migration | `make migrate` |
| Regenerate Prisma client | `make generate` |
| Seed test data | `make seed` |

## Sections

- [Local Setup](/development/setup) — get your development environment running
- [Backend (NestJS)](/development/backend) — module patterns, guards, decorators
- [Frontend (Next.js)](/development/frontend) — app router, auth, SWR, i18n
- [Database & Prisma](/development/database) — schema, migrations, conventions
- [Testing](/development/testing) — running and writing tests
- [Contributing](/development/contributing) — code style, PR process
