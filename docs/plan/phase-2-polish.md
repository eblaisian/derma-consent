# Phase 2 — Feature Polish

> Complete partially-implemented features and add must-have UX for a credible product launch.
> Begin after all Phase 1 tasks are complete.

---

## T-2.1 — Practice Info Editable in Settings

**Goal**: Allow admins to update practice name and DSGVO contact email from the settings page.

**Context**: The settings page displays practice name and DSGVO contact but they are read-only. No PATCH endpoint exists for the practice entity itself (only for the settings sub-resource). This makes the settings page feel broken.

**Files to create**:
- `packages/backend/src/practice/update-practice.dto.ts`

**Files to modify**:
- `packages/backend/src/practice/practice.controller.ts` — add `PATCH /api/practice`
- `packages/backend/src/practice/practice.service.ts` — add `update()` method
- `packages/frontend/src/app/(authenticated)/settings/page.tsx` — wire save button for practice fields

**Steps**:

1. Create `packages/backend/src/practice/update-practice.dto.ts`:
   ```typescript
   import { IsString, IsOptional, IsEmail } from 'class-validator';

   export class UpdatePracticeDto {
     @IsOptional()
     @IsString()
     name?: string;

     @IsOptional()
     @IsEmail()
     dsgvoContact?: string;
   }
   ```

2. In `packages/backend/src/practice/practice.service.ts`, add:
   ```typescript
   async update(practiceId: string, dto: UpdatePracticeDto) {
     return this.prisma.practice.update({
       where: { id: practiceId },
       data: {
         ...(dto.name && { name: dto.name }),
         ...(dto.dsgvoContact && { dsgvoContact: dto.dsgvoContact }),
       },
     });
   }
   ```

3. In `packages/backend/src/practice/practice.controller.ts`, add:
   ```typescript
   @Patch()
   @Roles('ADMIN')
   update(@Body() dto: UpdatePracticeDto, @CurrentUser() user: CurrentUserPayload) {
     return this.practiceService.update(user.practiceId!, dto);
   }
   ```
   Also add the required imports: `Patch`, `Body`, `UpdatePracticeDto`, `Roles`.

4. In the frontend settings page (`packages/frontend/src/app/(authenticated)/settings/page.tsx`):
   - Find the practice name and DSGVO contact input fields
   - Add `onChange` handlers that update local state
   - Add a save button that calls `authFetch('/api/practice', { method: 'PATCH', body: JSON.stringify({ name, dsgvoContact }) })`
   - On success, call `mutatePractice()` to refresh SWR cache and show `toast.success()`

5. Add i18n string `"settings.practiceInfoSaved": "Practice info saved"` in all 4 locales.

**Acceptance Criteria**:
- [ ] `PATCH /api/practice` with `{ "name": "New Name" }` updates the practice name
- [ ] `PATCH /api/practice` requires ADMIN role (403 for ARZT/EMPFANG)
- [ ] Frontend settings page has editable name and DSGVO contact fields with a save button
- [ ] Saving shows success toast
- [ ] Refreshing the page shows the updated values
- [ ] `make test-backend` passes

**Dependencies**: None

---

## T-2.2 — Brand Color Applied to Consent Forms

**Goal**: Apply the practice's brand color to the public consent form page so that consent forms reflect the practice's branding.

**Context**: The brand color picker in settings saves to the database, but the public consent form page (`/consent/[token]`) does not use it. The feature is misleading without this connection.

**Files to modify**:
- `packages/backend/src/consent/consent.service.ts` — include brand color in public consent response
- `packages/frontend/src/app/consent/[token]/page.tsx` — apply brand color as CSS custom property

**Steps**:

1. In `packages/backend/src/consent/consent.service.ts`, modify `findByToken()`:
   - After fetching the consent form, also fetch the practice settings:
     ```typescript
     const settings = await this.prisma.practiceSettings.findUnique({
       where: { practiceId: consent.practiceId },
       select: { brandColor: true, logoUrl: true },
     });
     ```
   - Include `brandColor` and `logoUrl` in the returned object:
     ```typescript
     return { ...consent, brandColor: settings?.brandColor, logoUrl: settings?.logoUrl };
     ```

