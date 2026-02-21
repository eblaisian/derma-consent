# Phase 4 — Post-Launch Enhancements

> Nice-to-have features for competitive advantage. Execute after successful production launch.
> Prioritized by impact/effort ratio.

---

## T-4.1 — Two-Factor Authentication (2FA)

**Goal**: Add TOTP-based two-factor authentication as an opt-in setting for practice accounts.

**Context**: Medical data platforms are expected to offer 2FA. Enterprise customers may require it. TOTP (Time-based One-Time Password) using authenticator apps (Google Authenticator, Authy) is the standard.

**Files to create**:
- `packages/backend/src/auth/two-factor.service.ts`
- `packages/backend/src/auth/two-factor.dto.ts`
- `packages/frontend/src/components/settings/two-factor-setup.tsx`

**Files to modify**:
- `packages/backend/prisma/schema.prisma` — add 2FA fields to User model
- `packages/backend/src/auth/auth.controller.ts` — add 2FA endpoints
- `packages/backend/src/auth/auth.service.ts` — add 2FA verification to login flow
- `packages/frontend/src/app/(authenticated)/settings/page.tsx` — add 2FA section
- `packages/frontend/src/app/login/login-form.tsx` — add 2FA code input step

**Steps**:

1. Install dependency: `cd packages/backend && pnpm add otplib qrcode`
   Install types: `pnpm add -D @types/qrcode`

2. Add to Prisma schema (User model):
   ```prisma
   twoFactorSecret   String?  @map("two_factor_secret")
   twoFactorEnabled   Boolean  @default(false) @map("two_factor_enabled")
   ```
   Run: `make migrate && make generate`

3. Create `packages/backend/src/auth/two-factor.service.ts`:
   - `generateSecret(email: string)` — generate TOTP secret + QR code data URL
   - `verifyToken(secret: string, token: string)` — verify a 6-digit TOTP code
   - `enableTwoFactor(userId: string, token: string)` — verify token and enable 2FA
   - `disableTwoFactor(userId: string, token: string)` — verify token and disable 2FA

4. Add endpoints to auth controller:
   - `POST /api/auth/2fa/setup` — returns QR code + secret (authenticated)
   - `POST /api/auth/2fa/enable` — verify token and enable (authenticated)
   - `POST /api/auth/2fa/disable` — verify token and disable (authenticated)
   - `POST /api/auth/2fa/verify` — verify token during login (unauthenticated, requires pending 2FA session)

5. Modify login flow:
   - If user has `twoFactorEnabled: true`, return `{ requires2FA: true, tempToken: '...' }` instead of full JWT
   - Client shows 2FA input field
   - After 2FA verification, issue the full JWT

6. Create frontend setup component:
   - Show QR code image
   - Input for verification code
   - Enable/disable toggle

7. Add to login form:
   - After credentials step, if `requires2FA`, show TOTP input field
   - Submit 6-digit code to `/api/auth/2fa/verify`

**Acceptance Criteria**:
- [ ] User can enable 2FA from settings page
- [ ] QR code displayed for authenticator app scanning
- [ ] Login requires 6-digit code when 2FA is enabled
- [ ] 2FA can be disabled with valid code
- [ ] Login still works normally when 2FA is not enabled
- [ ] Invalid 2FA codes are rejected
- [ ] `make test-backend` passes

**Dependencies**: None

---

## T-4.2 — Dark Mode

**Goal**: Add a dark mode toggle that respects system preference and user choice.

**Context**: TailwindCSS 4 supports dark mode natively via the `dark:` variant. Medical professionals often work in dim exam rooms where dark mode reduces eye strain. Low effort, high perceived polish.

**Files to create**:
- `packages/frontend/src/components/theme-toggle.tsx`
- `packages/frontend/src/hooks/use-theme.ts`

**Files to modify**:
- `packages/frontend/src/app/layout.tsx` — add dark mode class
- `packages/frontend/src/components/layout/app-shell.tsx` — add theme toggle
- `packages/frontend/tailwind.config.ts` (or CSS config) — ensure dark mode is `class` strategy

**Steps**:

