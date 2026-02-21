# Environment Variables

Complete reference for all environment variables used by Derma Consent.

## Required

| Variable | Package | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Backend | PostgreSQL connection string. Example: `postgresql://derma:password@localhost:5433/dermaconsent` |
| `AUTH_SECRET` | Backend | Secret for signing JWT tokens. Use a random 64+ character string. |
| `FRONTEND_URL` | Backend | Public URL of the frontend. Used for CORS and email links. Example: `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Frontend | Public URL of the backend API. Example: `http://localhost:3001` |

## Backend Server

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `3001` | Port the NestJS server listens on |

## Stripe (Billing)

Leave empty to disable billing features.

| Variable | Package | Description |
|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | Backend | Stripe secret API key (`sk_...`) |
| `STRIPE_WEBHOOK_SECRET` | Backend | Webhook signing secret (`whsec_...`) |
| `STRIPE_PLATFORM_FEE_PERCENT` | Backend | Platform fee for Connect payments (default: `5`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Frontend | Stripe publishable key (`pk_...`) |

## Email (Resend)

| Variable | Package | Description |
|----------|---------|-------------|
| `RESEND_API_KEY` | Backend | API key from [resend.com](https://resend.com). Required for sending consent links and team invites. |

## File Storage (Supabase)

| Variable | Package | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend | Supabase service role key (full access) |
| `SUPABASE_ANON_KEY` | Backend | Supabase anonymous key |

## OAuth Providers

Providers auto-register when their environment variables are set. All are optional — credentials login is always available.

### Google

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Microsoft Entra (Azure AD)

| Variable | Description |
|----------|-------------|
| `AZURE_AD_CLIENT_ID` | Microsoft Entra application ID |
| `AZURE_AD_CLIENT_SECRET` | Microsoft Entra client secret |
| `AZURE_AD_TENANT_ID` | Microsoft Entra tenant ID |

### Apple

| Variable | Description |
|----------|-------------|
| `APPLE_ID` | Apple Services ID |
| `APPLE_SECRET` | Apple client secret |

## Local Development Defaults

The `.env.example` file provides working defaults for local development:

```bash
DATABASE_URL=postgresql://derma:derma_local_pwd@localhost:5433/dermaconsent
AUTH_SECRET=dev-secret-change-in-production
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
BACKEND_PORT=3001
```