2. In `packages/frontend/src/app/consent/[token]/page.tsx`:
   - Extract `brandColor` from the fetched consent data
   - Apply it as a CSS custom property on the page container:
     ```tsx
     <div
       style={brandColor ? { '--brand-color': brandColor } as React.CSSProperties : undefined}
       className="..."
     >
     ```
   - Use the custom property for accent elements (buttons, progress bar, header):
     ```tsx
     <Button
       style={brandColor ? { backgroundColor: brandColor } : undefined}
     >
     ```

3. Optionally display the practice logo if `logoUrl` is present:
   ```tsx
   {logoUrl && <img src={logoUrl} alt="Practice logo" className="h-12 w-auto" />}
   ```

**Acceptance Criteria**:
- [ ] `GET /api/consent/:token` response includes `brandColor` and `logoUrl` fields
- [ ] Consent form page buttons use the practice's brand color when set
- [ ] Default styling works when no brand color is set (null)
- [ ] Practice logo appears on consent form when set
- [ ] `make build` succeeds

**Dependencies**: None

---

## T-2.3 — Manual Patient Creation

**Goal**: Replace the placeholder "New Patient" dialog with a functional form that encrypts patient data client-side and creates the patient via the existing API.

**Context**: Currently, patients are only auto-created when a consent form is submitted. Practices need to pre-register patients (e.g., walk-ins, phone bookings). The backend `POST /api/patients` endpoint already exists and works.

**Files to create**:
- `packages/frontend/src/components/patients/create-patient-dialog.tsx`

**Files to modify**:
- `packages/frontend/src/app/(authenticated)/patients/page.tsx` — replace placeholder with new dialog

**Steps**:

1. Create `packages/frontend/src/components/patients/create-patient-dialog.tsx`:
   ```tsx
   'use client';

   import { useState } from 'react';
   import { useTranslations } from 'next-intl';
   import { toast } from 'sonner';
   import { useVault } from '@/hooks/use-vault';
   import { usePractice } from '@/hooks/use-practice';
   import { useAuthFetch } from '@/lib/auth-fetch';
   import { Button } from '@/components/ui/button';
   import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
   import { Input } from '@/components/ui/input';
   import { Label } from '@/components/ui/label';

   interface Props {
     onCreated: () => void;
   }

   export function CreatePatientDialog({ onCreated }: Props) {
     const t = useTranslations('patients');
     const { isUnlocked, encryptForPractice } = useVault();
     const { practice } = usePractice();
     const authFetch = useAuthFetch();
     const [open, setOpen] = useState(false);
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [name, setName] = useState('');
     const [dob, setDob] = useState('');
     const [email, setEmail] = useState('');

     const handleSubmit = async () => {
       if (!name.trim() || !practice?.publicKey) return;
       if (!isUnlocked) {
         toast.error(t('vaultRequired'));
         return;
       }

       setIsSubmitting(true);
       try {
         // Encrypt patient data client-side
         const encrypted = await encryptForPractice(
           { name, dob, email },
           practice.publicKey,
         );

         // Generate lookup hash (SHA-256 of normalized name + dob)
         const encoder = new TextEncoder();
         const hashBuffer = await crypto.subtle.digest(
           'SHA-256',
           encoder.encode(`${name.trim().toLowerCase()}:${dob}`),
         );
         const lookupHash = Array.from(new Uint8Array(hashBuffer))
           .map((b) => b.toString(16).padStart(2, '0'))
           .join('');

         await authFetch('/api/patients', {
           method: 'POST',
           body: JSON.stringify({
             encryptedName: encrypted.encryptedData,
             encryptedDob: dob ? encrypted.encryptedData : undefined,
             encryptedEmail: email ? encrypted.encryptedData : undefined,
             lookupHash,
           }),
         });

         toast.success(t('created'));
         setOpen(false);
         setName('');
         setDob('');
         setEmail('');
         onCreated();
       } catch (err) {
         toast.error(t('createError'));
       } finally {
         setIsSubmitting(false);
       }
     };

     return (
       <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>
           <Button>{t('newPatient')}</Button>
         </DialogTrigger>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>{t('newPatient')}</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <Label>{t('name')}</Label>
               <Input value={name} onChange={(e) => setName(e.target.value)} required />
             </div>
             <div>
               <Label>{t('dateOfBirth')}</Label>
               <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
             </div>
             <div>
               <Label>{t('email')}</Label>
               <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
             </div>
             {!isUnlocked && (
               <p className="text-sm text-destructive">{t('vaultRequired')}</p>
             )}
             <Button onClick={handleSubmit} disabled={!name.trim() || !isUnlocked || isSubmitting}>
               {isSubmitting ? t('creating') : t('create')}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     );
   }
   ```

   **Important**: The encryption approach above is simplified. Review `use-vault.ts` to use the exact `encryptForPractice()` API — each field (name, dob, email) should be encrypted separately using the practice's public key JWK.