1. Create `packages/frontend/src/hooks/use-theme.ts`:
   ```typescript
   'use client';
   import { useState, useEffect } from 'react';

   type Theme = 'light' | 'dark' | 'system';

   export function useTheme() {
     const [theme, setTheme] = useState<Theme>('system');

     useEffect(() => {
       const stored = localStorage.getItem('theme') as Theme | null;
       if (stored) setTheme(stored);
     }, []);

     useEffect(() => {
       const root = document.documentElement;
       const isDark =
         theme === 'dark' ||
         (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

       root.classList.toggle('dark', isDark);
       localStorage.setItem('theme', theme);
     }, [theme]);

     return { theme, setTheme };
   }
   ```

2. Create `packages/frontend/src/components/theme-toggle.tsx`:
   - Button that cycles through: system > light > dark
   - Icons: Monitor (system), Sun (light), Moon (dark) from lucide-react

3. In `packages/frontend/src/app/layout.tsx`:
   - Add `suppressHydrationWarning` to `<html>` tag
   - Add inline script to prevent flash of wrong theme:
     ```html
     <script dangerouslySetInnerHTML={{ __html: `
       (function() {
         const theme = localStorage.getItem('theme');
         const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
         if (isDark) document.documentElement.classList.add('dark');
       })()
     ` }} />
     ```

4. Add the theme toggle to the app shell header (next to the language switcher).

5. Audit all components for dark mode compatibility:
   - shadcn/ui components should already support dark mode
   - Check custom components for hardcoded colors (white backgrounds, dark text)
   - Add `dark:` variants where needed (e.g., `bg-white dark:bg-gray-900`)

**Acceptance Criteria**:
- [ ] Theme toggle visible in the header
- [ ] Three modes work: light, dark, system
- [ ] Preference persists across page reloads (localStorage)
- [ ] No flash of wrong theme on page load
- [ ] All pages readable in dark mode (no invisible text, proper contrast)
- [ ] Consent form (public page) also supports dark mode
- [ ] `make build` succeeds

**Dependencies**: None

---

## T-4.3 — Additional Languages (Turkish, Arabic, Russian, Polish)

**Goal**: Expand from 4 to 8 supported languages to cover ~95% of patients in German healthcare settings.

**Context**: Turkey, Arabic-speaking countries, Russia, and Poland are the largest immigrant communities in Germany. Multi-language consent forms are legally required (BGB 630e: consent must be in a language the patient understands).

**Files to create**:
- `packages/frontend/src/i18n/messages/tr.json` (Turkish)
- `packages/frontend/src/i18n/messages/ar.json` (Arabic)
- `packages/frontend/src/i18n/messages/ru.json` (Russian)
- `packages/frontend/src/i18n/messages/pl.json` (Polish)

**Files to modify**:
- `packages/frontend/src/i18n/config.ts` — add new locales
- `packages/frontend/src/middleware.ts` — add new locales to detection
- `packages/frontend/src/i18n/messages/en.json` — reference structure (548+ keys)

**Steps**:

1. Update `packages/frontend/src/i18n/config.ts`:
   ```typescript
   export const locales = ['de', 'en', 'es', 'fr', 'tr', 'ar', 'ru', 'pl'] as const;
   ```

2. Create each new locale file by translating all keys from `en.json`. Use professional medical translation for:
   - `medicalFields.*` — medical terminology must be accurate
   - `consent.*` — legal consent language must be precise
   - `consentTypes.*` — treatment names

3. For Arabic (`ar.json`):
   - Add RTL support to the layout:
     ```tsx
     // In layout.tsx
     <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
     ```
   - Add Tailwind RTL plugin or use logical properties (`start`/`end` instead of `left`/`right`)

4. Update the language switcher to include new languages:
   - Add language labels: `"languages": { "tr": "Turkce", "ar": "العربية", "ru": "Русский", "pl": "Polski" }`

5. Update middleware locale detection to recognize the new language codes.

