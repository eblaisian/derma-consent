# Phase 5 — UI/UX Redesign

> Transform the product's visual identity from default shadcn/ui to a premium, market-leading design.
> Inspired by Linear, Stripe, Notion. Reference: `docs/DESIGN_SYSTEM.md` (1541-line spec).
> Can be executed in parallel with Phases 0–2. No backend changes required.

---

## T-5.1 — Design Token Foundation (globals.css)

**Goal**: Replace the default shadcn/ui gray color palette with the branded Medical Indigo palette, add semantic color tokens, shadow tokens, and animation tokens.

**Context**: The current `globals.css` uses the default shadcn/ui "new-york" theme — pure gray OKLCH values with zero brand color. Every other UI task depends on these tokens being in place first. The redesign introduces a blue-tinted neutral palette (hue 270) that gives the product a distinctive, trustworthy feel without looking "themed."

**Files to modify**:
- `packages/frontend/src/app/globals.css`

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 2 (Color System), Section 6 (Shadow System), Section 7 (Animation), Section 21 (CSS Implementation Reference)

**Steps**:

1. Replace the `:root` block in `globals.css` with the branded light mode tokens. Key changes:
   ```css
   :root {
     --radius: 0.625rem;

     /* Backgrounds — barely blue-white instead of pure white */
     --background: oklch(0.995 0.002 270);
     --foreground: oklch(0.16 0.01 270);
     --card: oklch(1 0 0);
     --card-foreground: oklch(0.145 0 0);
     --popover: oklch(1 0 0);
     --popover-foreground: oklch(0.145 0 0);

     /* Primary — Brand Indigo instead of black */
     --primary: oklch(0.55 0.16 270);
     --primary-foreground: oklch(0.99 0 0);

     /* Secondary — cool gray instead of neutral gray */
     --secondary: oklch(0.97 0.003 270);
     --secondary-foreground: oklch(0.205 0 0);

     /* Muted — blue-tinted */
     --muted: oklch(0.965 0.003 270);
     --muted-foreground: oklch(0.50 0.01 270);

     /* Accent — blue-tinted hover */
     --accent: oklch(0.96 0.008 270);
     --accent-foreground: oklch(0.205 0 0);

     /* Destructive — warm red */
     --destructive: oklch(0.577 0.200 25);

     /* Borders — blue-tinted */
     --border: oklch(0.91 0.005 270);
     --input: oklch(0.91 0.005 270);
     --ring: oklch(0.55 0.16 270);

     /* Charts — brand-aligned 5-color palette */
     --chart-1: oklch(0.55 0.16 270);
     --chart-2: oklch(0.60 0.15 155);
     --chart-3: oklch(0.65 0.14 200);
     --chart-4: oklch(0.70 0.12 80);
     --chart-5: oklch(0.60 0.12 320);

     /* Sidebar — warm off-white */
     --sidebar: oklch(0.98 0.003 270);
     --sidebar-foreground: oklch(0.30 0.01 270);
     --sidebar-primary: oklch(0.55 0.16 270);
     --sidebar-primary-foreground: oklch(0.99 0 0);
     --sidebar-accent: oklch(0.94 0.01 270);
     --sidebar-accent-foreground: oklch(0.16 0.02 270);
     --sidebar-border: oklch(0.93 0.005 270);
     --sidebar-ring: oklch(0.55 0.16 270);

     /* NEW: Extended semantic tokens */
     --background-secondary: oklch(0.975 0.004 270);
     --surface: oklch(0.98 0.003 270);
     --surface-elevated: oklch(1 0 0);
     --foreground-secondary: oklch(0.45 0.01 270);
     --primary-hover: oklch(0.48 0.16 270);
     --primary-active: oklch(0.40 0.14 270);
     --primary-subtle: oklch(0.95 0.03 270);
     --border-subtle: oklch(0.95 0.003 270);
     --destructive-subtle: oklch(0.96 0.02 25);

     /* Status colors */
     --success: oklch(0.60 0.15 155);
     --success-subtle: oklch(0.96 0.03 155);
     --warning: oklch(0.75 0.15 80);
     --warning-subtle: oklch(0.97 0.03 80);
     --info: oklch(0.60 0.14 240);
     --info-subtle: oklch(0.96 0.03 240);

     /* Consent status — domain specific */
     --status-pending: oklch(0.70 0.12 80);
     --status-filled: oklch(0.60 0.14 240);
     --status-signed: oklch(0.55 0.16 270);
     --status-completed: oklch(0.60 0.15 155);
     --status-expired: oklch(0.50 0.01 0);
     --status-revoked: oklch(0.577 0.200 25);

     /* Shadow tokens */
     --shadow-xs: 0 1px 2px oklch(0 0 0 / 0.04);
     --shadow-sm: 0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04);
     --shadow-md: 0 4px 6px oklch(0 0 0 / 0.05), 0 2px 4px oklch(0 0 0 / 0.03);
     --shadow-lg: 0 10px 15px oklch(0 0 0 / 0.05), 0 4px 6px oklch(0 0 0 / 0.03);
     --shadow-xl: 0 20px 25px oklch(0 0 0 / 0.06), 0 8px 10px oklch(0 0 0 / 0.04);
     --shadow-brand: 0 4px 14px oklch(0.55 0.16 270 / 0.15);

     /* Animation tokens */
     --duration-fast: 100ms;
     --duration-normal: 200ms;
     --duration-slow: 300ms;
     --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1.0);
     --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
     --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
   }
   ```

