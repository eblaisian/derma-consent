---
paths:
  - "packages/frontend/**/*.ts"
  - "packages/frontend/**/*.tsx"
---

# Frontend Rules

- Next.js App Router only (no pages directory)
- Protected routes in src/app/(authenticated)/, guarded by middleware.ts
- Platform admin routes in src/app/(platform-admin)/admin/
- Public routes: /consent/[token], /invite/[token], /login, /register
- Auth: NextAuth 5 with JWT accessToken from backend stored in session
- Data fetching: SWR with auth-fetch wrapper (src/lib/auth-fetch.ts)
- Forms: react-hook-form + Zod validation schemas
- i18n: next-intl with 8 locales — always add translation keys to all locale files
- UI components: shadcn/ui in src/components/ui/, feature components by domain