**Acceptance Criteria**:
- [ ] All 8 locales selectable from the language switcher
- [ ] All 548+ keys translated in each new locale file
- [ ] Medical terminology verified by a native speaker (flag for manual review)
- [ ] Arabic layout renders RTL correctly
- [ ] Consent form (public page) works in all 8 languages
- [ ] `make build` succeeds

**Dependencies**: None

---

## T-4.4 — SMS/WhatsApp Consent Link Delivery

**Goal**: Add SMS and WhatsApp as delivery channels for consent form links alongside email.

**Context**: Email open rates are ~20%; SMS is ~98%. WhatsApp is the dominant messaging platform in Germany. Nelly offers this and it's a key UX advantage.

**Files to create**:
- `packages/backend/src/sms/sms.service.ts`
- `packages/backend/src/sms/sms.module.ts`

**Files to modify**:
- `packages/backend/src/consent/consent.dto.ts` — add delivery channel field
- `packages/backend/src/consent/consent.service.ts` — trigger SMS/WhatsApp delivery
- `packages/backend/src/app.module.ts` — import SmsModule
- `packages/frontend/src/components/dashboard/new-consent-dialog.tsx` — add phone number input and channel selector

**Steps**:

1. Install Twilio SDK: `cd packages/backend && pnpm add twilio`

2. Create `packages/backend/src/sms/sms.module.ts` and `sms.service.ts`:
   - Use Twilio API for SMS: `client.messages.create({ to, from, body })`
   - Use Twilio WhatsApp: `client.messages.create({ to: 'whatsapp:+49...', from: 'whatsapp:+14155238886', body })`
   - Graceful no-op if `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` not configured
   - `sendConsentLink(phone: string, channel: 'sms' | 'whatsapp', link: string, practiceName: string)`

3. Update `CreateConsentDto`:
   ```typescript
   @IsOptional()
   @IsString()
   patientPhone?: string;

   @IsOptional()
   @IsEnum(['email', 'sms', 'whatsapp'])
   deliveryChannel?: 'email' | 'sms' | 'whatsapp';
   ```

4. In consent service `create()`, after generating the consent link:
   ```typescript
   if (dto.deliveryChannel === 'sms' && dto.patientPhone) {
     await this.smsService.sendConsentLink(dto.patientPhone, 'sms', link, practice.name);
   } else if (dto.deliveryChannel === 'whatsapp' && dto.patientPhone) {
     await this.smsService.sendConsentLink(dto.patientPhone, 'whatsapp', link, practice.name);
   } else if (dto.patientEmail) {
     await this.emailService.sendConsentLink(dto.patientEmail, link, practice.name);
   }
   ```

5. In the frontend "New Consent" dialog:
   - Add delivery channel radio buttons: Email, SMS, WhatsApp
   - Show phone number input when SMS or WhatsApp selected
   - Show email input when Email selected

6. Add env vars to `.env.example`:
   ```
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_PHONE_NUMBER=
   ```

**Acceptance Criteria**:
- [ ] Consent link can be sent via SMS
- [ ] Consent link can be sent via WhatsApp
- [ ] Email delivery still works as default
- [ ] Phone number validated before sending
- [ ] Graceful degradation when Twilio not configured
- [ ] `make test-backend` passes

**Dependencies**: None

---

## T-4.5 — Patient Comprehension Verification

**Goal**: Add a simple comprehension quiz to the consent form that verifies the patient understood key risks before signing.

**Context**: No competitor verifies patient understanding. This strengthens legal defensibility under BGB 630e (duty to inform) and differentiates DermaConsent from simple signature-collection tools.

**Files to create**:
- `packages/frontend/src/components/consent-form/comprehension-quiz.tsx`
- `packages/frontend/src/components/consent-form/quiz-questions.ts`

**Files to modify**:
- `packages/frontend/src/components/consent-form/consent-form.tsx` — add quiz step between form and signature
- `packages/backend/src/consent/consent.dto.ts` — add comprehension data to submit DTO
- `packages/backend/prisma/schema.prisma` — add comprehension fields to ConsentForm

**Steps**:

1. Add to Prisma schema (ConsentForm model):
   ```prisma
   comprehensionScore    Float?    @map("comprehension_score")
   comprehensionAnswers  Json?     @map("comprehension_answers")
   ```
   Run: `make migrate && make generate`