2. Replace the `.dark` block with branded dark mode tokens. Key changes:
   ```css
   .dark {
     /* Deep navy-black — NOT pure black */
     --background: oklch(0.13 0.01 270);
     --foreground: oklch(0.93 0.005 270);
     --card: oklch(0.18 0.01 270);
     --card-foreground: oklch(0.93 0 0);
     --popover: oklch(0.18 0.01 270);
     --popover-foreground: oklch(0.93 0 0);

     /* Primary — lighter in dark mode */
     --primary: oklch(0.65 0.16 270);
     --primary-foreground: oklch(0.13 0 0);

     --secondary: oklch(0.24 0.01 270);
     --secondary-foreground: oklch(0.93 0 0);
     --muted: oklch(0.22 0.01 270);
     --muted-foreground: oklch(0.60 0.005 270);
     --accent: oklch(0.22 0.02 270);
     --accent-foreground: oklch(0.93 0 0);

     --destructive: oklch(0.65 0.20 25);
     --border: oklch(1 0 0 / 10%);
     --input: oklch(1 0 0 / 12%);
     --ring: oklch(0.65 0.16 270);

     --chart-1: oklch(0.65 0.16 270);
     --chart-2: oklch(0.70 0.15 155);
     --chart-3: oklch(0.72 0.14 200);
     --chart-4: oklch(0.78 0.12 80);
     --chart-5: oklch(0.68 0.12 320);

     --sidebar: oklch(0.15 0.01 270);
     --sidebar-foreground: oklch(0.80 0.005 270);
     --sidebar-primary: oklch(0.65 0.16 270);
     --sidebar-primary-foreground: oklch(0.99 0 0);
     --sidebar-accent: oklch(0.22 0.03 270);
     --sidebar-accent-foreground: oklch(0.93 0 0);
     --sidebar-border: oklch(1 0 0 / 8%);
     --sidebar-ring: oklch(0.55 0.16 270);

     /* Extended tokens — dark variants */
     --background-secondary: oklch(0.16 0.01 270);
     --surface: oklch(0.15 0.01 270);
     --surface-elevated: oklch(0.20 0.01 270);
     --foreground-secondary: oklch(0.65 0.005 270);
     --primary-hover: oklch(0.70 0.16 270);
     --primary-active: oklch(0.58 0.16 270);
     --primary-subtle: oklch(0.22 0.06 270);
     --border-subtle: oklch(1 0 0 / 6%);
     --destructive-subtle: oklch(0.22 0.05 25);

     --success: oklch(0.70 0.15 155);
     --success-subtle: oklch(0.20 0.04 155);
     --warning: oklch(0.80 0.14 80);
     --warning-subtle: oklch(0.22 0.04 80);
     --info: oklch(0.68 0.14 240);
     --info-subtle: oklch(0.20 0.04 240);

     --status-pending: oklch(0.78 0.12 80);
     --status-filled: oklch(0.68 0.14 240);
     --status-signed: oklch(0.65 0.16 270);
     --status-completed: oklch(0.70 0.15 155);
     --status-expired: oklch(0.55 0.01 0);
     --status-revoked: oklch(0.65 0.20 25);

     --shadow-xs: 0 1px 2px oklch(0 0 0 / 0.15);
     --shadow-sm: 0 1px 3px oklch(0 0 0 / 0.20), 0 1px 2px oklch(0 0 0 / 0.15);
     --shadow-md: 0 4px 6px oklch(0 0 0 / 0.20), 0 2px 4px oklch(0 0 0 / 0.15);
     --shadow-lg: 0 10px 15px oklch(0 0 0 / 0.25), 0 4px 6px oklch(0 0 0 / 0.15);
     --shadow-xl: 0 20px 25px oklch(0 0 0 / 0.30), 0 8px 10px oklch(0 0 0 / 0.20);
     --shadow-brand: 0 4px 14px oklch(0.65 0.16 270 / 0.25);

     --duration-fast: 100ms;
     --duration-normal: 200ms;
     --duration-slow: 300ms;
     --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1.0);
     --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
     --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
   }
   ```

3. Add the new tokens to the `@theme inline` block so Tailwind can use them as utility classes:
   ```css
   @theme inline {
     /* Existing tokens remain */

     /* NEW: Extended color tokens for Tailwind */
     --color-background-secondary: var(--background-secondary);
     --color-surface: var(--surface);
     --color-surface-elevated: var(--surface-elevated);
     --color-foreground-secondary: var(--foreground-secondary);
     --color-primary-hover: var(--primary-hover);
     --color-primary-active: var(--primary-active);
     --color-primary-subtle: var(--primary-subtle);
     --color-border-subtle: var(--border-subtle);
     --color-success: var(--success);
     --color-success-subtle: var(--success-subtle);
     --color-warning: var(--warning);
     --color-warning-subtle: var(--warning-subtle);
     --color-info: var(--info);
     --color-info-subtle: var(--info-subtle);
     --color-destructive-subtle: var(--destructive-subtle);
     --color-status-pending: var(--status-pending);
     --color-status-filled: var(--status-filled);
     --color-status-signed: var(--status-signed);
     --color-status-completed: var(--status-completed);
     --color-status-expired: var(--status-expired);
     --color-status-revoked: var(--status-revoked);
   }
   ```

4. Remove the duplicate `@apply` rules in the `@layer base` block (currently each rule appears twice):
   ```css
   @layer base {
     * {
       @apply border-border outline-ring/50;
     }
     body {
       @apply bg-background text-foreground;
     }
   }
   ```

