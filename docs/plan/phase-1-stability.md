# Phase 1 — Stability & Testing

> Production confidence through tests, error handling, and monitoring.
> Begin after all Phase 0 tasks are complete.

---

## T-1.1 — Backend Auth Module Tests

**Goal**: Write Jest tests for the auth module covering registration, login, JWT validation, and role-based access.

**Context**: The auth module has zero tests. It handles user registration (bcrypt), login (JWT issuance), and OAuth sync — all critical paths that must not break.

**Files to create**:
- `packages/backend/src/auth/auth.service.spec.ts`

**Files to reference** (read, do not modify):
- `packages/backend/src/auth/auth.service.ts` — service under test
- `packages/backend/src/auth/auth.controller.ts` — endpoints
- `packages/backend/src/auth/auth.dto.ts` — DTOs
- `packages/backend/src/gdt/gdt.service.spec.ts` — test pattern reference

**Steps**:

1. Create `packages/backend/src/auth/auth.service.spec.ts` with the following test structure:
   ```typescript
   import { Test, TestingModule } from '@nestjs/testing';
   import { AuthService } from './auth.service';
   import { PrismaService } from '../prisma/prisma.service';
   import { JwtService } from '@nestjs/jwt';
   import { ConflictException, UnauthorizedException } from '@nestjs/common';
   ```

2. Mock `PrismaService` and `JwtService`:
   ```typescript
   const mockPrisma = {
     user: { findUnique: jest.fn(), create: jest.fn(), upsert: jest.fn() },
     account: { upsert: jest.fn() },
   };
   const mockJwt = { sign: jest.fn().mockReturnValue('mock-jwt-token') };
   ```

3. Write these test cases:
   - `register()` — creates user with hashed password (verify password is NOT stored in plain text)
   - `register()` — throws `ConflictException` if email already exists
   - `loginWithCredentials()` — returns JWT token for valid credentials
   - `loginWithCredentials()` — throws `UnauthorizedException` for wrong password
   - `loginWithCredentials()` — throws `UnauthorizedException` for non-existent email
   - `syncUser()` — creates user and account for new OAuth user
   - `syncUser()` — returns existing user for already-synced OAuth user

4. For password hashing verification, use:
   ```typescript
   import * as bcrypt from 'bcrypt';
   // In test: verify hashed password
   const isMatch = await bcrypt.compare('plaintext', result.hashedPassword);
   expect(isMatch).toBe(true);
   ```

**Acceptance Criteria**:
- [ ] At least 7 test cases pass
- [ ] Tests cover: register success, register duplicate, login success, login wrong password, login missing user, OAuth sync new, OAuth sync existing
- [ ] `cd packages/backend && npx jest --testPathPattern=auth` passes
- [ ] No database required (all Prisma calls mocked)

**Dependencies**: None

---

## T-1.2 — Backend Consent Module Tests

**Goal**: Write Jest tests for the consent module covering creation, submission, revocation, and expiry logic.

**Context**: Consent is the core business flow. Zero tests exist. The lifecycle (PENDING > SIGNED > PAID > COMPLETED) and revocation (GDPR Art. 7) must be verified.

**Files to create**:
- `packages/backend/src/consent/consent.service.spec.ts`

**Files to reference**:
- `packages/backend/src/consent/consent.service.ts`
- `packages/backend/src/consent/consent.dto.ts`

**Steps**:

1. Create `packages/backend/src/consent/consent.service.spec.ts`.

2. Mock `PrismaService` and `AuditService`:
   ```typescript
   const mockPrisma = {
     consentForm: {
       create: jest.fn(),
       findUnique: jest.fn(),
       findMany: jest.fn(),
       update: jest.fn(),
       count: jest.fn(),
     },
   };
   const mockAudit = { log: jest.fn() };
   ```

3. Write these test cases:
   - `create()` — creates consent with PENDING status, token, and 7-day expiry
   - `create()` — generates a unique token (UUID format)
   - `findByToken()` — returns consent for valid, non-expired token
   - `findByToken()` — throws `NotFoundException` for non-existent token
   - `findByToken()` — throws `BadRequestException` for expired token
   - `submit()` — updates status to SIGNED and stores encrypted responses
   - `submit()` — stores signature data, IP address, and timestamp
   - `revoke()` — updates status to REVOKED
   - `revoke()` — logs audit event for GDPR compliance

