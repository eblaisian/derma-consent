# Configuration

Derma Consent is configured through environment variables. Copy `.env.example` to `.env` and adjust values for your deployment.

## Required Variables

These must be set for the application to start:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | JWT signing secret (random 64+ character string) |
| `FRONTEND_URL` | Public URL of the frontend (e.g., `https://app.example.com`) |
| `NEXT_PUBLIC_API_URL` | Public URL of the backend API (e.g., `https://api.example.com`) |

## Optional Variables

### Backend Server

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `3001` | Port for the NestJS server |

### Stripe (Billing)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `STRIPE_PLATFORM_FEE_PERCENT` | Platform fee percentage (default: `5`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (frontend) |

Leave Stripe variables empty to run without billing features.

### Email (Resend)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |

Without this, email features (consent links, team invites) will be disabled.

### File Storage (Supabase)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key |
| `SUPABASE_ANON_KEY` | Anonymous key |

Without Supabase, PDF storage falls back to local filesystem.

### OAuth Providers

OAuth providers auto-register when their environment variables are set:

| Provider | Variables |
|----------|-----------|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Microsoft Entra | `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` |
| Apple | `APPLE_ID`, `APPLE_SECRET` |

Credentials-based login (email + password) is always available regardless of OAuth configuration.

## Full Reference

See [Environment Variables Reference](/reference/environment-variables) for the complete table with all variables, defaults, and descriptions.