**Acceptance Criteria**:
- [ ] `:root` block uses brand indigo (hue 270) as `--primary` instead of black
- [ ] All neutral grays have a subtle blue tint (hue 270) instead of pure 0
- [ ] `.dark` block uses deep navy (not pure black) backgrounds
- [ ] New semantic tokens added: `--success`, `--warning`, `--info`, `--status-*`, `--shadow-*`, `--duration-*`
- [ ] `@theme inline` block exposes all new tokens for Tailwind utility class usage
- [ ] No duplicate `@apply` rules in `@layer base`
- [ ] `make build` succeeds with no CSS errors
- [ ] Both light and dark mode render without broken colors

**Dependencies**: None — this is the foundation for all other T-5.x tasks.

---

## T-5.2 — Sidebar Redesign

**Goal**: Transform the sidebar from a basic nav list into a polished, Linear-inspired sidebar with section grouping, vault status footer, user profile footer, and collapsible behavior.

**Context**: The current sidebar (`sidebar.tsx`) is a simple list of navigation links. The redesigned sidebar should match the design system spec (Section 9): 260px width, grouped sections with uppercase labels, a vault status indicator in the footer, and user profile at the bottom. This is the most visible UI change and sets the tone for the entire app.

**Files to modify**:
- `packages/frontend/src/components/layout/sidebar.tsx`
- `packages/frontend/src/components/layout/app-shell.tsx`

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 9 (Navigation & Sidebar)
- `packages/frontend/src/hooks/use-vault.ts` — vault lock/unlock state

**Steps**:

1. Redesign `sidebar.tsx` structure to match this layout:
   ```
   +-------------------------------------------+
   | [Logo] DermaConsent         [Collapse <<] |
   +-------------------------------------------+
   |                                           |
   | OVERVIEW                                  |
   |   [BarChart3]  Dashboard                  |
   |   [FileSignature] Consent Forms           |
   |   [User]       Patients                   |
   |                                           |
   | MANAGEMENT                                |
   |   [Users]      Team                       |
   |   [ScrollText] Audit Trail                |
   |   [BarChart3]  Analytics                  |
   |                                           |
   | SYSTEM                                    |
   |   [CreditCard] Billing                    |
   |   [Settings]   Settings                   |
   |                                           |
   +-------------------------------------------+
   | [Vault Status: Locked/Unlocked indicator] |
   +-------------------------------------------+
   | [Avatar] Dr. Name             [LogOut]    |
   +-------------------------------------------+
   ```

2. Apply sidebar item styling:
   - Height: 36px, padding: 0 12px, border-radius: 6px, margin: 0 8px
   - Font: 14px, weight 500, gap 10px between icon and label
   - Default: transparent background, muted icon color
   - Hover: `bg-sidebar-accent` background, darker icon/text
   - Active: `bg-sidebar-accent` background, `text-sidebar-primary` (brand indigo) for icon and text
   - Transition: `background-color 100ms ease`

3. Add section labels with uppercase styling:
   - Font: 11px, weight 600, uppercase, letter-spacing 0.05em
   - Color: `text-sidebar-muted` (add to CSS if not present via `--sidebar-muted: oklch(0.50 0.01 270)`)
   - Padding: 20px top, 12px right, 6px bottom, 20px left

4. Create vault status footer:
   - When locked: Lock icon (amber-500), "Vault Locked" text, "Click to unlock" subtitle
   - When unlocked: Shield icon (green-500), "Vault Active" text, "Patient data accessible" subtitle
   - Background: slightly different from sidebar background
   - Border-top: `1px solid var(--sidebar-border)`

5. Create user profile footer:
   - Show user avatar (first letter circle if no image) + name
   - Logout icon button on the right
   - Border-top: `1px solid var(--sidebar-border)`

6. Update `app-shell.tsx`:
   - Remove vault status display from the top header (it moves to sidebar footer)
   - Remove logout button from header (it moves to sidebar user footer)
   - Header becomes: left side = page breadcrumb, right side = language switcher
   - Keep mobile hamburger menu with updated mobile nav matching sidebar structure

7. Ensure role-based filtering still works:
   - Items must respect `allowedRoles` per the current implementation
   - Team, Audit, Analytics may be hidden for non-admin roles

**Acceptance Criteria**:
- [ ] Sidebar is 260px wide with warm off-white background
- [ ] Navigation items grouped under "OVERVIEW", "MANAGEMENT", "SYSTEM" section labels
- [ ] Active nav item shows brand indigo color for icon and text
- [ ] Hover state shows subtle background change with 100ms transition
- [ ] Vault status indicator in sidebar footer (locked = amber, unlocked = green)
- [ ] User profile with name and logout button in bottom footer
- [ ] Mobile hamburger menu still works with updated layout
- [ ] Role-based item visibility preserved
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (design tokens)

---

## T-5.3 — Status Badge System

**Goal**: Create a consistent, design-system-compliant status badge component with colored dots, proper semantic backgrounds, and all consent lifecycle states.

**Context**: Status badges are displayed throughout the app (consent tables, detail views, patient histories). The current Badge component from shadcn/ui uses basic variants (default, destructive, outline, secondary). The redesign adds domain-specific consent status badges with a dot + label pattern that provides instant visual scanning.

**Files to create**:
- `packages/frontend/src/components/ui/status-badge.tsx`