4. For expiry testing, mock the date:
   ```typescript
   jest.useFakeTimers();
   jest.setSystemTime(new Date('2026-03-01'));
   // Create consent with expiresAt in the past
   ```

**Acceptance Criteria**:
- [ ] At least 9 test cases pass
- [ ] Tests verify: creation, token uniqueness, valid lookup, expired lookup, missing lookup, submission, signature storage, revocation, audit logging
- [ ] `cd packages/backend && npx jest --testPathPattern=consent` passes

**Dependencies**: None

---

## T-1.3 — Backend Patient Module Tests

**Goal**: Write Jest tests for patient CRUD, lookup hash, and cascading delete.

**Context**: Patient data is encrypted client-side. The backend stores ciphertext. Cascading delete (GDPR Art. 17) must be verified to ensure no orphaned records.

**Files to create**:
- `packages/backend/src/patient/patient.service.spec.ts`

**Files to reference**:
- `packages/backend/src/patient/patient.service.ts`
- `packages/backend/src/patient/patient.dto.ts`

**Steps**:

1. Create `packages/backend/src/patient/patient.service.spec.ts`.

2. Mock `PrismaService` (with `$transaction`), `AuditService`:
   ```typescript
   const mockPrisma = {
     patient: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), delete: jest.fn(), count: jest.fn() },
     consentForm: { deleteMany: jest.fn() },
     treatmentPhoto: { findMany: jest.fn(), deleteMany: jest.fn() },
     treatmentPlan: { deleteMany: jest.fn() },
     $transaction: jest.fn((fn) => fn(mockPrisma)),
   };
   ```

3. Write these test cases:
   - `create()` — creates patient with encrypted fields and lookup hash
   - `findAll()` — returns paginated patients for a practice
   - `findById()` — returns patient with consent history
   - `findByLookupHash()` — finds patient by SHA-256 hash
   - `findByLookupHash()` — returns null for non-existent hash
   - `delete()` — executes cascading delete in transaction (photos > plans > consents > patient)
   - `delete()` — logs GDPR Art. 17 audit event

**Acceptance Criteria**:
- [ ] At least 7 test cases pass
- [ ] Cascading delete verified: `$transaction` called, all related records deleted before patient
- [ ] `cd packages/backend && npx jest --testPathPattern=patient` passes

**Dependencies**: None

---

## T-1.4 — Backend Billing Module Tests

**Goal**: Write Jest tests for Stripe webhook handling and subscription guard logic.

**Context**: Billing webhooks drive subscription state changes. The SubscriptionGuard blocks expired practices. Both must be reliable.

**Files to create**:
- `packages/backend/src/billing/billing.service.spec.ts`
- `packages/backend/src/billing/subscription.guard.spec.ts`

**Files to reference**:
- `packages/backend/src/billing/billing.service.ts`
- `packages/backend/src/billing/subscription.guard.ts`

**Steps**:

1. Create `packages/backend/src/billing/billing.service.spec.ts`:
   - Mock `PrismaService` and `Stripe`
   - Test cases:
     - `handleSubscriptionCreated()` — creates subscription with ACTIVE status
     - `handleSubscriptionUpdated()` — updates status from ACTIVE to PAST_DUE
     - `handleSubscriptionDeleted()` — sets status to CANCELLED
     - `handlePaymentFailed()` — updates status to PAST_DUE
     - `getPlanFromPriceId()` — maps Stripe price IDs to plan enums (STARTER, PROFESSIONAL)

2. Create `packages/backend/src/billing/subscription.guard.spec.ts`:
   - Mock `PrismaService` and `ExecutionContext`
   - Test cases:
     - Allows request when subscription status is ACTIVE
     - Allows request when subscription is TRIALING and within trial period
     - Blocks request (throws ForbiddenException) when trial has expired
     - Blocks request when subscription status is CANCELLED
     - Blocks request when no subscription exists

