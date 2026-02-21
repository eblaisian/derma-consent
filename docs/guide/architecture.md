# Architecture

Derma Consent is a pnpm monorepo with two main packages and a documentation site.

## High-Level Overview

```mermaid
graph TB
    Browser["Browser (Patient / Staff)"]
    FE["Frontend<br/>Next.js 16 · Port 3000"]
    BE["Backend<br/>NestJS 11 · Port 3001"]
    DB["PostgreSQL"]
    Stripe["Stripe Connect"]
    Email["Resend (Email)"]
    Storage["Supabase Storage<br/>(PDFs / Photos)"]

    Browser --> FE
    FE -->|REST API + JWT| BE
    BE --> DB
    BE --> Stripe
    BE --> Email
    BE --> Storage
    FE -->|Client-side encryption| Browser
```

## Package Structure

```
derma-consent/
├── packages/
│   ├── frontend/          # Next.js 16 (App Router, React 19)
│   └── backend/           # NestJS 11 (REST API)
├── docs/                  # VitePress documentation
├── docker-compose.yml     # PostgreSQL for local dev
├── Makefile               # Dev commands
└── pnpm-workspace.yaml    # Monorepo config
```

## Frontend Architecture

The frontend uses **Next.js App Router** with the following layout:

```
src/
├── app/
│   ├── (authenticated)/   # Protected routes (dashboard, settings, team, etc.)
│   ├── consent/[token]/   # Public consent form
│   ├── invite/[token]/    # Public team invite
│   ├── login/             # Login page
│   └── register/          # Registration page
├── components/
│   ├── ui/                # shadcn/ui primitives
│   └── [domain]/          # Feature components (patients, team, billing, etc.)
├── hooks/                 # Custom hooks (use-vault, use-consent, etc.)
├── lib/
│   ├── auth.ts            # NextAuth 5 config (Google, Microsoft, Apple, credentials)
│   ├── auth-fetch.ts      # SWR fetch wrapper with JWT
│   └── crypto.ts          # Zero-knowledge encryption (RSA + AES)
├── i18n/
│   └── messages/          # Locale files (de, en, es, fr)
└── middleware.ts          # Route protection + locale detection
```

**Key patterns:**
- **Auth:** NextAuth 5 (beta) stores a JWT `accessToken` from the backend in the session.
- **Data fetching:** SWR with an authenticated fetch wrapper that attaches the JWT.
- **Forms:** react-hook-form + Zod for validation.
- **i18n:** next-intl with browser locale detection, stored in a cookie.

## Backend Architecture

The backend follows standard **NestJS module conventions:**

```
src/
├── auth/           # JWT strategy, guards, roles decorator
├── consent/        # Consent form CRUD + public submission
├── patient/        # Encrypted patient records
├── practice/       # Practice management
├── team/           # Team invites and member management
├── billing/        # Stripe Connect integration
├── audit/          # Audit log queries + CSV export
├── analytics/      # Dashboard metrics
├── pdf/            # PDFKit consent form generation
├── email/          # Resend email service
├── settings/       # Practice settings (branding, consent config)
├── gdt/            # GDT format export (German medical data exchange)
├── photo/          # Treatment photo management
├── treatment-plan/ # Treatment plan CRUD
└── common/         # Shared guards, interceptors, decorators
```

Each module follows the pattern: `*.module.ts` → `*.controller.ts` → `*.service.ts` + DTOs validated with `class-validator`.

## Data Flow: Consent Form Submission

```mermaid
sequenceDiagram
    participant P as Patient Browser
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL

    P->>FE: Opens /consent/[token]
    FE->>BE: GET /api/consent/:token
    BE->>DB: Find consent form
    DB-->>BE: Consent form + practice public key
    BE-->>FE: Form data + RSA public key (JWK)

    P->>FE: Fills form + signs
    FE->>FE: Generate AES-256 session key
    FE->>FE: Encrypt responses with AES key
    FE->>FE: Wrap AES key with RSA public key
    FE->>BE: POST /api/consent/:token/submit (encrypted payload)
    BE->>DB: Store encrypted data
    BE-->>FE: Success
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant FE as Frontend (NextAuth)
    participant BE as Backend
    participant DB as PostgreSQL

    B->>FE: Login (credentials or OAuth)
    FE->>BE: POST /api/auth/login or /api/auth/sync
    BE->>DB: Validate credentials / upsert user
    DB-->>BE: User record
    BE-->>FE: JWT access token + user info
    FE->>FE: Store token in NextAuth session
    B->>FE: Subsequent requests
    FE->>BE: API call with Authorization: Bearer <token>
    BE->>BE: JWT guard validates token
    BE->>BE: Roles guard checks permissions
```