**Files to modify**:
- `packages/frontend/src/components/dashboard/consent-table.tsx` — use new status badges

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 13 (Status Badges)
- `packages/frontend/src/components/ui/badge.tsx` — existing shadcn badge

**Steps**:

1. Create `packages/frontend/src/components/ui/status-badge.tsx`:
   ```tsx
   import { cn } from '@/lib/utils';

   type ConsentStatus = 'PENDING' | 'FILLED' | 'SIGNED' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';

   const statusConfig: Record<ConsentStatus, { bg: string; text: string; dot: string; label: string }> = {
     PENDING:   { bg: 'bg-warning-subtle',     text: 'text-status-pending',   dot: 'bg-status-pending',   label: 'Pending' },
     FILLED:    { bg: 'bg-info-subtle',         text: 'text-status-filled',    dot: 'bg-status-filled',    label: 'Filled' },
     SIGNED:    { bg: 'bg-primary-subtle',      text: 'text-status-signed',    dot: 'bg-status-signed',    label: 'Signed' },
     PAID:      { bg: 'bg-success-subtle',      text: 'text-status-completed', dot: 'bg-status-completed', label: 'Paid' },
     COMPLETED: { bg: 'bg-success-subtle',      text: 'text-status-completed', dot: 'bg-status-completed', label: 'Completed' },
     EXPIRED:   { bg: 'bg-muted',               text: 'text-status-expired',   dot: 'bg-status-expired',   label: 'Expired' },
     REVOKED:   { bg: 'bg-destructive-subtle',  text: 'text-status-revoked',   dot: 'bg-status-revoked',   label: 'Revoked' },
   };

   export function StatusBadge({ status, className }: { status: ConsentStatus; className?: string }) {
     const config = statusConfig[status];
     return (
       <span className={cn(
         'inline-flex items-center gap-1.5 h-[22px] px-2 text-xs font-medium rounded-full whitespace-nowrap',
         config.bg, config.text, className
       )}>
         <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
         {config.label}
       </span>
     );
   }
   ```

2. Support i18n labels by accepting an optional `label` prop override or using translation keys.

3. Update `consent-table.tsx` to replace current badge usage with `<StatusBadge status={consent.status} />`.

4. Also create role badges and plan badges as variants:
   ```tsx
   type RoleBadge = 'ADMIN' | 'ARZT' | 'EMPFANG';
   type PlanBadge = 'FREE_TRIAL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
   ```
   - Role badges: outline style, neutral colors
   - Plan badges: brand-tinted for Professional/Enterprise, neutral for Starter/Trial

**Acceptance Criteria**:
- [ ] `StatusBadge` component renders a pill with colored dot + label
- [ ] All 7 consent states mapped to correct colors from design tokens
- [ ] Dot provides visual scanning even for colorblind users (background tint reinforces)
- [ ] Consent table uses new StatusBadge component
- [ ] Colors reference CSS custom properties (not hardcoded)
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (design tokens)

---

## T-5.4 — Card System Upgrade

**Goal**: Enhance the card component with new variants (stat card, interactive card, highlighted card, encrypted card) and update all dashboard cards to use the design system's card anatomy.

**Context**: The current card component is the basic shadcn/ui card. The redesign adds domain-specific variants that appear throughout the dashboard, especially stat cards for analytics and encrypted card indicators for patient data.

**Files to create**:
- `packages/frontend/src/components/ui/stat-card.tsx`

**Files to modify**:
- `packages/frontend/src/app/(authenticated)/dashboard/page.tsx` — add stat cards row
- `packages/frontend/src/app/(authenticated)/analytics/page.tsx` — use stat cards

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 11 (Cards)
- `packages/frontend/src/components/ui/card.tsx`

**Steps**:

1. Create `packages/frontend/src/components/ui/stat-card.tsx`:
   ```tsx
   import { Card, CardContent } from '@/components/ui/card';
   import { cn } from '@/lib/utils';
   import { TrendingUp, TrendingDown } from 'lucide-react';

   interface StatCardProps {
     title: string;
     value: string | number;
     subtitle?: string;
     trend?: { value: number; isPositive: boolean };
     icon?: React.ReactNode;
     className?: string;
   }

   export function StatCard({ title, value, subtitle, trend, icon, className }: StatCardProps) {
     return (
       <Card className={cn('relative overflow-hidden', className)}>
         <CardContent className="p-5">
           <div className="flex items-center justify-between">
             <span className="text-sm text-foreground-secondary">{title}</span>
             {trend && (
               <span className={cn(
                 'inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-1.5 py-0.5',
                 trend.isPositive
                   ? 'text-success bg-success-subtle'
                   : 'text-destructive bg-destructive-subtle'
               )}>
                 {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                 {Math.abs(trend.value)}%
               </span>
             )}
           </div>
           <div className="mt-2 text-[28px] font-bold leading-tight tracking-tight">{value}</div>
           {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
         </CardContent>
       </Card>
     );
   }
   ```

2. Add stat card row to the dashboard page (above the tabs):
   - "Total Consents" — count of all consent forms
   - "Pending" — count of PENDING status
   - "Completed This Month" — count of COMPLETED in current month
   - "Patients" — total patient count
   These values come from the existing SWR data already fetched on the dashboard.

3. Ensure all cards in the app use the consistent card anatomy:
   - `shadow-xs` at rest (via `shadow-[var(--shadow-xs)]` or a utility class)
   - 1px `border-border` border
   - `rounded-xl` (10px) radius

