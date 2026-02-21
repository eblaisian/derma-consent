# Frontend (Next.js)

The frontend is a Next.js 16 app with App Router at `packages/frontend/`.

## Directory Structure

```
src/
├── app/
│   ├── (authenticated)/      # Protected routes
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── team/
│   │   ├── settings/
│   │   ├── billing/
│   │   ├── analytics/
│   │   └── audit/
│   ├── consent/[token]/      # Public: patient consent form
│   ├── invite/[token]/       # Public: team invite acceptance
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── [domain]/             # Feature components
├── hooks/
│   ├── use-vault.ts          # Client-side encryption vault
│   └── use-consent.ts        # Consent form logic
├── lib/
│   ├── auth.ts               # NextAuth 5 config
│   ├── auth-fetch.ts         # SWR authenticated fetch
│   └── crypto.ts             # Zero-knowledge encryption
├── i18n/
│   └── messages/             # de.json, en.json, es.json, fr.json
└── middleware.ts             # Route protection + locale
```

## Authentication

NextAuth 5 (beta) with multiple providers:

- **Google** — via `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- **Microsoft Entra** — via `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET` / `AZURE_AD_TENANT_ID`
- **Apple** — via `APPLE_ID` / `APPLE_SECRET`
- **Credentials** — email + password (always available)

On login, the frontend calls the backend auth endpoint and stores the returned JWT `accessToken` in the NextAuth session.

## Data Fetching

All API calls go through the authenticated fetch wrapper:

```typescript
import { authFetch } from '@/lib/auth-fetch';

// In a component with SWR
const { data } = useSWR('/api/patients', authFetch);
```

`authFetch` automatically:
- Attaches the JWT `Authorization: Bearer <token>` header
- Prepends `NEXT_PUBLIC_API_URL` to relative paths

## Forms

Forms use react-hook-form with Zod schemas:

```typescript
const schema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'ARZT', 'EMPFANG']),
});

const form = useForm({ resolver: zodResolver(schema) });
```

## Internationalization (i18n)

Using next-intl with 4 locales:

- `de` — German (default for German browsers)
- `en` — English
- `es` — Spanish
- `fr` — French

Locale is auto-detected from `Accept-Language` and stored in a cookie. Messages are in `src/i18n/messages/`.

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('dashboard');
  return <h1>{t('title')}</h1>;
}
```

## Route Protection

The middleware at `src/middleware.ts` protects routes under `(authenticated)/`. Unauthenticated users are redirected to `/login`. Public routes (`/consent/[token]`, `/invite/[token]`, `/login`, `/register`) are accessible without auth.

## UI Components

Built on [shadcn/ui](https://ui.shadcn.com/) with TailwindCSS 4. Base components live in `src/components/ui/`. Feature-specific components are organized by domain (patients, team, billing, etc.).