2. Create `packages/frontend/src/components/consent-form/quiz-questions.ts`:
   - Define 2–3 key comprehension questions per treatment type
   - Example for BOTOX:
     ```typescript
     export const quizQuestions: Record<string, Question[]> = {
       BOTOX: [
         {
           id: 'botox-1',
           question: 'What is the expected duration of Botox results?',
           options: ['Permanent', '3-6 months', '1-2 years', '24 hours'],
           correctIndex: 1,
         },
         {
           id: 'botox-2',
           question: 'Which is a common side effect?',
           options: ['Hair loss', 'Temporary bruising at injection site', 'Vision changes', 'None of the above'],
           correctIndex: 1,
         },
       ],
       // ... other treatment types
     };
     ```

3. Create the quiz component:
   - Multiple-choice questions with radio buttons
   - Show correct/incorrect feedback after each answer
   - Calculate score (percentage correct)
   - Allow proceeding even with imperfect score (but flag for physician review)

4. Insert quiz as a new step in the consent form flow:
   - Current: Form > Signature > Review > Submit
   - New: Form > **Comprehension Quiz** > Signature > Review > Submit

5. Include comprehension data in the submit payload:
   ```typescript
   comprehensionScore: 1.0,  // 0.0 to 1.0
   comprehensionAnswers: [{ questionId: 'botox-1', selectedIndex: 1, correct: true }, ...]
   ```

6. Add i18n strings for quiz UI in all locale files.

**Acceptance Criteria**:
- [ ] Quiz step appears between form and signature steps
- [ ] 2–3 questions per treatment type with multiple-choice answers
- [ ] Score calculated and included in submission
- [ ] Patient can proceed even with wrong answers (but score recorded)
- [ ] Comprehension score stored in database
- [ ] `make build` succeeds

**Dependencies**: T-0.1 (migrations)

---

## T-4.6 — Video Patient Education Embeds

**Goal**: Embed procedure-specific educational videos in the consent form to improve patient understanding.

**Context**: medudoc proves video education improves comprehension by 85%. Starting with embedded videos (YouTube/Vimeo) is the fastest path to this feature.

**Files to create**:
- `packages/frontend/src/components/consent-form/education-video.tsx`

**Files to modify**:
- `packages/frontend/src/components/consent-form/consent-form.tsx` — add video section
- `packages/backend/src/settings/settings.dto.ts` — add video URLs to settings
- `packages/backend/prisma/schema.prisma` — add video configuration to PracticeSettings

**Steps**:

1. Add to Prisma schema (PracticeSettings model):
   ```prisma
   educationVideos  Json?  @map("education_videos")  // { BOTOX: "https://...", FILLER: "https://..." }
   ```
   Run: `make migrate && make generate`

2. Update settings DTO:
   ```typescript
   @IsOptional()
   @IsObject()
   educationVideos?: Record<string, string>;
   ```

3. Create video embed component:
   ```tsx
   export function EducationVideo({ url }: { url: string }) {
     // Parse YouTube/Vimeo URLs and render appropriate iframe
     // Track viewing (time spent, completion percentage) via postMessage API
     return (
       <div className="aspect-video rounded-lg overflow-hidden">
         <iframe src={embedUrl} className="w-full h-full" allowFullScreen />
       </div>
     );
   }
   ```

4. In the consent form, display the video before the form fields:
   ```tsx
   {videoUrl && (
     <div className="mb-6">
       <h3>{t('educationVideo')}</h3>
       <EducationVideo url={videoUrl} />
     </div>
   )}
   ```

5. In settings, add a section for video URLs per treatment type.

6. Include the public consent response to carry video URL from practice settings.

**Acceptance Criteria**:
- [ ] Videos display on consent form page when configured
- [ ] YouTube and Vimeo URLs both supported
- [ ] Settings page allows configuring video URL per treatment type
- [ ] Consent form works normally when no video is configured
- [ ] Video renders responsively on mobile
- [ ] `make build` succeeds

**Dependencies**: T-0.1 (migrations)