**Acceptance Criteria**:
- [ ] StatCard component displays title, large value, optional subtitle and trend
- [ ] Dashboard shows 4 stat cards in a responsive grid above the main content
- [ ] Trend badges show green (positive) or red (negative) with arrow icons
- [ ] Cards use design token colors (not hardcoded)
- [ ] Responsive: 2-column on tablet, 4-column on desktop, 1-column on mobile
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (design tokens)

---

## T-5.5 — Table System Upgrade

**Goal**: Upgrade the consent table with Stripe-inspired styling: row hover highlights, sticky header, improved column layout, and the new StatusBadge.

**Context**: The consent table is the primary data view. It currently uses the basic shadcn/ui table. The redesign adds: row hover with subtle background change, sticky header with shadow on scroll, better column alignment, relative time display for dates, and an actions dropdown menu.

**Files to modify**:
- `packages/frontend/src/components/dashboard/consent-table.tsx`

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 12 (Tables & Lists)
- `packages/frontend/src/components/ui/table.tsx`

**Steps**:

1. Update table header styling:
   - Font size: 12px, weight 600, color `text-foreground-secondary`
   - NOT uppercase (modern pattern)
   - No letter-spacing increase
   - Padding: 10px 12px

2. Update table row styling:
   - Border bottom: `border-border-subtle`
   - Hover: `bg-accent` (subtle blue-tint)
   - Transition: `background-color 100ms ease`
   - Padding: 10px 12px per cell

3. Update consent table columns:
   - Column order: Consent ID (monospace, muted), Patient Name (weight 500), Treatment Type (normal), Status (StatusBadge), Date (relative with absolute tooltip), Actions (ghost icon button)
   - Consent ID: use `font-mono text-foreground-secondary text-sm`
   - Date: show relative format (e.g., "2 hours ago") with a `title` attribute showing the absolute date

4. Add sticky header behavior:
   - Table header gets `sticky top-0 bg-background z-10`
   - On scroll, add subtle shadow below header

5. Replace empty table state:
   - If no consent forms exist, replace the entire table body with a centered empty state:
   - 64px Lucide icon (`FileSignature`), muted color
   - Heading: "No consent forms yet"
   - Subtitle: "Create your first consent form and send it to a patient."
   - Primary CTA button: "Create Consent Form"

**Acceptance Criteria**:
- [ ] Table headers are 12px semibold, not uppercase
- [ ] Row hover shows subtle background change
- [ ] Consent ID displayed in monospace font
- [ ] Patient name is bolder than other text
- [ ] StatusBadge component used for status column
- [ ] Dates show relative format with absolute tooltip
- [ ] Empty state replaces entire table when no data
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (design tokens), T-5.3 (status badges)

---

## T-5.6 — Consent Form (Patient-Facing) Redesign

**Goal**: Redesign the public consent form (`/consent/[token]`) to be a clean, focused, single-column reading experience with progress bar, security badges, and optimized readability.

**Context**: This is the most critical patient touchpoint. Patients access it without login. It must be accessible to elderly patients, render well on tablets in exam rooms, and communicate trust. The current form works functionally but uses default styling.

**Files to modify**:
- `packages/frontend/src/components/consent-form/consent-form.tsx`
- `packages/frontend/src/app/consent/[token]/page.tsx`

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 16 (Consent Form Presentation), Section 19 (Tablet Optimization)
- `packages/frontend/src/components/signature-pad/signature-pad.tsx`

**Steps**:

1. Update the consent form page layout:
   - Center the form with `max-w-[680px] mx-auto` for optimal reading width
   - Add horizontal padding: 16px on mobile, 24px on tablet, 0 on desktop (already centered)
   - No sidebar, no dashboard navigation — single-column focused layout

2. Add a progress bar at the top:
   - Full-width, 4px tall, `bg-muted` track, `bg-primary` fill
   - Smooth width transition: `transition-[width] 300ms ease-out`
   - Show "Step X of Y" text above the bar
   - Do NOT use step dots — use a continuous progress bar

3. Add a minimal header:
   - Practice logo (if uploaded) + "DermaConsent" text
   - Language switcher on the right: Globe icon + language code dropdown
   - 1px bottom border

4. Update consent text typography:
   - All body text: 16px minimum (body-lg)
   - Line height: 1.6 for consent body text
   - Headings: h2 = 24px semibold, h3 = 18px semibold with 24px top margin
   - Legal sections: 32px vertical space between them with subtle `<Separator />`

5. Update acknowledgment checkboxes:
   - Checkbox size: 20px minimum
   - Touch target: 44px including padding
   - Clear label text at 16px

6. Add security badge below the form content:
   - Shield icon + "Your data is encrypted end-to-end"
   - Subtle gray text, centered
   - Always visible on every step

7. Update navigation buttons:
   - "Back" on the left (secondary/outline button)
   - "Continue" on the right (primary button)
   - Buttons at 48px height on tablet for touch targets
   - Sticky at bottom on mobile (not scrolling away)

8. Update signature canvas:
   - 2px dashed border in `--border` color
   - When signing (active): solid border in `--primary`
   - Height: 200px desktop, 240px tablet
   - Clear "Sign here" placeholder text centered in canvas
   - `touch-action: none` to prevent scroll while signing