2. In `packages/frontend/src/app/(authenticated)/patients/page.tsx`:
   - Remove the placeholder "New Patient" dialog content
   - Import and render `<CreatePatientDialog onCreated={() => mutatePatients()} />`

3. Add i18n strings to all 4 locale files:
   ```json
   "patients": {
     "newPatient": "New Patient",
     "name": "Full Name",
     "dateOfBirth": "Date of Birth",
     "email": "Email",
     "create": "Create Patient",
     "creating": "Creating...",
     "created": "Patient created",
     "createError": "Failed to create patient",
     "vaultRequired": "Please unlock the vault first"
   }
   ```

**Acceptance Criteria**:
- [ ] "New Patient" button opens a dialog with name, DOB, and email fields
- [ ] Vault must be unlocked to submit (message shown if locked)
- [ ] Patient data is encrypted client-side before submission
- [ ] Lookup hash is generated from normalized name + DOB
- [ ] `POST /api/patients` is called with encrypted data
- [ ] Success toast shown, dialog closes, patient list refreshes
- [ ] `make build` succeeds

**Dependencies**: None

---

## T-2.4 — Enabled Consent Types in Settings UI

**Goal**: Add a checkbox group in settings to toggle which consent types are available for the practice.

**Context**: The backend already supports `enabledConsentTypes` in the settings DTO. The frontend settings page doesn't expose this. Practices that only do Botox + Filler shouldn't see LASER/PRP options in the "New Consent" dialog.

**Files to modify**:
- `packages/frontend/src/app/(authenticated)/settings/page.tsx` — add consent type toggles
- `packages/frontend/src/components/dashboard/new-consent-dialog.tsx` — filter types by settings

**Steps**:

1. In the settings page, add a section after the existing settings fields:
   ```tsx
   <Card>
     <CardHeader>
       <CardTitle>{t('consentTypes')}</CardTitle>
     </CardHeader>
     <CardContent className="space-y-2">
       {['BOTOX', 'FILLER', 'LASER', 'CHEMICAL_PEEL', 'MICRONEEDLING', 'PRP'].map((type) => (
         <label key={type} className="flex items-center gap-2">
           <input
             type="checkbox"
             checked={enabledTypes.includes(type)}
             onChange={(e) => {
               if (e.target.checked) {
                 setEnabledTypes([...enabledTypes, type]);
               } else {
                 setEnabledTypes(enabledTypes.filter((t) => t !== type));
               }
             }}
           />
           <span>{tConsentTypes(type)}</span>
         </label>
       ))}
     </CardContent>
   </Card>
   ```
   Use `useTranslations('consentTypes')` for translated type labels.

2. Save the enabled types via the existing settings PATCH endpoint:
   ```typescript
   await authFetch('/api/settings', {
     method: 'PATCH',
     body: JSON.stringify({ enabledConsentTypes: enabledTypes }),
   });
   ```