**Acceptance Criteria**:
- [ ] At least 10 test cases pass across both files
- [ ] Webhook state transitions verified: ACTIVE > PAST_DUE > CANCELLED
- [ ] Guard correctly handles: ACTIVE (allow), TRIALING valid (allow), TRIALING expired (block), CANCELLED (block)
- [ ] `cd packages/backend && npx jest --testPathPattern=billing` passes

**Dependencies**: None

---

## T-1.5 — Frontend Component Tests

**Goal**: Write Vitest tests for critical frontend components: vault panel, consent form encryption, and auth fetch.

**Context**: The zero-knowledge encryption flow is the product's core differentiator. It must be tested beyond just the crypto primitives.

**Files to create**:
- `packages/frontend/src/lib/__tests__/auth-fetch.test.ts`
- `packages/frontend/src/hooks/__tests__/use-vault.test.ts`

**Files to reference**:
- `packages/frontend/src/lib/auth-fetch.ts`
- `packages/frontend/src/hooks/use-vault.ts`
- `packages/frontend/src/lib/__tests__/crypto.test.ts` — pattern reference

**Steps**:

1. Create `packages/frontend/src/lib/__tests__/auth-fetch.test.ts`:
   - Mock `fetch` globally and `useSession` from next-auth
   - Test cases:
     - Adds `Authorization: Bearer <token>` header when session exists
     - Sets `Content-Type: application/json` for string body
     - Throws error with message from API error response
     - Calls correct URL with `API_URL` prefix

2. Create `packages/frontend/src/hooks/__tests__/use-vault.test.ts`:
   - Test the crypto integration (can use actual Web Crypto API in Node):
     - `generatePracticeKeys()` returns valid RSA keypair + encrypted private key
     - `unlock()` succeeds with correct master password
     - `unlock()` fails with wrong master password
     - `encryptForPractice()` + `decryptForm()` round-trip preserves data
     - `lock()` clears the private key (isUnlocked becomes false)

   Note: Testing React hooks requires `@testing-library/react` or testing the underlying functions directly.

**Acceptance Criteria**:
- [ ] At least 8 test cases pass across both files
- [ ] Auth fetch: header injection, content type, error handling verified
- [ ] Vault: keygen, unlock/lock, encrypt/decrypt round-trip verified
- [ ] `cd packages/frontend && npx vitest run` passes

**Dependencies**: None

---

## T-1.6 — React Error Boundaries

**Goal**: Add error boundary components so runtime errors show a fallback UI instead of crashing the entire page.

**Context**: Any unhandled error in a React component tree currently white-screens the app. Error boundaries catch errors and display a retry button.

**Files to create**:
- `packages/frontend/src/app/(authenticated)/error.tsx`
- `packages/frontend/src/app/error.tsx`

**Files to modify**:
- `packages/frontend/src/i18n/messages/en.json` — add error boundary strings
- `packages/frontend/src/i18n/messages/de.json` — add error boundary strings
- `packages/frontend/src/i18n/messages/es.json` — add error boundary strings
- `packages/frontend/src/i18n/messages/fr.json` — add error boundary strings

**Steps**:

1. Create `packages/frontend/src/app/(authenticated)/error.tsx`:
   ```tsx
   'use client';

   import { useEffect } from 'react';
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { AlertTriangle } from 'lucide-react';

   export default function AuthenticatedError({
     error,
     reset,
   }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     useEffect(() => {
       console.error('Authenticated page error:', error);
     }, [error]);

     return (
       <div className="flex min-h-[50vh] items-center justify-center p-4">
         <Card className="w-full max-w-md">
           <CardHeader className="text-center">
             <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
             <CardTitle className="mt-4">Something went wrong</CardTitle>
           </CardHeader>
           <CardContent className="text-center space-y-4">
             <p className="text-muted-foreground">
               An unexpected error occurred. Please try again.
             </p>
             <Button onClick={reset}>Try again</Button>
           </CardContent>
         </Card>
       </div>
     );
   }
   ```

2. Create `packages/frontend/src/app/error.tsx` with a similar structure but including a "Go home" link.

3. Add i18n strings to all 4 locale files under an `"errors"` namespace:
   ```json
   "errors": {
     "title": "Something went wrong",
     "description": "An unexpected error occurred. Please try again.",
     "tryAgain": "Try again",
     "goHome": "Go to homepage"
   }
   ```