**Acceptance Criteria**:
- [ ] Consent form centered at 680px max-width
- [ ] Progress bar (not dots) shows step progress with smooth animation
- [ ] All consent text body is minimum 16px with 1.6 line height
- [ ] Security badge ("End-to-end encrypted") visible on every step
- [ ] Navigation buttons are 48px height on tablet
- [ ] Signature canvas has dashed border that becomes solid + brand color when active
- [ ] Language switcher in header works
- [ ] No sidebar or dashboard navigation visible
- [ ] Renders well on iPad-sized screens (1024px)
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (design tokens)

---

## T-5.7 — Empty States & Loading Skeletons

**Goal**: Replace all empty data states and loading spinners with polished empty state components and skeleton loading screens.

**Context**: Currently, empty states show minimal text or nothing. Loading states use CSS border spinners. The redesign uses centered empty states with icons and CTAs (Section 15) and shimmer skeleton screens instead of spinners (modern SaaS standard).

**Files to create**:
- `packages/frontend/src/components/ui/empty-state.tsx`
- `packages/frontend/src/components/ui/skeleton.tsx` (if not already present from shadcn)

**Files to modify**:
- `packages/frontend/src/components/dashboard/consent-table.tsx` — empty state
- `packages/frontend/src/app/(authenticated)/patients/page.tsx` — empty state
- `packages/frontend/src/app/(authenticated)/dashboard/page.tsx` — loading skeleton
- `packages/frontend/src/app/(authenticated)/layout.tsx` — replace spinner with skeleton

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 15 (Empty States)

**Steps**:

1. Create `packages/frontend/src/components/ui/empty-state.tsx`:
   ```tsx
   import { cn } from '@/lib/utils';
   import { LucideIcon } from 'lucide-react';
   import { Button } from '@/components/ui/button';

   interface EmptyStateProps {
     icon: LucideIcon;
     title: string;
     description?: string;
     actionLabel?: string;
     onAction?: () => void;
     className?: string;
   }

   export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
     return (
       <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
         <Icon className="h-16 w-16 text-muted-foreground mb-4" strokeWidth={1.5} />
         <h3 className="text-lg font-semibold">{title}</h3>
         {description && (
           <p className="mt-2 text-sm text-foreground-secondary text-center max-w-[360px]">{description}</p>
         )}
         {actionLabel && onAction && (
           <Button className="mt-6" onClick={onAction}>{actionLabel}</Button>
         )}
       </div>
     );
   }
   ```

2. Create skeleton screen component (if shadcn skeleton not already installed):
   - Shimmer animation: `background-size 200%`, keyframe slides left to right over 2s
   - Rounded corners matching target content shape
   - Use for: table rows, stat cards, form fields during loading

3. Replace loading spinners in:
   - `(authenticated)/layout.tsx`: Replace the border spinner with a full-page skeleton (sidebar skeleton + content area skeleton)
   - `dashboard/page.tsx`: Replace the loading spinner with stat card skeletons + table row skeletons

4. Add empty states to:
   - Consent table: `FileSignature` icon + "No consent forms yet" + "Create Consent Form" button
   - Patients page: `User` icon + "No patients yet" + "Patients appear automatically when consent forms are submitted"
   - Audit page: `ScrollText` icon + "No audit events yet"
   - Analytics page: `BarChart3` icon + "Not enough data" + "Analytics will appear once consent forms are submitted"

**Acceptance Criteria**:
- [ ] EmptyState component renders icon + title + optional description + optional CTA
- [ ] All empty data views use EmptyState instead of plain text
- [ ] Loading states use skeleton screens instead of CSS spinners
- [ ] Skeleton animations use the shimmer pattern (2s loop)
- [ ] Empty state icons are 64px, muted color, strokeWidth 1.5
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (design tokens)

---

## T-5.8 — Trust & Security Visual Language

**Goal**: Add visual trust signals throughout the app — encryption badges on decrypted fields, vault status indicator in sidebar, GDPR compliance footer on patient-facing pages.

**Context**: Zero-knowledge encryption is DermaConsent's key differentiator. But users can't see encryption — it must be communicated visually. The design system specifies a consistent security visual language (Section 18) using shield icons, green for active protection, and amber for attention needed.

**Files to create**:
- `packages/frontend/src/components/ui/encryption-badge.tsx`

**Files to modify**:
- `packages/frontend/src/components/dashboard/decrypted-form-viewer.tsx` — add shield icons next to decrypted fields
- `packages/frontend/src/app/consent/[token]/page.tsx` — add GDPR compliance footer
- `packages/frontend/src/components/dashboard/vault-panel.tsx` — improved vault status UI

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 18 (Trust & Security Visual Language)

**Steps**:

1. Create `packages/frontend/src/components/ui/encryption-badge.tsx`:
   ```tsx
   import { Shield } from 'lucide-react';
   import { cn } from '@/lib/utils';

   export function EncryptionBadge({ className }: { className?: string }) {
     return (
       <span className={cn(
         'inline-flex items-center gap-1 text-xs font-medium text-success bg-success-subtle px-1.5 py-0.5 rounded-full',
         className
       )}>
         <Shield className="h-3 w-3" />
         Encrypted
       </span>
     );
   }
   ```

2. In `decrypted-form-viewer.tsx`, add a small green shield icon (12px) next to each decrypted field value to communicate "this was encrypted and has been decrypted client-side."

3. In the consent form public page, add a footer with:
   - "DSGVO/GDPR-konform" badge
   - "End-to-end encrypted" badge
   - "Data stored in EU" badge
   - Subtle gray text, centered below the form content