3. In `packages/frontend/src/components/dashboard/new-consent-dialog.tsx`:
   - Fetch settings using SWR: `useSWR('/api/settings', ...)`
   - Filter the consent type dropdown to only show enabled types:
     ```typescript
     const types = allTypes.filter((t) =>
       settings?.enabledConsentTypes?.includes(t) ?? true
     );
     ```

4. Add i18n string `"settings.consentTypes": "Enabled Consent Types"` in all 4 locales.

**Acceptance Criteria**:
- [ ] Settings page shows checkboxes for all 6 consent types
- [ ] Checking/unchecking and saving persists to the database
- [ ] "New Consent" dialog only shows enabled types
- [ ] If no types are configured, all types are shown (backward compatible)
- [ ] `make build` succeeds

**Dependencies**: None

---

## T-2.5 — Enterprise Contact Button

**Goal**: Make the Enterprise plan "Contact Us" button functional by linking to a mailto or contact form.

**Context**: The Enterprise plan card has a disabled button. This means zero enterprise lead capture.

**Files to modify**:
- `packages/frontend/src/app/(authenticated)/billing/page.tsx` — wire the button

**Steps**:

1. In the billing page, find the Enterprise plan card's button (currently disabled).

2. Replace with a functional button:
   ```tsx
   <Button asChild>
     <a href="mailto:enterprise@dermaconsent.de?subject=Enterprise%20Plan%20Inquiry">
       {t('contactUs')}
     </a>
   </Button>
   ```
   Or, if a website contact URL is preferred:
   ```tsx
   <Button asChild>
     <a href="https://dermaconsent.de/contact" target="_blank" rel="noopener noreferrer">
       {t('contactUs')}
     </a>
   </Button>
   ```

3. Remove the `disabled` attribute from the button.

**Acceptance Criteria**:
- [ ] Enterprise plan "Contact Us" button is clickable
- [ ] Clicking opens the default email client with pre-filled subject, OR opens a contact page
- [ ] Button is not disabled
- [ ] `make build` succeeds

**Dependencies**: None

---

## T-2.6 — Revenue Analytics with Stripe Amounts

**Goal**: Fetch actual payment amounts from Stripe and display total revenue, average transaction, and revenue trend in the analytics page.

**Context**: The revenue endpoint currently returns payment intent IDs but not amounts. The analytics page cannot show meaningful revenue data.

**Files to modify**:
- `packages/backend/src/analytics/analytics.service.ts` — fetch amounts from Stripe
- `packages/frontend/src/app/(authenticated)/analytics/page.tsx` — display revenue metrics

**Steps**:

1. In `packages/backend/src/analytics/analytics.service.ts`, modify the revenue method:
   ```typescript
   async getRevenue(practiceId: string) {
     const paidConsents = await this.prisma.consentForm.findMany({
       where: {
         practiceId,
         status: { in: ['PAID', 'COMPLETED'] },
         paymentIntentId: { not: null },
       },
       select: { paymentIntentId: true, signedAt: true },
       orderBy: { signedAt: 'desc' },
     });

     // If Stripe is configured, fetch amounts
     let totalRevenue = 0;
     let transactions: { date: string; amount: number }[] = [];

     if (this.stripe && paidConsents.length > 0) {
       for (const consent of paidConsents) {
         try {
           const pi = await this.stripe.paymentIntents.retrieve(consent.paymentIntentId!);
           const amount = pi.amount / 100; // cents to EUR
           totalRevenue += amount;
           transactions.push({
             date: consent.signedAt?.toISOString() || '',
             amount,
           });
         } catch {
           // Skip failed lookups
         }
       }
     }

     return {
       totalRevenue,
       transactionCount: paidConsents.length,
       averageTransaction: paidConsents.length > 0 ? totalRevenue / paidConsents.length : 0,
       transactions,
     };
   }
   ```

   Inject `Stripe` in the analytics service constructor (check if billing module already provides it, or inject conditionally).