**Acceptance Criteria**:
- [ ] `packages/frontend/src/app/(authenticated)/error.tsx` exists
- [ ] `packages/frontend/src/app/error.tsx` exists
- [ ] Error boundaries catch thrown errors and show fallback UI (not white screen)
- [ ] "Try again" button calls `reset()` to re-render the component tree
- [ ] `make build` succeeds (no TypeScript errors)

**Dependencies**: None

---

## T-1.7 — Session Expiry Handling

**Goal**: Detect expired JWT sessions, redirect to login, auto-lock the vault, and show a toast notification.

**Context**: JWTs expire after 7 days. Currently, expired sessions cause silent API failures. The vault stays "unlocked" even after the session is invalid.

**Files to modify**:
- `packages/frontend/src/lib/auth-fetch.ts` — detect 401 and trigger redirect
- `packages/frontend/src/hooks/use-vault.ts` — add session-aware auto-lock

**Files to reference**:
- `packages/frontend/src/lib/auth.ts` — NextAuth config (signOut function)

**Steps**:

1. In `packages/frontend/src/lib/auth-fetch.ts`, modify the `authFetch` function to detect 401 responses:
   ```typescript
   if (res.status === 401) {
     // Import at top: import { signOut } from 'next-auth/react';
     // Import at top: import { toast } from 'sonner';
     toast.error('Session expired. Please log in again.');
     await signOut({ redirectTo: '/login' });
     throw new Error('Session expired');
   }
   ```

2. In `packages/frontend/src/hooks/use-vault.ts`, add a session check. When the hook detects the session is null/expired, auto-lock:
   ```typescript
   // Add useSession import
   const { data: session } = useSession();

   useEffect(() => {
     if (!session && privateKeyRef.current) {
       lock();
     }
   }, [session]);
   ```

3. Add i18n strings for session expiry toast in all 4 locale files:
   ```json
   "session": {
     "expired": "Session expired. Please log in again."
   }
   ```

**Acceptance Criteria**:
- [ ] When backend returns 401, user is redirected to `/login`
- [ ] A toast notification "Session expired" is shown
- [ ] The vault auto-locks when session becomes null
- [ ] No infinite redirect loop (login page must not require auth)
- [ ] `make build` succeeds

**Dependencies**: None

---

## T-1.8 — Custom 404 and Error Pages

**Goal**: Replace the default Next.js 404 page with a branded page that navigates users back to the dashboard.

**Context**: Navigating to any non-existent route shows the default Next.js 404. Looks unfinished and breaks user trust.

**Files to create**:
- `packages/frontend/src/app/not-found.tsx`

**Files to modify**:
- `packages/frontend/src/i18n/messages/en.json` — add 404 strings
- `packages/frontend/src/i18n/messages/de.json` — add 404 strings
- `packages/frontend/src/i18n/messages/es.json` — add 404 strings
- `packages/frontend/src/i18n/messages/fr.json` — add 404 strings

**Steps**:

1. Create `packages/frontend/src/app/not-found.tsx`:
   ```tsx
   import Link from 'next/link';
   import { Button } from '@/components/ui/button';

   export default function NotFound() {
     return (
       <div className="flex min-h-screen flex-col items-center justify-center p-4">
         <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
         <p className="mt-4 text-lg text-muted-foreground">
           Page not found
         </p>
         <div className="mt-8 flex gap-4">
           <Button asChild>
             <Link href="/dashboard">Go to Dashboard</Link>
           </Button>
           <Button variant="outline" asChild>
             <Link href="/">Go to Homepage</Link>
           </Button>
         </div>
       </div>
     );
   }
   ```

2. Add i18n strings to all 4 locale files:
   ```json
   "notFound": {
     "title": "404",
     "description": "Page not found",
     "dashboard": "Go to Dashboard",
     "home": "Go to Homepage"
   }
   ```

**Acceptance Criteria**:
- [ ] Navigating to `/nonexistent-page` shows the custom 404 page
- [ ] Page has "Go to Dashboard" and "Go to Homepage" buttons
- [ ] Both buttons navigate correctly
- [ ] `make build` succeeds

**Dependencies**: None
