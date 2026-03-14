---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "**/__tests__/**"
  - "tests/**"
---

# Testing Rules

- Backend: Jest — spec files co-located alongside source (*.spec.ts)
- Frontend: Vitest — tests in src/lib/__tests__/*.test.ts
- Load testing: k6 scripts in tests/load/
- Run all: `make test` | Backend only: `make test-backend` | Frontend only: `make test-frontend`
- Single backend test: `cd packages/backend && npx jest --testPathPattern=<pattern>`
- Single frontend test: `cd packages/frontend && npx vitest run <file>`
- Backend jest.config mocks otplib and qrcode via moduleNameMapper
- Frontend vitest uses node environment (not jsdom) for Web Crypto API tests
- Coverage collected from src/**/*.ts excluding spec, module, and main files