2. In the frontend analytics page, add a revenue section:
   ```tsx
   <Card>
     <CardHeader>
       <CardTitle>{t('revenue')}</CardTitle>
     </CardHeader>
     <CardContent>
       <p className="text-2xl font-bold">EUR {revenue?.totalRevenue?.toFixed(2) ?? '0.00'}</p>
       <p className="text-sm text-muted-foreground">
         {revenue?.transactionCount ?? 0} {t('transactions')} | {t('avg')} EUR {revenue?.averageTransaction?.toFixed(2) ?? '0.00'}
       </p>
     </CardContent>
   </Card>
   ```

3. Add i18n strings: `"analytics.revenue"`, `"analytics.transactions"`, `"analytics.avg"` in all 4 locales.

**Acceptance Criteria**:
- [ ] `GET /api/analytics/revenue` returns `{ totalRevenue, transactionCount, averageTransaction, transactions }`
- [ ] Amounts are in EUR (converted from cents)
- [ ] Analytics page displays total revenue, transaction count, and average
- [ ] Gracefully handles case when Stripe is not configured (returns zeros)
- [ ] `make build` succeeds

**Dependencies**: None

---

## T-2.7 — Landing Page

**Goal**: Build a proper marketing landing page at `/` with value proposition, features, pricing, and CTAs.

**Context**: The current home page is a minimal stub with two buttons. This is the first thing potential customers see. It needs to communicate the product's value, highlight zero-knowledge encryption, and drive free trial signups.

**Files to modify**:
- `packages/frontend/src/app/page.tsx` — replace with full landing page

**Files to reference**:
- `packages/frontend/src/app/(authenticated)/billing/page.tsx` — pricing tier data
- `docs/STRATEGY.md` — positioning and pricing details

**Steps**:

1. Replace `packages/frontend/src/app/page.tsx` with a multi-section landing page. Structure:

   **Section 1 — Hero**:
   - Headline: "Privacy-first consent management for dermatology"
   - Subheading: "Zero-knowledge encrypted. DSGVO compliant. Built for aesthetic practices."
   - CTA buttons: "Start Free Trial" (link to `/register`) and "Learn More" (scroll anchor)

   **Section 2 — Problem Statement**:
   - 3 pain point cards: Paper consent burden, Photo management chaos, GDPR compliance anxiety

   **Section 3 — Features**:
   - 6 feature cards with icons (lucide-react):
     - Digital Consent Forms (6 treatment types)
     - Zero-Knowledge Encryption (RSA-4096 + AES-256-GCM)
     - Before/After Photos (encrypted, tagged by region)
     - Treatment Planning (anatomical diagrams, injection mapping)
     - Multi-Language (4 languages)
     - Analytics & Audit (GDPR-compliant audit trail)

   **Section 4 — Security Highlight**:
   - Full-width section with dark background
   - "We cannot see your patient data. Ever."
   - Brief explanation of zero-knowledge architecture
   - Trust badges: DSGVO, AES-256, RSA-4096

   **Section 5 — Pricing**:
   - 3 plan cards matching the billing page: Starter (EUR 79/mo), Professional (EUR 179/mo), Enterprise (EUR 399+/mo)
   - Feature comparison list
   - "Start 14-day free trial" CTA

   **Section 6 — Footer**:
   - Links: Impressum, Datenschutz, Kontakt
   - Language switcher

2. Use existing UI components: `Card`, `Button`, `Badge`.

3. Use existing i18n infrastructure. Add a `"landing"` namespace with all strings.

4. Make responsive (mobile-first using TailwindCSS breakpoints).

**Acceptance Criteria**:
- [ ] Landing page at `/` has: hero, features, security highlight, pricing, footer
- [ ] "Start Free Trial" links to `/register`
- [ ] Pricing matches the billing page tiers (Starter EUR 79, Professional EUR 179, Enterprise EUR 399+)
- [ ] Page is responsive (mobile + desktop)
- [ ] All text is internationalized (4 locales)
- [ ] `make build` succeeds

