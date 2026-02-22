# Production Deployment Checklist

> Use this checklist before and after deploying DermaConsent to a production environment.

---

## Pre-Deployment

### Infrastructure

- [ ] PostgreSQL 16 instance provisioned (managed recommended: AWS RDS, Supabase, Railway)
- [ ] `DATABASE_URL` configured with SSL: `postgresql://user:pass@host:5432/dermaconsent?sslmode=require`
- [ ] Database has sufficient storage (recommend 10 GB+ initial, auto-scaling preferred)
- [ ] Database backups configured (daily, 30-day retention minimum)

### Security

- [ ] `AUTH_SECRET` set to a strong random value (min 32 chars): `openssl rand -base64 32`
- [ ] `FRONTEND_URL` set to production domain (e.g., `https://app.dermaconsent.de`)
- [ ] DNS A/CNAME records pointing to hosting provider
- [ ] SSL certificate provisioned (Let's Encrypt via Caddy, or provider-managed)
- [ ] All environment variables stored in a secrets manager (not in plain `.env` files on servers)

### File Storage (Supabase)

- [ ] Supabase project created
- [ ] Storage buckets created: `consent-pdfs`, `encrypted-photos`, `practice-assets`
- [ ] `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY` configured

### Payments (Stripe)

- [ ] Stripe account in **live mode**
- [ ] Live price IDs created:
  - Starter Monthly (`STRIPE_STARTER_MONTHLY_PRICE_ID`)
  - Starter Yearly (`STRIPE_STARTER_YEARLY_PRICE_ID`)
  - Professional Monthly (`STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID`)
  - Professional Yearly (`STRIPE_PROFESSIONAL_YEARLY_PRICE_ID`)
- [ ] `STRIPE_SECRET_KEY` (live key) configured
- [ ] Subscription webhook endpoint configured: `https://api.dermaconsent.de/api/billing/webhook`
  - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Consent payment webhook: `https://api.dermaconsent.de/api/stripe/webhook`
  - Event: `checkout.session.completed`
- [ ] `STRIPE_WEBHOOK_SECRET` and `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET` configured

### Email (Resend)

- [ ] Resend account created and sending domain verified (SPF, DKIM, DMARC)
- [ ] `RESEND_API_KEY` configured
- [ ] `RESEND_FROM_EMAIL` configured (e.g., `noreply@dermaconsent.de`)

### OAuth Providers

- [ ] **Google**: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` set; redirect URI added in Google Cloud Console: `https://app.dermaconsent.de/api/auth/callback/google`
- [ ] **Microsoft**: `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET` set; redirect URI added in Azure Portal: `https://app.dermaconsent.de/api/auth/callback/microsoft-entra-id`
- [ ] **Apple** (optional): `AUTH_APPLE_ID`, `AUTH_APPLE_SECRET` set; return URL: `https://app.dermaconsent.de/api/auth/callback/apple`

### Database Migration

- [ ] Run `prisma migrate deploy` against production database
- [ ] Verify migration status: `prisma migrate status`

---

## Deployment

```bash
# Build and start with production compose file
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations (if not done in entrypoint)
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

## Post-Deployment Verification

### Health Checks

- [ ] Backend health: `curl https://api.dermaconsent.de/api/health` returns `{"status":"ok"}`
- [ ] Backend readiness: `curl https://api.dermaconsent.de/api/health/ready` returns database OK
- [ ] Frontend loads at production URL without console errors

### Core Flows

- [ ] Registration flow works (email/password)
- [ ] Practice setup creates RSA keypair successfully
- [ ] Vault unlock/lock cycle works with master password
- [ ] Consent form creation generates valid public link
- [ ] Public consent form loads and submits correctly
- [ ] Client-side encryption works (verify encrypted data in DB)
- [ ] Consent decryption works after vault unlock

### Integrations

- [ ] Stripe checkout processes a test payment
- [ ] Stripe webhook updates subscription status
- [ ] Email delivery works for all templates (check spam folder)
- [ ] OAuth login works for each configured provider
- [ ] Supabase file upload/download works (PDFs, photos)

### Audit & Compliance

- [ ] Audit log captures events correctly
- [ ] HSTS header present on all responses
- [ ] CSP header present and not blocking functionality
- [ ] `X-Request-Id` header present on API responses

---

## Monitoring Setup

- [ ] Error monitoring configured (Sentry: set `SENTRY_DSN` env var)
- [ ] Uptime monitoring active (ping `/api/health` every 60s)
- [ ] Database backup schedule verified (daily, 30-day retention)
- [ ] Alert notifications configured (email/Slack for downtime, errors, failed payments)
- [ ] Log aggregation set up (stdout from containers)
- [ ] Disk usage alerts for database and file storage

---

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string with `?sslmode=require` |
| `AUTH_SECRET` | Yes | NextAuth secret (min 32 chars) |
| `FRONTEND_URL` | Yes | Production frontend URL |
| `NEXT_PUBLIC_API_URL` | Yes | Production backend API URL |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `STRIPE_SECRET_KEY` | No | Stripe live secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `RESEND_API_KEY` | No | Resend email API key |
| `RESEND_FROM_EMAIL` | No | Sender email address |
| `AUTH_GOOGLE_ID` | No | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth client secret |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | No | Microsoft OAuth app ID |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | No | Microsoft OAuth secret |
| `AUTH_APPLE_ID` | No | Apple Sign In service ID |
| `AUTH_APPLE_SECRET` | No | Apple Sign In key |
