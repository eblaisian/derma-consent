# Phase 3 — Launch Readiness

> Final hardening, verification, and go-live.
> Begin after all Phase 2 tasks are complete.

---

## T-3.1 — Production Environment Setup

**Goal**: Set up and document the production deployment environment with all required services.

**Context**: The app runs locally with Docker Compose. Production requires a hosted PostgreSQL, Supabase project, Stripe live keys, DNS, and SSL certificates.

**Files to create**:
- `docs/self-hosted/production-checklist.md`

**Files to modify**:
- `docker-compose.prod.yml` — add resource limits and restart policies

**Steps**:

1. Update `docker-compose.prod.yml` with production-grade settings:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.5'
       restart: unless-stopped
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
         interval: 30s
         timeout: 10s
         retries: 3
         start_period: 40s

     frontend:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.5'
       restart: unless-stopped

     db:
       deploy:
         resources:
           limits:
             memory: 1G
             cpus: '1.0'
       restart: unless-stopped
   ```

2. Create `docs/self-hosted/production-checklist.md` with the following sections:

   **Pre-deployment checklist:**
   - [ ] PostgreSQL 16 instance provisioned (managed recommended: AWS RDS, Supabase, Railway)
   - [ ] `DATABASE_URL` configured with SSL (`?sslmode=require`)
   - [ ] `AUTH_SECRET` set to a strong random value (min 32 chars): `openssl rand -base64 32`
   - [ ] `FRONTEND_URL` set to production domain (e.g., `https://app.dermaconsent.de`)
   - [ ] Supabase project created with storage buckets: `consent-pdfs`, `encrypted-photos`, `practice-assets`
   - [ ] `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY` configured
   - [ ] Stripe account in live mode with webhook endpoints configured
   - [ ] `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` configured
   - [ ] Stripe price IDs created for Starter Monthly, Starter Yearly, Professional Monthly, Professional Yearly
   - [ ] Resend account verified with sending domain
   - [ ] `RESEND_API_KEY`, `RESEND_FROM_EMAIL` configured
   - [ ] OAuth providers configured (Google Cloud Console, Microsoft Entra, Apple Developer)
   - [ ] DNS A/CNAME records pointing to hosting provider
   - [ ] SSL certificate provisioned (Let's Encrypt via Caddy, or provider-managed)
   - [ ] Run `prisma migrate deploy` against production database
   - [ ] Verify health check: `curl https://api.dermaconsent.de/api/health`

   **Post-deployment verification:**
   - [ ] Frontend loads at production URL
   - [ ] Registration flow works
   - [ ] Practice setup creates keypair successfully
   - [ ] Consent form creation and public link work
   - [ ] Stripe checkout processes a test payment
   - [ ] Email delivery works (check spam folder)
   - [ ] OAuth login works for each configured provider
   - [ ] Audit log captures events

   **Monitoring setup:**
   - [ ] Error monitoring configured (Sentry: `SENTRY_DSN` env var)
   - [ ] Uptime monitoring active (ping `/api/health` every 60s)
   - [ ] Database backup schedule configured (daily, 30-day retention)
   - [ ] Alert notifications configured (email/Slack for downtime, errors)

**Acceptance Criteria**:
- [ ] `docker-compose.prod.yml` has resource limits and restart policies for all services
- [ ] `docs/self-hosted/production-checklist.md` exists with comprehensive checklist
- [ ] Checklist covers: infrastructure, services, security, verification, monitoring

**Dependencies**: T-0.1 (migrations), T-0.2 (health checks)

---

## T-3.2 — Load Testing

**Goal**: Verify the system handles 100 concurrent consent form submissions without degradation.

**Context**: Launch targets 10–50 practices. Each practice may have multiple patients submitting consent forms simultaneously. The system must handle peak load without timeouts or data corruption.

**Files to create**:
- `tests/load/consent-submit.js` (k6 or Artillery script)

**Steps**:

1. Create a load test script using k6 (install: `brew install k6`):
   ```javascript
   // tests/load/consent-submit.js
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export const options = {
     stages: [
       { duration: '30s', target: 50 },   // ramp up to 50 users
       { duration: '1m', target: 100 },   // peak at 100 concurrent
       { duration: '30s', target: 0 },    // ramp down
     ],
     thresholds: {
       http_req_duration: ['p(95)<2000'],  // 95th percentile < 2s
       http_req_failed: ['rate<0.01'],     // error rate < 1%
     },
   };

   const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

   export default function () {
     // Health check
     const health = http.get(`${BASE_URL}/api/health`);
     check(health, { 'health ok': (r) => r.status === 200 });

     // Get a consent form (simulate patient loading form)
     // Note: requires a valid token — create test tokens beforehand
     const token = __ENV.TEST_TOKEN || 'test-token';
     const consent = http.get(`${BASE_URL}/api/consent/${token}`);
     check(consent, { 'consent loaded': (r) => r.status === 200 || r.status === 404 });

     sleep(1);
   }
   ```

2. Document how to run:
   ```bash
   # Seed test data first
   make seed

   # Run load test against local
   k6 run tests/load/consent-submit.js

   # Run against production
   k6 run -e BASE_URL=https://api.dermaconsent.de tests/load/consent-submit.js
   ```

3. Add a `load-test` target to the Makefile:
   ```makefile
   load-test:
   	k6 run tests/load/consent-submit.js
   ```

**Acceptance Criteria**:
- [ ] Load test script exists and runs
- [ ] System handles 100 concurrent users with p95 response time < 2 seconds
- [ ] Error rate < 1% under load
- [ ] No database connection pool exhaustion
- [ ] Health endpoint remains responsive under load

**Dependencies**: T-0.2 (health checks), T-3.1 (environment)

---

## T-3.3 — OAuth Provider Production Testing

**Goal**: Verify all configured OAuth providers (Google, Microsoft Entra, Apple) work correctly in the production environment.

**Context**: OAuth redirect URIs, client IDs, and secrets are environment-specific. Each provider has unique configuration requirements that must be verified with live credentials.

**This is a manual testing task.** No code changes required.

**Steps**:

1. **Google OAuth**:
   - Verify `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set in production env
   - In Google Cloud Console: add production redirect URI `https://app.dermaconsent.de/api/auth/callback/google`
   - Test: click "Sign in with Google" on the production login page
   - Verify: user created in database, redirected to dashboard

2. **Microsoft Entra ID**:
   - Verify `AUTH_MICROSOFT_ENTRA_ID_ID` and `AUTH_MICROSOFT_ENTRA_ID_SECRET` are set
   - In Azure Portal > App Registrations: add redirect URI `https://app.dermaconsent.de/api/auth/callback/microsoft-entra-id`
   - Test: click "Sign in with Microsoft" on the production login page
   - Verify: user created, redirected to dashboard

3. **Apple**:
   - Verify `AUTH_APPLE_ID` and `AUTH_APPLE_SECRET` are set
   - In Apple Developer: configure return URL `https://app.dermaconsent.de/api/auth/callback/apple`
   - Test: click "Sign in with Apple" on the production login page
   - Verify: user created, redirected to dashboard

4. For each provider, also verify:
   - Existing users can sign in again (no duplicate accounts)
   - Session persists after browser refresh
   - Logout works correctly

**Acceptance Criteria**:
- [ ] Google login works in production
- [ ] Microsoft login works in production
- [ ] Apple login works in production (if configured)
- [ ] No duplicate user accounts on repeat logins
- [ ] Disabled providers show appropriate UI state

**Dependencies**: T-3.1 (production environment)

---

## T-3.4 — Stripe Production Testing

**Goal**: Verify Stripe checkout, webhook handling, and subscription management work in production with live keys.

**This is a manual testing task.** No code changes required.

**Steps**:

1. **Stripe Setup**:
   - Switch from test to live keys in production env
   - Create live price IDs for: Starter Monthly, Starter Yearly, Professional Monthly, Professional Yearly
   - Configure webhook endpoint: `https://api.dermaconsent.de/api/billing/webhook`
   - Configure webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Configure consent payment webhook: `https://api.dermaconsent.de/api/stripe/webhook`
   - Configure event: `checkout.session.completed`

2. **Test subscription flow**:
   - Register a new practice
   - Navigate to billing page
   - Select Starter plan > complete Stripe checkout with test card
   - Verify: subscription status changes to ACTIVE in database
   - Verify: billing portal link works

3. **Test consent payment flow** (if enabled):
   - Create a consent form
   - Submit the form as a patient
   - Complete payment
   - Verify: consent status changes to PAID then COMPLETED
   - Verify: PDF is generated and stored in Supabase

4. **Test failure scenarios**:
   - Use Stripe's declining test card to verify payment_failed webhook handling
   - Verify: subscription status changes to PAST_DUE
   - Verify: subscription guard blocks access for PAST_DUE status

**Acceptance Criteria**:
- [ ] Checkout flow completes with real payment method
- [ ] Webhook receives events and updates database
- [ ] Billing portal accessible for subscription management
- [ ] Consent payment > PDF generation pipeline works
- [ ] Failed payments trigger correct status updates

**Dependencies**: T-3.1 (production environment)

---

## T-3.5 — Email Delivery Production Testing

**Goal**: Verify all 4 email templates deliver correctly in production (consent link, team invite, welcome, subscription notice).

**This is a manual testing task.** No code changes required.

**Steps**:

1. **Welcome email**: Register a new user. Check inbox for welcome email. Verify: sender address, content, links work.

2. **Consent link email**: Create a consent form with a patient email. Verify: email received, link works, 7-day expiry mentioned.

3. **Team invite email**: Send a team invitation from the team page. Verify: email received, role displayed, invite link works.

4. **Subscription notice** (if testable): Trigger a trial expiring event or test with a short trial period. Verify: notification email received.

5. For all emails, check:
   - Not landing in spam folder
   - Sender domain authenticated (SPF, DKIM, DMARC)
   - Links use production URLs
   - Content renders correctly in Gmail, Outlook, Apple Mail

**Acceptance Criteria**:
- [ ] Welcome email delivered to inbox (not spam)
- [ ] Consent link email delivered with working link
- [ ] Team invite email delivered with correct role and link
- [ ] Sender domain passes email authentication checks
- [ ] All links point to production URLs

**Dependencies**: T-3.1 (production environment)

---

## T-3.6 — Smoke Test Full User Journey

**Goal**: Execute the complete end-to-end user journey in production to verify all systems work together.

**This is a manual testing task.** No code changes required.

**Steps**:

Execute this exact flow in production:

1. **Register**: Go to `/register`, create account with email/password
2. **Setup**: Complete practice setup (generates RSA keypair, sets master password)
3. **Dashboard**: Verify redirect to dashboard, see empty state / onboarding
4. **Unlock Vault**: Enter master password to unlock the vault
5. **Create Consent**: Click "New Consent", select BOTOX, enter patient email
6. **Copy Link**: Copy the generated consent link
7. **Patient Flow**: Open consent link in incognito/different browser
8. **Fill Form**: Complete the consent form (medical history, treatment areas)
9. **Sign**: Draw a signature on the signature pad
10. **Submit**: Submit the form (verify encryption happens client-side)
11. **Payment** (if configured): Complete Stripe checkout
12. **Back to Dashboard**: Verify consent status changed to SIGNED (or PAID/COMPLETED)
13. **Decrypt**: Click decrypt on the consent, verify data is readable
14. **Patient View**: Navigate to patients, verify patient was auto-created
15. **Patient Detail**: Click patient, verify consent appears in history
16. **Upload Photo**: Upload a before photo for the patient
17. **View Photo**: Verify encrypted photo can be viewed after vault unlock
18. **Audit Log**: Check audit page, verify all actions logged
19. **Analytics**: Check analytics page, verify metrics updated
20. **Team**: Invite a team member, verify email received
21. **Settings**: Change language, verify UI updates
22. **Logout + Login**: Log out, log back in, unlock vault, verify data persists

**Acceptance Criteria**:
- [ ] All 22 steps complete without errors
- [ ] Encryption/decryption works end-to-end
- [ ] Consent lifecycle completes: PENDING > SIGNED > (PAID) > COMPLETED
- [ ] Audit trail captures all actions
- [ ] No console errors in browser developer tools
- [ ] Response times are acceptable (< 2s for all page loads)

**Dependencies**: T-3.1, T-3.3, T-3.4, T-3.5