4. Improve the vault panel UI:
   - When locked: warm amber background card, Lock icon, clear "Enter master password" prompt
   - When unlocked: subtle green border-left accent on the vault card, Shield icon, "Vault Active" status
   - Smooth transition between states

5. Replace hardcoded `green-500` and `amber-500` colors in `app-shell.tsx` with semantic tokens:
   - Unlocked: `text-success` instead of `text-green-500`
   - Locked: `text-warning` instead of `text-amber-500`

**Acceptance Criteria**:
- [ ] EncryptionBadge component shows green shield + "Encrypted" pill
- [ ] Decrypted fields in form viewer show shield icon
- [ ] Consent form public page has GDPR compliance footer
- [ ] Vault panel has distinct locked (amber) and unlocked (green) visual states
- [ ] No hardcoded color classes (green-500, amber-500) remain — replaced with semantic tokens
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (design tokens), T-5.2 (sidebar with vault footer)

---

## T-5.9 — Animation & Micro-Interactions

**Goal**: Add subtle, purposeful animations to interactive elements: button press feedback, dropdown entrances, page transitions, card hover lifts, and toast notifications.

**Context**: Currently, the app has minimal animation. The design system specifies snappy, Raycast-inspired micro-interactions (Section 7) that make the app feel responsive without delaying workflows. All animations respect `prefers-reduced-motion`.

**Files to modify**:
- `packages/frontend/src/app/globals.css` — add animation utilities and `prefers-reduced-motion` handling
- `packages/frontend/src/components/ui/button.tsx` — add press feedback
- `packages/frontend/src/components/ui/card.tsx` — add hover elevation

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 7 (Animation & Transitions)

**Steps**:

1. Add to `globals.css` after the `@layer base` block:
   ```css
   @layer utilities {
     .transition-default {
       transition-property: background-color, border-color, color, box-shadow;
       transition-duration: var(--duration-fast);
       transition-timing-function: var(--ease-default);
     }

     .transition-elevation {
       transition-property: box-shadow, transform;
       transition-duration: var(--duration-normal);
       transition-timing-function: var(--ease-default);
     }
   }

   /* Respect reduced motion */
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

2. Update `button.tsx` — add active state press feedback:
   - Add `active:scale-[0.98]` to the button base styles
   - Add `transition-colors duration-[var(--duration-fast)]` to all variants

3. Update `card.tsx` — add hover elevation for interactive cards:
   - Do NOT add hover to all cards by default
   - Add a `data-interactive` attribute pattern: `[data-interactive]:hover:shadow-sm [data-interactive]:hover:-translate-y-px`

4. Ensure skeleton animation is defined:
   ```css
   @keyframes skeleton-pulse {
     0% { background-position: 200% 0; }
     100% { background-position: -200% 0; }
   }
   ```

**Acceptance Criteria**:
- [ ] Button press shows subtle scale-down (0.98)
- [ ] Card hover shows shadow-sm elevation lift (only for interactive cards)
- [ ] Transitions use CSS custom property durations (not hardcoded ms values)
- [ ] `prefers-reduced-motion` media query disables all animations
- [ ] No animation exceeds 500ms for interactive elements
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (design tokens)

---

## T-5.10 — Dark Mode Implementation

**Goal**: Implement a working dark mode toggle with system preference detection, localStorage persistence, and no flash of wrong theme on page load.

**Context**: The design tokens (T-5.1) already define dark mode colors in the `.dark` class. This task adds the toggle mechanism, the theme provider, and the inline script to prevent theme flash. Mirrors the implementation planned in T-4.2 but uses the branded dark palette from T-5.1.

**Files to create**:
- `packages/frontend/src/components/theme-toggle.tsx`
- `packages/frontend/src/hooks/use-theme.ts`

**Files to modify**:
- `packages/frontend/src/app/layout.tsx` — add theme flash prevention script and `suppressHydrationWarning`
- `packages/frontend/src/components/layout/app-shell.tsx` — add theme toggle to header

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 20 (Dark Mode & Light Mode)
- `docs/plan/phase-4-post-launch.md` — T-4.2 (Dark Mode) for implementation reference

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
   - Button that cycles: system → light → dark → system
   - Icons: Monitor (system), Sun (light), Moon (dark) from lucide-react
   - Ghost button variant, icon-only, 32px size

3. Add theme flash prevention to `layout.tsx`:
   - Add `suppressHydrationWarning` to `<html>` tag
   - Add inline `<script>` that checks localStorage and applies `.dark` class before React hydrates

4. Add the theme toggle to the app shell header, next to the language switcher.

**Acceptance Criteria**:
- [ ] Three theme modes work: light, dark, system
- [ ] Theme toggle visible in the header area
- [ ] Preference persists across page reloads (localStorage)
- [ ] No flash of wrong theme on page load (inline script executes before paint)
- [ ] Dark mode uses deep navy backgrounds (not pure black)
- [ ] All pages are readable in both modes (no invisible text)
- [ ] Consent form (public page) also respects theme
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (dark mode tokens must be in globals.css)

---

## T-5.11 — Dashboard Page Redesign

**Goal**: Redesign the main dashboard page with stat cards, improved consent table layout, and a more professional page structure.

**Context**: The dashboard is the first page users see after login. Currently it uses a basic tabs layout (Consents / Vault). The redesign adds stat cards at the top, improves the content layout, and moves vault management to the sidebar footer (T-5.2).

**Files to modify**:
- `packages/frontend/src/app/(authenticated)/dashboard/page.tsx`

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 11 (Cards), Section 12 (Tables)

**Steps**:

1. Add a page header section:
   - Left: "Dashboard" title (h1, 28px, semibold) + "Welcome back, Dr. Schmidt" subtitle
   - Right: "New Consent" primary button with `+` icon

2. Add stat cards row (4 cards in a responsive grid):
   - Use the `StatCard` component from T-5.4
   - Cards: "Total Consents", "Pending", "Completed This Month", "Total Patients"
   - Calculate values from existing SWR data

3. Replace the tabs layout:
   - Remove the Tabs component
   - Show the consent table directly below the stat cards
   - Move vault panel to sidebar (handled in T-5.2) or keep as a collapsible section if vault is locked and needs attention

4. Add a section header above the consent table:
   - "Recent Consent Forms" with a "View All" link on the right
   - Filter/search bar (optional, can be placeholder for future)

5. Show only the most recent 10 consent forms on dashboard, with a "View all consents" link.

**Acceptance Criteria**:
- [ ] Dashboard has greeting message with user's name
- [ ] 4 stat cards displayed in responsive grid
- [ ] Consent table shown directly (no tabs wrapping)
- [ ] "New Consent" button prominently placed in header
- [ ] Vault status handled by sidebar, not taking dashboard space
- [ ] Page structure follows the design system hierarchy (h1 page title, stat cards, section headers, table)
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (tokens), T-5.2 (sidebar vault), T-5.4 (stat cards), T-5.5 (table)

---

## T-5.12 — Icon Consistency & Lucide Configuration

**Goal**: Standardize all Lucide icon usage across the app with consistent sizing and stroke width per the design system.

**Context**: The design system specifies 20px icons for navigation, 16px for inline/buttons, and 1.75 stroke width. Currently, icon sizes vary across components. This is a sweep-and-fix task.

**Files to modify**:
- `packages/frontend/src/app/globals.css` — add Lucide stroke width rule
- `packages/frontend/src/components/layout/sidebar.tsx` — standardize icon sizes
- `packages/frontend/src/components/layout/app-shell.tsx` — standardize icon sizes

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 8 (Icons)

**Steps**:

1. Add to `globals.css`:
   ```css
   .lucide {
     stroke-width: 1.75;
   }
   .text-xs .lucide,
   .text-sm .lucide {
     stroke-width: 1.5;
   }
   ```

2. Standardize icon mapping to match design system (Section 8):
   - Consent form: `FileSignature`
   - Patient: `User`
   - Vault locked: `Lock`
   - Vault unlocked: `Unlock` (or `Shield` for active)
   - Practice: `Building2`
   - Team: `Users`
   - Analytics: `BarChart3`
   - Billing: `CreditCard`
   - Settings: `Settings`
   - Audit trail: `ScrollText`
   - Language: `Globe`

3. Ensure sidebar nav icons are 20px and inline/button icons are 16px.

**Acceptance Criteria**:
- [ ] Global stroke-width set to 1.75 for Lucide icons
- [ ] Smaller contexts (text-xs, text-sm) use 1.5 stroke width
- [ ] Sidebar nav icons are 20px (`h-5 w-5`)
- [ ] Button/inline icons are 16px (`h-4 w-4`)
- [ ] All domain icons match the mapping in the design system
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (globals.css updated)

---

## T-5.13 — Typography & Spacing Audit

**Goal**: Audit all pages and components, replacing inconsistent font sizes, weights, and spacing with design system tokens.

**Context**: This is a sweep task that catches all remaining places where typography or spacing diverges from the design system (Section 3 and 4). It's the final polish pass that makes the entire app feel cohesive.

**Files to modify**:
- All page files under `packages/frontend/src/app/(authenticated)/`
- `packages/frontend/src/components/dashboard/*.tsx`
- `packages/frontend/src/components/consent-form/*.tsx`

**Files to reference**:
- `docs/DESIGN_SYSTEM.md` — Section 3 (Typography), Section 4 (Spacing)

**Steps**:

1. Page titles: Ensure all pages use `text-[28px] font-semibold leading-tight tracking-[-0.01em]` for h1 page titles.

2. Section headings: Use `text-xl font-semibold` (20px) for card titles and section headers.

3. Body text: Default `text-sm` (14px) for UI text, `text-base` (16px) for consent form content.

4. Secondary text: Use `text-foreground-secondary` (the new semantic token) instead of `text-muted-foreground` where text is secondary information (not placeholder-level muted).

5. Spacing between sections: Ensure 32-40px (`space-y-8` or `space-y-10`) between major page sections.

6. Card internal padding: Ensure consistent 24px (`p-6`) across all cards.

7. Table number alignment: Add `font-variant-numeric: tabular-nums` to cells with numbers (IDs, counts, financial amounts).

8. Letter spacing: Add `-tracking-tight` (letter-spacing: -0.01em) to h1 and h2 headings.

**Acceptance Criteria**:
- [ ] All page titles use consistent 28px semibold with tight tracking
- [ ] All section headings use consistent 20px semibold
- [ ] Body text is 14px for UI, 16px for consent content
- [ ] Secondary text uses `text-foreground-secondary` consistently
- [ ] Number displays use `tabular-nums` font variant
- [ ] Card padding is consistent (24px)
- [ ] Page section spacing is 32-40px
- [ ] `make build` succeeds

**Dependencies**: T-5.1 (design tokens with foreground-secondary)