**Dependencies**: None

---

## T-2.8 — Onboarding Flow

**Goal**: Add a post-setup welcome modal that guides new users through creating their first consent form.

**Context**: After registration and practice setup, users land on an empty dashboard with no guidance. The first-time experience must be smooth enough that a physician can send their first consent link within 2 minutes.

**Files to create**:
- `packages/frontend/src/components/dashboard/onboarding-modal.tsx`

**Files to modify**:
- `packages/frontend/src/app/(authenticated)/dashboard/page.tsx` — show modal for new practices

**Steps**:

1. Create `packages/frontend/src/components/dashboard/onboarding-modal.tsx`:
   ```tsx
   'use client';

   import { useState } from 'react';
   import { useTranslations } from 'next-intl';
   import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
   import { Button } from '@/components/ui/button';

   interface Props {
     open: boolean;
     onClose: () => void;
     onCreateConsent: () => void;
   }

   export function OnboardingModal({ open, onClose, onCreateConsent }: Props) {
     const t = useTranslations('onboarding');
     const [step, setStep] = useState(0);

     const steps = [
       {
         title: t('welcome.title'),
         description: t('welcome.description'),
       },
       {
         title: t('vault.title'),
         description: t('vault.description'),
       },
       {
         title: t('firstConsent.title'),
         description: t('firstConsent.description'),
       },
     ];

     return (
       <Dialog open={open} onOpenChange={onClose}>
         <DialogContent className="sm:max-w-lg">
           <DialogHeader>
             <DialogTitle>{steps[step].title}</DialogTitle>
           </DialogHeader>
           <p className="text-muted-foreground">{steps[step].description}</p>
           <div className="flex justify-between mt-6">
             <span className="text-sm text-muted-foreground">
               {step + 1} / {steps.length}
             </span>
             <div className="flex gap-2">
               {step < steps.length - 1 ? (
                 <Button onClick={() => setStep(step + 1)}>{t('next')}</Button>
               ) : (
                 <Button onClick={() => { onClose(); onCreateConsent(); }}>
                   {t('createFirst')}
                 </Button>
               )}
             </div>
           </div>
         </DialogContent>
       </Dialog>
     );
   }
   ```

2. In the dashboard page, detect if this is a new practice (no consents yet):
   ```typescript
   const showOnboarding = consents && consents.length === 0 && !localStorage.getItem('onboarding-dismissed');

   const dismissOnboarding = () => {
     localStorage.setItem('onboarding-dismissed', 'true');
   };
   ```

3. Render the modal:
   ```tsx
   {showOnboarding && (
     <OnboardingModal
       open={true}
       onClose={dismissOnboarding}
       onCreateConsent={() => { dismissOnboarding(); setShowNewConsentDialog(true); }}
     />
   )}
   ```

4. Add i18n strings in all 4 locales:
   ```json
   "onboarding": {
     "welcome": {
       "title": "Welcome to DermaConsent",
       "description": "Your zero-knowledge encrypted consent management platform. Let's get started."
     },
     "vault": {
       "title": "Your Encryption Vault",
       "description": "All patient data is encrypted with your master password. The vault panel on the dashboard lets you unlock decryption. We never have access to your data."
     },
     "firstConsent": {
       "title": "Create Your First Consent",
       "description": "Click below to create your first consent form. You'll choose a treatment type, and we'll generate a secure link you can send to your patient."
     },
     "next": "Next",
     "createFirst": "Create First Consent"
   }
   ```

**Acceptance Criteria**:
- [ ] New practices (0 consents) see the onboarding modal on first dashboard load
- [ ] Modal has 3 steps: Welcome, Vault explanation, Create first consent
- [ ] Final step opens the "New Consent" dialog
- [ ] Modal is dismissed after completion (stored in localStorage)
- [ ] Does not appear for existing practices with consents
- [ ] Does not reappear after dismissal
- [ ] `make build` succeeds

**Dependencies**: None
