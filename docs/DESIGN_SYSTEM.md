# DermaConsent Design System Specification

> A comprehensive design system for a premium medical consent management SaaS platform.
> Informed by research into Linear, Stripe, Notion, Vercel, Raycast, and Mercury,
> plus 2025-2026 SaaS design trends, healthcare UX best practices, and German market preferences.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing System](#4-spacing-system)
5. [Border Radius](#5-border-radius)
6. [Shadow System](#6-shadow-system)
7. [Animation & Transitions](#7-animation--transitions)
8. [Icons](#8-icons)
9. [Navigation & Sidebar](#9-navigation--sidebar)
10. [Buttons](#10-buttons)
11. [Cards](#11-cards)
12. [Tables & Lists](#12-tables--lists)
13. [Status Badges](#13-status-badges)
14. [Forms & Inputs](#14-forms--inputs)
15. [Empty States](#15-empty-states)
16. [Consent Form Presentation](#16-consent-form-presentation)
17. [Medical Photo Presentation](#17-medical-photo-presentation)
18. [Trust & Security Visual Language](#18-trust--security-visual-language)
19. [Tablet & Exam Room Optimization](#19-tablet--exam-room-optimization)
20. [Dark Mode & Light Mode](#20-dark-mode--light-mode)
21. [CSS Implementation Reference](#21-css-implementation-reference)

---

## 1. Design Philosophy

### Core Principles

**Clinical Precision, Human Warmth.** The interface must feel like a clean, modern medical
instrument -- precise, reliable, and calming -- while avoiding the cold sterility that makes
software feel impersonal.

**Informed by the best, tailored for medicine:**

| Product    | What We Take                                                   |
|------------|----------------------------------------------------------------|
| Linear     | Dark-mode-first thinking, keyboard-first interaction, ultra-clean information density |
| Stripe     | Accessible color scales, trust through visual clarity, premium data presentation |
| Notion     | Content-first layout philosophy, warm neutrals, gentle sidebar |
| Vercel     | Geist typography precision, monochrome-with-accent discipline  |
| Raycast    | Snappy micro-interactions, command palette patterns, focus mode |
| Mercury    | Financial-grade trust signals, calm purple accents, sophisticated restraint |

**German Market Alignment:**
- Information density valued over whitespace-heavy "airy" layouts
- Clear structures, transparent processes, predictable interactions
- Subtle, professional color schemes -- blue, gray, white dominate
- Bright colors used sparingly and only for CTAs and status
- Restraint, structure, and visual calmness over playful elements
- Trust badges, certifications, and detailed copy are expected

**Healthcare-Specific:**
- WCAG AA minimum (AAA where possible) -- mandatory by May 2026 for healthcare
- Minimum 4.5:1 contrast ratio for all text
- No decorative elements that could be confused with clinical indicators
- Calm, non-alarming color usage (avoid gratuitous red)
- Clear visual hierarchy for consent/legal content

---

## 2. Color System

### Color Space

Use **OKLCH** as the primary color space (already in use in `globals.css`). OKLCH provides
perceptually uniform lightness, meaning color scales look evenly distributed across all hues --
critical for accessible status indicators and data visualization.

### Brand Color: Medical Indigo

The primary brand color is a **desaturated, trustworthy indigo** -- positioned between
Linear's calm indigo (#5E6AD2) and Stripe's professional purple (#635BFF). This color
conveys authority, trust, and calm -- associations aligned with medical professionalism.

```
Brand Indigo:     oklch(0.55 0.16 270)    ~= #5B6ABF
Brand Indigo 50:  oklch(0.97 0.01 270)    Very light tint (backgrounds)
Brand Indigo 100: oklch(0.93 0.03 270)    Light tint
Brand Indigo 200: oklch(0.85 0.06 270)    Subtle backgrounds
Brand Indigo 300: oklch(0.75 0.10 270)    Borders, secondary elements
Brand Indigo 400: oklch(0.65 0.13 270)    Secondary text on dark
Brand Indigo 500: oklch(0.55 0.16 270)    PRIMARY -- buttons, links, focus rings
Brand Indigo 600: oklch(0.48 0.16 270)    Hover state
Brand Indigo 700: oklch(0.40 0.14 270)    Active/pressed state
Brand Indigo 800: oklch(0.32 0.11 270)    Dark mode primary surfaces
Brand Indigo 900: oklch(0.24 0.08 270)    Dark backgrounds
Brand Indigo 950: oklch(0.18 0.05 270)    Deepest dark surfaces
```

### Semantic Colors: Light Mode

```css
:root {
  /* Backgrounds */
  --background:          oklch(0.995 0.002 270);   /* #FAFAFE - barely blue-white */
  --background-secondary: oklch(0.975 0.004 270);  /* Subtle blue-gray for sections */
  --card:                oklch(1 0 0);              /* Pure white cards */
  --card-foreground:     oklch(0.145 0 0);

  /* Surfaces (sidebar, panels) */
  --surface:             oklch(0.98 0.003 270);     /* Warm off-white like Notion sidebar */
  --surface-elevated:    oklch(1 0 0);              /* Popover/modal surfaces */

  /* Text */
  --foreground:          oklch(0.16 0.01 270);      /* Near-black with cool tint */
  --foreground-secondary: oklch(0.45 0.01 270);     /* Secondary text ~Stripe's muted */
  --foreground-muted:    oklch(0.556 0 0);          /* Tertiary/placeholder */

  /* Brand / Primary */
  --primary:             oklch(0.55 0.16 270);      /* Brand Indigo 500 */
  --primary-foreground:  oklch(0.99 0 0);           /* White text on primary */
  --primary-hover:       oklch(0.48 0.16 270);      /* Brand Indigo 600 */
  --primary-active:      oklch(0.40 0.14 270);      /* Brand Indigo 700 */
  --primary-subtle:      oklch(0.95 0.03 270);      /* Light bg for selected states */

  /* Secondary */
  --secondary:           oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);

  /* Muted */
  --muted:               oklch(0.965 0.003 270);    /* Subtle cool-gray */
  --muted-foreground:    oklch(0.50 0.01 270);

  /* Borders */
  --border:              oklch(0.91 0.005 270);     /* Slightly blue-gray borders */
  --border-subtle:       oklch(0.95 0.003 270);     /* Very subtle separators */
  --input:               oklch(0.91 0.005 270);
  --ring:                oklch(0.55 0.16 270);      /* Focus ring = brand color */

  /* Accent (hover/selected backgrounds) */
  --accent:              oklch(0.96 0.008 270);     /* Hover background */
  --accent-foreground:   oklch(0.205 0 0);

  /* Destructive */
  --destructive:         oklch(0.577 0.200 25);     /* Warm red, not alarming */
  --destructive-foreground: oklch(0.99 0 0);
  --destructive-subtle:  oklch(0.96 0.02 25);       /* Light red background */

  /* Status Colors */
  --success:             oklch(0.60 0.15 155);      /* Clinical green */
  --success-subtle:      oklch(0.96 0.03 155);
  --warning:             oklch(0.75 0.15 80);       /* Amber warning */
  --warning-subtle:      oklch(0.97 0.03 80);
  --info:                oklch(0.60 0.14 240);      /* Blue info */
  --info-subtle:         oklch(0.96 0.03 240);

  /* Consent Status - Domain Specific */
  --status-pending:      oklch(0.70 0.12 80);       /* Amber */
  --status-filled:       oklch(0.60 0.14 240);      /* Blue */
  --status-signed:       oklch(0.55 0.16 270);      /* Indigo/Brand */
  --status-completed:    oklch(0.60 0.15 155);      /* Green */
  --status-expired:      oklch(0.50 0.01 0);        /* Gray */
  --status-revoked:      oklch(0.577 0.200 25);     /* Red */

  /* Sidebar */
  --sidebar:             oklch(0.98 0.003 270);     /* Warm off-white */
  --sidebar-foreground:  oklch(0.30 0.01 270);
  --sidebar-primary:     oklch(0.55 0.16 270);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent:      oklch(0.94 0.01 270);      /* Active item bg */
  --sidebar-accent-foreground: oklch(0.16 0.02 270);
  --sidebar-border:      oklch(0.93 0.005 270);
  --sidebar-muted:       oklch(0.50 0.01 270);      /* Muted sidebar text */

  /* Charts (5-color palette for analytics) */
  --chart-1:             oklch(0.55 0.16 270);      /* Brand indigo */
  --chart-2:             oklch(0.60 0.15 155);      /* Green */
  --chart-3:             oklch(0.65 0.14 200);      /* Teal */
  --chart-4:             oklch(0.70 0.12 80);       /* Amber */
  --chart-5:             oklch(0.60 0.12 320);      /* Soft purple */
}
```

### Semantic Colors: Dark Mode

Follows Stripe's and Linear's approach: dark backgrounds are NOT pure black (#000), but
a deep blue-tinted neutral. This provides depth and avoids the "OLED void" effect.

```css
.dark {
  /* Backgrounds */
  --background:          oklch(0.13 0.01 270);      /* Deep navy-black ~#111318 */
  --background-secondary: oklch(0.16 0.01 270);
  --card:                oklch(0.18 0.01 270);       /* Elevated surfaces */
  --card-foreground:     oklch(0.93 0 0);

  /* Surfaces */
  --surface:             oklch(0.15 0.01 270);
  --surface-elevated:    oklch(0.20 0.01 270);

  /* Text */
  --foreground:          oklch(0.93 0.005 270);      /* Slightly warm white */
  --foreground-secondary: oklch(0.65 0.005 270);
  --foreground-muted:    oklch(0.50 0.005 270);

  /* Brand / Primary */
  --primary:             oklch(0.65 0.16 270);       /* Lighter in dark mode */
  --primary-foreground:  oklch(0.13 0 0);
  --primary-hover:       oklch(0.70 0.16 270);
  --primary-active:      oklch(0.58 0.16 270);
  --primary-subtle:      oklch(0.22 0.06 270);

  /* Secondary */
  --secondary:           oklch(0.24 0.01 270);
  --secondary-foreground: oklch(0.93 0 0);

  /* Muted */
  --muted:               oklch(0.22 0.01 270);
  --muted-foreground:    oklch(0.60 0.005 270);

  /* Borders */
  --border:              oklch(1 0 0 / 10%);
  --border-subtle:       oklch(1 0 0 / 6%);
  --input:               oklch(1 0 0 / 12%);
  --ring:                oklch(0.65 0.16 270);

  /* Accent */
  --accent:              oklch(0.22 0.02 270);
  --accent-foreground:   oklch(0.93 0 0);

  /* Destructive */
  --destructive:         oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.99 0 0);
  --destructive-subtle:  oklch(0.22 0.05 25);

  /* Status Colors -- slightly lighter for dark backgrounds */
  --success:             oklch(0.70 0.15 155);
  --success-subtle:      oklch(0.20 0.04 155);
  --warning:             oklch(0.80 0.14 80);
  --warning-subtle:      oklch(0.22 0.04 80);
  --info:                oklch(0.68 0.14 240);
  --info-subtle:         oklch(0.20 0.04 240);

  /* Consent Status */
  --status-pending:      oklch(0.78 0.12 80);
  --status-filled:       oklch(0.68 0.14 240);
  --status-signed:       oklch(0.65 0.16 270);
  --status-completed:    oklch(0.70 0.15 155);
  --status-expired:      oklch(0.55 0.01 0);
  --status-revoked:      oklch(0.65 0.20 25);

  /* Sidebar */
  --sidebar:             oklch(0.15 0.01 270);
  --sidebar-foreground:  oklch(0.80 0.005 270);
  --sidebar-primary:     oklch(0.65 0.16 270);
  --sidebar-primary-foreground: oklch(0.99 0 0);
  --sidebar-accent:      oklch(0.22 0.03 270);
  --sidebar-accent-foreground: oklch(0.93 0 0);
  --sidebar-border:      oklch(1 0 0 / 8%);
  --sidebar-muted:       oklch(0.50 0.005 270);

  /* Charts */
  --chart-1:             oklch(0.65 0.16 270);
  --chart-2:             oklch(0.70 0.15 155);
  --chart-3:             oklch(0.72 0.14 200);
  --chart-4:             oklch(0.78 0.12 80);
  --chart-5:             oklch(0.68 0.12 320);
}
```

### Color Usage Rules

1. **Never use raw hex/rgb colors** in components. Always reference semantic tokens.
2. **Maximum 2 accent hues** visible on any single screen (brand indigo + one status color).
3. **Status colors always paired** with subtle background: never bare colored text on white.
4. **Gray text must meet** 4.5:1 contrast against its background.
5. **Destructive red is reserved** for irreversible actions (delete, revoke consent). Never for
   form validation -- use orange/amber for warnings and inline validation hints.

---

## 3. Typography

### Font Stack

**Primary: Geist Sans** (already configured in the project via `--font-geist-sans`)
- Designed by Vercel specifically for UI readability at all sizes
- Swiss-inspired geometric sans-serif
- Excellent number rendering (critical for medical forms, dates, billing)
- Variable font with weights from 100 to 900

**Monospace: Geist Mono** (already configured via `--font-geist-mono`)
- Used for: consent form IDs, audit trail hashes, encryption indicators, GDT codes

**Fallback stack:**
```css
--font-sans: 'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
--font-mono: 'Geist Mono', 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
```

### Type Scale

Uses a **1.200 Minor Third** ratio for professional, non-aggressive hierarchy.
Smaller ratio than typical SaaS (1.25+) to maintain the dense, information-rich feel
preferred by German users.

| Token              | Size    | Line Height | Weight      | Usage                          |
|--------------------|---------|-------------|-------------|--------------------------------|
| `display`          | 36px    | 1.1         | 700 bold    | Marketing pages, onboarding    |
| `h1`               | 28px    | 1.2         | 600 semi    | Page titles                    |
| `h2`               | 24px    | 1.25        | 600 semi    | Section headings               |
| `h3`               | 20px    | 1.3         | 600 semi    | Card titles, modal headers     |
| `h4`               | 16px    | 1.4         | 600 semi    | Subsection titles              |
| `body-lg`          | 16px    | 1.6         | 400 regular | Primary body, consent text     |
| `body`             | 14px    | 1.5         | 400 regular | Default UI text, table cells   |
| `body-sm`          | 13px    | 1.5         | 400 regular | Secondary info, descriptions   |
| `caption`          | 12px    | 1.4         | 400 regular | Timestamps, helper text        |
| `overline`         | 11px    | 1.3         | 500 medium  | Labels, section identifiers    |
| `code`             | 13px    | 1.5         | 400 regular | Consent IDs, hashes, GDT codes |

### Typography Rules

1. **Body text in consent forms** uses `body-lg` (16px) for readability -- minimum for
   iOS inputs and for older patients.
2. **German text is ~30% longer** than English. Design for text expansion in all components.
3. **Never go below 12px** for any visible text.
4. **Headings are `foreground`** color; body text can be `foreground` or `foreground-secondary`.
5. **Font weight in dark mode** may be reduced by one step (600 -> 500) for headings
   since light-on-dark text appears heavier.
6. **Letter spacing**: -0.01em for h1/h2, 0 for body, +0.02em for overline/caption.
7. **Number rendering**: Use `font-variant-numeric: tabular-nums` in tables and financial displays.

---

## 4. Spacing System

Based on a **4px base unit** with a Tailwind-compatible scale. This creates the
tight-but-breathable density that Linear and Stripe achieve.

| Token   | Value  | Usage                                          |
|---------|--------|------------------------------------------------|
| `0.5`   | 2px    | Micro gaps (icon-to-text inline)               |
| `1`     | 4px    | Tight padding (badge internal)                 |
| `1.5`   | 6px    | Small gaps                                     |
| `2`     | 8px    | Default gap between related items              |
| `3`     | 12px   | Input padding, small card padding              |
| `4`     | 16px   | Standard component padding                     |
| `5`     | 20px   | Medium spacing between sections                |
| `6`     | 24px   | Card padding (matches current card.tsx)         |
| `8`     | 32px   | Large section gaps                             |
| `10`    | 40px   | Page section dividers                          |
| `12`    | 48px   | Touch-target minimum height (tablet mode)      |
| `16`    | 64px   | Major layout sections                          |
| `20`    | 80px   | Page-level top/bottom padding                  |

### Spacing Rules

1. **Related items**: 8px gap (e.g., label to input, icon to text)
2. **Grouped sections**: 16-24px between groups
3. **Page sections**: 32-40px between major sections
4. **Card internal padding**: 24px (consistent with existing `px-6`)
5. **Touch targets**: Minimum 44px height for all interactive elements; 48px on tablet
6. **Sidebar item height**: 36px desktop, 44px tablet

---

## 5. Border Radius

Follows the current `--radius: 0.625rem` (10px) base with scale.
This is between Linear's subtle rounding and Notion's friendlier radius, creating
a professional-but-approachable feel appropriate for medical software.

| Token        | Value                          | Usage                           |
|--------------|--------------------------------|---------------------------------|
| `radius-none`| 0                              | Progress bars, dividers         |
| `radius-sm`  | calc(var(--radius) - 4px) = 6px | Badges, small chips, inline tags|
| `radius-md`  | calc(var(--radius) - 2px) = 8px | Buttons, inputs, selects       |
| `radius-lg`  | var(--radius) = 10px           | Cards, dropdowns, popovers     |
| `radius-xl`  | calc(var(--radius) + 4px) = 14px| Modals, large cards            |
| `radius-2xl` | calc(var(--radius) + 8px) = 18px| Toast notifications            |
| `radius-full`| 9999px                         | Avatars, pill badges, toggles  |

### Border Radius Rules

1. **Buttons**: `radius-md` (8px) -- matches Stripe's rounded-but-not-pill approach
2. **Cards**: `radius-lg` (10px) -- current `rounded-xl` is kept
3. **Badges/Pills**: `radius-full` for status badges, `radius-sm` for tags
4. **Inputs**: `radius-md` (8px) -- must match button radius for inline forms
5. **Modals**: `radius-xl` (14px) -- slightly larger for visual softness
6. **Signature canvas**: `radius-lg` (10px) with a visible 1px border
7. **Medical photos**: `radius-md` (8px) -- never fully rounded to maintain clinical precision

---

## 6. Shadow System

Minimal, functional shadows inspired by Linear and Vercel -- shadows communicate elevation,
not decoration. Avoid the heavy dropshadow aesthetic.

```css
:root {
  --shadow-xs:   0 1px 2px oklch(0 0 0 / 0.04);
  --shadow-sm:   0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04);
  --shadow-md:   0 4px 6px oklch(0 0 0 / 0.05), 0 2px 4px oklch(0 0 0 / 0.03);
  --shadow-lg:   0 10px 15px oklch(0 0 0 / 0.05), 0 4px 6px oklch(0 0 0 / 0.03);
  --shadow-xl:   0 20px 25px oklch(0 0 0 / 0.06), 0 8px 10px oklch(0 0 0 / 0.04);

  /* Colored shadow for brand CTAs (Linear-inspired glow) */
  --shadow-brand: 0 4px 14px oklch(0.55 0.16 270 / 0.15);

  /* Ring shadow for focus states */
  --shadow-ring:  0 0 0 3px oklch(0.55 0.16 270 / 0.20);
}

.dark {
  --shadow-xs:   0 1px 2px oklch(0 0 0 / 0.15);
  --shadow-sm:   0 1px 3px oklch(0 0 0 / 0.20), 0 1px 2px oklch(0 0 0 / 0.15);
  --shadow-md:   0 4px 6px oklch(0 0 0 / 0.20), 0 2px 4px oklch(0 0 0 / 0.15);
  --shadow-lg:   0 10px 15px oklch(0 0 0 / 0.25), 0 4px 6px oklch(0 0 0 / 0.15);
  --shadow-xl:   0 20px 25px oklch(0 0 0 / 0.30), 0 8px 10px oklch(0 0 0 / 0.20);
  --shadow-brand: 0 4px 14px oklch(0.65 0.16 270 / 0.25);
  --shadow-ring:  0 0 0 3px oklch(0.65 0.16 270 / 0.30);
}
```

### Shadow Usage Rules

| Element              | Shadow         | Notes                          |
|----------------------|----------------|--------------------------------|
| Cards at rest        | `shadow-xs`    | Almost imperceptible, border does the work |
| Cards on hover       | `shadow-sm`    | Subtle lift effect             |
| Dropdowns/Popovers   | `shadow-lg`    | Needs clear separation         |
| Modals               | `shadow-xl`    | Maximum elevation              |
| Sticky headers       | `shadow-sm`    | On scroll only                 |
| Primary CTA button   | `shadow-brand` | Colored glow (optional, use sparingly) |
| Focus ring           | `shadow-ring`  | Combined with ring outline     |
| Toast notifications  | `shadow-md`    | Mid-level elevation            |
| Sidebar              | none           | Separated by border only       |

---

## 7. Animation & Transitions

Subtle, purposeful motion. Inspired by Raycast's snappiness and Linear's polished transitions.
No animations should delay user workflows.

### Transition Tokens

```css
:root {
  --duration-instant:  0ms;
  --duration-fast:     100ms;
  --duration-normal:   200ms;
  --duration-slow:     300ms;
  --duration-slower:   500ms;

  --ease-default:      cubic-bezier(0.25, 0.1, 0.25, 1.0);    /* Smooth standard */
  --ease-in:           cubic-bezier(0.55, 0.055, 0.675, 0.19);
  --ease-out:          cubic-bezier(0.215, 0.61, 0.355, 1);    /* For entrances */
  --ease-in-out:       cubic-bezier(0.645, 0.045, 0.355, 1);
  --ease-spring:       cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Subtle bounce */
}
```

### Animation Assignments

| Interaction             | Duration        | Easing          | Properties              |
|-------------------------|-----------------|-----------------|-------------------------|
| Button hover            | `--duration-fast` (100ms) | `ease-default` | background-color, shadow |
| Button press            | `--duration-fast` (100ms) | `ease-in`      | transform scale(0.98)    |
| Sidebar item hover      | `--duration-fast` (100ms) | `ease-default` | background-color         |
| Dropdown open           | `--duration-normal` (200ms) | `ease-out`   | opacity, transform       |
| Dropdown close          | `--duration-fast` (100ms)  | `ease-in`    | opacity, transform       |
| Modal open              | `--duration-slow` (300ms)  | `ease-spring`| opacity, scale           |
| Modal close             | `--duration-normal` (200ms)| `ease-in`    | opacity, scale           |
| Page transition         | `--duration-normal` (200ms)| `ease-out`   | opacity                  |
| Toast enter             | `--duration-slow` (300ms)  | `ease-spring`| transform translateY     |
| Toast exit              | `--duration-normal` (200ms)| `ease-in`    | opacity, transform       |
| Table row hover         | `--duration-fast` (100ms)  | `ease-default`| background-color        |
| Card hover elevation    | `--duration-normal` (200ms)| `ease-default`| shadow, transform       |
| Skeleton loading pulse  | 2000ms (loop)  | `ease-in-out`   | opacity                  |
| Consent step transition | `--duration-slow` (300ms)  | `ease-out`   | opacity, translateX      |

### Animation Rules

1. **Respect `prefers-reduced-motion`**: All animations must be disabled or reduced.
2. **No animations > 500ms** for interactive elements (Raycast principle).
3. **Entrance animations are slower** than exits (users want closure to be instant).
4. **Skeleton loading** instead of spinners for content areas.
5. **Progress indicators** for consent form steps: use a smooth width transition on a
   progress bar, not step dots.
6. **Never animate layout shifts** -- use opacity transitions when showing/hiding elements.

---

## 8. Icons

### Icon Library: Lucide

- **Default size**: 20px for navigation, 16px for inline/button icons
- **Default stroke width**: 1.75 (between Lucide's 2.0 default and the trendy 1.5)
- **Color**: Always `currentColor` -- inherits text color from parent
- **Style**: Outline/stroke, never filled (cleaner, more medical-professional)

### Custom Icon Rules

```css
.lucide {
  stroke-width: 1.75;
}

/* Smaller contexts reduce stroke weight */
.text-xs .lucide,
.text-sm .lucide {
  stroke-width: 1.5;
}
```

### Domain-Specific Icons

| Concept              | Icon                 | Context                        |
|----------------------|----------------------|--------------------------------|
| Consent form         | `FileSignature`      | Consent lists, navigation      |
| Patient              | `User`               | Patient records                |
| Encryption/Security  | `Shield`             | Vault status, encryption badge |
| Vault locked         | `Lock`               | Master password required       |
| Vault unlocked       | `Unlock`             | Active decryption session      |
| Signature            | `PenTool`            | Signing flows                  |
| Practice/Clinic      | `Building2`          | Practice settings              |
| Team member          | `Users`              | Team management                |
| Analytics            | `BarChart3`          | Analytics dashboard            |
| Billing              | `CreditCard`         | Billing/subscription           |
| Settings             | `Settings`           | Settings navigation            |
| Audit trail          | `ScrollText`         | Audit log                      |
| PDF document         | `FileText`           | Generated PDF consent forms    |
| Camera/Photo         | `Camera`             | Before/after photos            |
| Calendar/Date        | `Calendar`           | Appointment dates              |
| Language             | `Globe`              | i18n locale picker             |
| Checkmark status     | `CircleCheck`        | Completed status               |
| Warning              | `AlertTriangle`      | Warnings, validation           |
| Error                | `AlertCircle`        | Errors                         |
| Info                 | `Info`               | Informational tooltips         |

---

## 9. Navigation & Sidebar

### Sidebar Design

Inspired by **Linear's compact sidebar** and **Notion's warm feel**, adapted for
medical workflows.

```
Width (expanded):    260px
Width (collapsed):   52px (icon only + tooltip)
Width (tablet):      280px (slightly wider for touch targets)
Background:          var(--sidebar) -- warm off-white / deep navy in dark
Border:              1px solid var(--sidebar-border) on the right edge
Position:            Fixed, full viewport height
Transition:          width 200ms ease-out
```

### Sidebar Structure (Top to Bottom)

```
+-------------------------------------------+
| [Logo] DermaConsent         [Collapse <<] |
+-------------------------------------------+
| [Search icon] Quick search...   Cmd+K     |
+-------------------------------------------+
|                                           |
| OVERVIEW                                  |
|   [BarChart3]  Dashboard                  |
|   [FileSign.]  Consent Forms              |
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
| [Avatar] Dr. Schmidt       [Settings cog] |
+-------------------------------------------+
```

### Sidebar Item States

| State    | Background                | Text Color                  | Icon Color                  |
|----------|---------------------------|-----------------------------|-----------------------------|
| Default  | transparent               | `--sidebar-foreground`      | `--sidebar-muted`           |
| Hover    | `--sidebar-accent`        | `--sidebar-accent-foreground`| `--sidebar-accent-foreground`|
| Active   | `--sidebar-accent`        | `--sidebar-primary`         | `--sidebar-primary`         |
| Disabled | transparent               | `--sidebar-muted` @ 50%    | `--sidebar-muted` @ 50%    |

### Sidebar Item Dimensions

```css
.sidebar-item {
  height: 36px;           /* 44px on tablet */
  padding: 0 12px;
  border-radius: 6px;     /* radius-sm */
  margin: 0 8px;          /* Inset from sidebar edges */
  font-size: 14px;
  font-weight: 500;
  gap: 10px;              /* Between icon and label */
  transition: background-color 100ms ease;
}
```

### Section Labels

```css
.sidebar-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--sidebar-muted);
  padding: 20px 12px 6px 20px;
}
```

### Top Bar (Secondary Navigation)

Used within page content area for breadcrumbs and page-level actions.

```
Height:              52px
Background:          var(--background)
Border:              1px solid var(--border-subtle) on the bottom
Content:             [Breadcrumbs]                    [Page Actions]
```

### Breadcrumb Pattern

```
Dashboard  /  Consent Forms  /  CF-2024-0142
```
- Separator: `/` in `--foreground-muted`
- Previous levels: `--foreground-secondary` with hover underline
- Current level: `--foreground` weight 500
- Font: `body` (14px)

---

## 10. Buttons

### Button Variants

All buttons use `radius-md` (8px), `font-weight: 500`, `font-size: 14px`.
Transition: `all 100ms ease`.

#### Primary Button

```
Background:       var(--primary)
Text:             var(--primary-foreground)
Hover:            var(--primary-hover)
Active:           var(--primary-active), transform: scale(0.98)
Focus:            3px ring at var(--ring) / 25% opacity
Shadow:           shadow-xs at rest, shadow-sm on hover
Height:           36px (default), 32px (sm), 40px (lg), 48px (tablet)
Padding:          0 16px (default), 0 12px (sm), 0 24px (lg)
```

Usage: One primary button per visible section. Used for: "Send Consent", "Save", "Create".

#### Secondary Button

```
Background:       var(--secondary)
Text:             var(--secondary-foreground)
Hover:            var(--secondary) / 80% opacity
Border:           none
```

Usage: Paired with primary. Used for: "Cancel", "Back", "Export".

#### Outline Button

```
Background:       transparent
Text:             var(--foreground)
Border:           1px solid var(--border)
Hover bg:         var(--accent)
```

Usage: Less emphasis than secondary. Used for: "Filter", "Sort", table actions.

#### Ghost Button

```
Background:       transparent
Text:             var(--foreground-secondary)
Hover bg:         var(--accent)
Hover text:       var(--foreground)
```

Usage: Minimal emphasis. Used for: icon buttons, sidebar items, close buttons.

#### Destructive Button

```
Background:       var(--destructive)
Text:             white
Hover:            var(--destructive) / 90% opacity
```

Usage: Irreversible actions ONLY. Used for: "Delete Patient", "Revoke Consent".
**Must be accompanied by a confirmation dialog.**

#### Link Button

```
Background:       transparent
Text:             var(--primary)
Hover:            underline
```

Usage: In-line navigation actions. Used for: "View Details", "Learn More".

### Button Sizing

| Size        | Height | Padding X | Font Size | Icon Size |
|-------------|--------|-----------|-----------|-----------|
| `xs`        | 24px   | 8px       | 12px      | 14px      |
| `sm`        | 32px   | 12px      | 13px      | 16px      |
| `default`   | 36px   | 16px      | 14px      | 16px      |
| `lg`        | 40px   | 24px      | 14px      | 18px      |
| `tablet`    | 48px   | 24px      | 16px      | 20px      |
| `icon`      | 36px   | 0 (square)| --        | 18px      |
| `icon-sm`   | 32px   | 0 (square)| --        | 16px      |

### Button Loading State

Replace button text with a subtle spinner (14px, `currentColor`). Button maintains
its width (use `min-width` matching the content width). Disabled pointer events during
loading.

---

## 11. Cards

### Card Design

Inspired by Stripe's clean card system: border-defined (not shadow-defined), with
clear header/content/footer anatomy.

```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);        /* 10px */
  padding: 0;                              /* Content sections handle their own */
  shadow: var(--shadow-xs);
  transition: shadow 200ms ease;
}

.card:hover {                              /* Only for clickable cards */
  shadow: var(--shadow-sm);
  border-color: var(--border);             /* Slightly more visible */
}

.card-header {
  padding: 20px 24px 0 24px;
}

.card-content {
  padding: 16px 24px;
}

.card-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-subtle);
}
```

### Card Variants

| Variant         | Description                                      |
|-----------------|--------------------------------------------------|
| Default         | White bg, subtle border, minimal shadow           |
| Elevated        | Same as default + `shadow-md` (for overlapping cards) |
| Interactive     | Hover state with shadow-sm lift + cursor pointer  |
| Highlighted     | Left 3px border in `--primary` (active/selected)  |
| Stat Card       | Large number display + label + trend indicator    |
| Consent Card    | Status badge, patient name, action buttons        |
| Warning Card    | Left 3px `--warning` border + amber tinted bg     |
| Encrypted Card  | Shield icon + "Encrypted" badge in card header    |

### Stat Card Layout

```
+--------------------------------------------------+
|  Consent Forms Sent                    [+12% ^]  |
|  247                                              |
|  This month                                       |
+--------------------------------------------------+
```
- Title: `body-sm`, `--foreground-secondary`
- Value: `h1` (28px, weight 700)
- Subtitle: `caption`, `--foreground-muted`
- Trend badge: Small pill, green/red with arrow icon

---

## 12. Tables & Lists

### Table Design

Inspired by Stripe's data tables: clean, dense, scannable. Row hover for interactivity.
No zebra striping (cleaner, avoids state confusion). Row-level hover highlight instead.

```css
.table {
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;
}

.table-header {
  border-bottom: 1px solid var(--border);
}

.table-head {
  font-size: 12px;
  font-weight: 600;
  color: var(--foreground-secondary);
  text-transform: none;                    /* NOT uppercase like old SaaS */
  letter-spacing: 0;
  padding: 10px 12px;
  text-align: left;
  white-space: nowrap;
  user-select: none;                       /* For sortable headers */
}

.table-row {
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 100ms ease;
}

.table-row:hover {
  background-color: var(--accent);
}

.table-row[data-state="selected"] {
  background-color: var(--primary-subtle);
}

.table-cell {
  padding: 10px 12px;
  vertical-align: middle;
  color: var(--foreground);
}

.table-cell-secondary {
  color: var(--foreground-secondary);
}
```

### Table Features

1. **Sticky header**: On scroll, header gets `shadow-sm` bottom border effect.
2. **Row selection**: Checkbox in first column, appears on hover or when shift-selecting.
3. **Sortable columns**: Subtle up/down arrow icon, active column bold with brand color arrow.
4. **Bulk actions bar**: Slides in above table when rows are selected (Linear pattern).
5. **Empty state**: Centered in table body area with illustration + CTA.
6. **Pagination**: Below table, right-aligned. "Showing 1-25 of 142" + prev/next buttons.
7. **Row density toggle**: Compact (32px rows), Comfortable (44px rows), Spacious (52px rows).

### Table Row: Consent Form Example

```
| [x]  | CF-2024-0142    | Max Mustermann  | Botox Behandlung  | [Signed]  | 2024-03-15 | [...]  |
```
- Consent ID: monospace font, `--foreground-secondary`
- Patient name: weight 500
- Template name: normal weight
- Status: Color badge (pill)
- Date: `--foreground-secondary`, relative format ("2 hours ago") with absolute tooltip
- Actions: ghost icon button menu (...)

### List Pattern (Alternative to Table)

For mobile/tablet or when fewer than 5 columns, use a stacked card-list:

```
+--------------------------------------------------+
|  [Shield] Max Mustermann                [Signed]  |
|  Botox Behandlung  |  CF-2024-0142               |
|  Sent 2 hours ago                    [View] [...] |
+--------------------------------------------------+
```

---

## 13. Status Badges

### Badge Design

Pill-shaped (`radius-full`), minimal height, font-weight 500. Each status has a
**text color** and a **subtle background** -- never colored text on white.

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 9999px;
  white-space: nowrap;
  line-height: 1;
}
```

### Consent Form Status Badges

| Status     | Background (Light)      | Text (Light)            | Dot Color              |
|------------|-------------------------|-------------------------|------------------------|
| Pending    | `--warning-subtle`      | `--status-pending`      | `--status-pending`     |
| Filled     | `--info-subtle`         | `--status-filled`       | `--status-filled`      |
| Signed     | `--primary-subtle`      | `--status-signed`       | `--status-signed`      |
| Paid       | `--success-subtle`      | `oklch(0.50 0.12 155)`  | `oklch(0.50 0.12 155)` |
| Completed  | `--success-subtle`      | `--status-completed`    | `--status-completed`   |
| Expired    | `var(--muted)`          | `--status-expired`      | `--status-expired`     |
| Revoked    | `--destructive-subtle`  | `--status-revoked`      | `--status-revoked`     |

### Badge Anatomy

```
[ (dot) Label ]
```

The small dot (6px circle) before the label provides immediate color scanning
even for colorblind users, since the dot's color is reinforced by the background tint.

### Other Badge Types

| Badge Type       | Appearance                                                |
|-----------------|-----------------------------------------------------------|
| Role badge       | Outline style, neutral: "Admin", "Arzt", "Empfang"       |
| Plan badge       | Brand-tinted pill: "Professional", "Enterprise"            |
| Encryption       | Shield icon + "Encrypted" -- green subtle background       |
| New / Updated    | Small primary-colored dot (6px), no text -- next to labels |
| Count badge      | Circular, min-width 20px, brand bg for notifications       |

---

## 14. Forms & Inputs

### Input Design

Clean, Stripe-inspired inputs with clear focus states.

```css
.input {
  height: 36px;                            /* 44px on tablet */
  padding: 0 12px;
  font-size: 14px;
  background: var(--card);                 /* White on light, elevated surface on dark */
  border: 1px solid var(--input);
  border-radius: var(--radius-md);         /* 8px */
  color: var(--foreground);
  transition: border-color 100ms ease, box-shadow 100ms ease;
}

.input::placeholder {
  color: var(--foreground-muted);
}

.input:hover {
  border-color: oklch(0.75 0.005 270);     /* Slightly darker */
}

.input:focus {
  border-color: var(--ring);
  box-shadow: 0 0 0 3px oklch(0.55 0.16 270 / 0.12);
  outline: none;
}

.input[aria-invalid="true"] {
  border-color: var(--destructive);
  box-shadow: 0 0 0 3px oklch(0.577 0.200 25 / 0.12);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Label Design

```css
.label {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
  margin-bottom: 6px;
}

.label-required::after {
  content: " *";
  color: var(--destructive);
}

.label-description {
  font-size: 13px;
  color: var(--foreground-secondary);
  margin-top: 2px;
}
```

### Form Layout Rules

1. **Vertical stacking** is default. Horizontal layouts only for short, related fields
   (First name + Last name).
2. **16px gap** between form fields vertically.
3. **Group related fields** in a card or bordered section with a section label.
4. **Error messages** appear below the input, 4px gap, `caption` size, `--destructive` color.
5. **Form actions** (Save/Cancel) right-aligned at bottom with 24px top spacing.
6. **Consent form fields** always have `body-lg` (16px) labels for patient-facing forms.
7. **Autosave indicator**: Small "Saved" badge with checkmark, appears and fades after 2s.

### Signature Canvas

```css
.signature-canvas {
  width: 100%;
  height: 200px;
  background: var(--card);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  cursor: crosshair;
  touch-action: none;                     /* Prevent scroll while signing */
}

.signature-canvas:active,
.signature-canvas.signing {
  border-color: var(--primary);
  border-style: solid;
}

.signature-canvas-label {
  text-align: center;
  padding: 80px 0;
  color: var(--foreground-muted);
  font-size: 14px;
}
```

---

## 15. Empty States

### Design Pattern

Centered content with a monochrome illustration, clear headline, supporting text,
and one primary CTA. Inspired by Linear and Notion's warm, minimal approach.

```
+--------------------------------------------------+
|                                                    |
|              [Illustration / Icon]                  |
|              64px icon, --foreground-muted          |
|                                                    |
|          No consent forms yet                       |
|          h3, --foreground                           |
|                                                    |
|    Create your first consent form template          |
|    and send it to a patient for signing.            |
|    body, --foreground-secondary, max-width 360px    |
|                                                    |
|          [+ Create Consent Form]                    |
|          Primary button                             |
|                                                    |
+--------------------------------------------------+
```

### Empty State Rules

1. **One CTA maximum** per empty state.
2. **Icon, not illustration** -- keep it clean and professional. Use a Lucide icon at 64px.
3. **Headline is mandatory**, description is optional (keep under 2 sentences).
4. **Action text is specific**: "Create Consent Form" not "Get Started".
5. **Never show an empty table** with headers and no rows. Replace entire table area.
6. **Loading state**: Use skeleton screens (animated rectangles), never spinners.

### Skeleton Screen Pattern

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--muted) 25%,
    var(--muted-foreground / 8%) 37%,
    var(--muted) 63%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 2s ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 16. Consent Form Presentation

### Patient-Facing Consent Form (Public URL)

This is the most critical UX flow. Patients access `/consent/[token]` without login.
Design must be clear, trustworthy, and accessible to elderly patients.

#### Layout

```
+----------------------------------------------------------+
|  [Logo] DermaConsent              [DE | EN | ES | FR]     |
+----------------------------------------------------------+
|                                                            |
|    Progress: Step 2 of 4                                   |
|    [============================--------]                  |
|                                                            |
|  +------------------------------------------------------+  |
|  |                                                      |  |
|  |  Einwilligungserklarung                              |  |
|  |  Botox-Behandlung                                    |  |
|  |                                                      |  |
|  |  [Consent text body -- body-lg, 16px]                |  |
|  |  Adequate line-height (1.6), max-width 680px         |  |
|  |  Left-aligned, comfortable reading column            |  |
|  |                                                      |  |
|  |  Risiken und Nebenwirkungen                          |  |
|  |  [Subsections with clear h3 headings]                |  |
|  |                                                      |  |
|  +------------------------------------------------------+  |
|                                                            |
|  [Shield icon] Your data is encrypted end-to-end           |
|                                                            |
|  [<< Back]                     [Continue to Signature >>]  |
|                                                            |
+----------------------------------------------------------+
```

#### Consent Form Design Rules

1. **Max content width**: 680px (optimal reading width for 16px text).
2. **Font size minimum**: 16px for all consent text. 14px minimum for UI chrome.
3. **Line height**: 1.6 for consent text bodies (higher than UI standard 1.5).
4. **Heading hierarchy**: Use visual weight differences, not just size changes.
   h2 = 24px semibold, h3 = 18px semibold with 24px top margin.
5. **Legal sections**: Separated by 32px vertical space with subtle horizontal divider.
6. **Checkboxes for acknowledgments**: 20px minimum, 44px touch target including padding.
7. **Progress bar**: Full-width, 4px tall, brand indigo fill. No step dots.
8. **Language switcher**: Globe icon + country code, subtle dropdown.
9. **Security badge**: Always visible -- "End-to-end encrypted" with shield icon.
10. **No sidebar, no navigation clutter** -- single-column, focused reading experience.

### Staff-Facing Consent Management

In the authenticated dashboard, consent forms are displayed in:
- **Table view** (default): Full list with all metadata columns
- **Card view** (toggle): Visual cards with status badges, patient names
- **Detail view**: Full consent form preview with action buttons and audit trail

---

## 17. Medical Photo Presentation

### Before/After Photo Standards

Based on HIPAA-compliant clinical photography guidelines.

#### Photo Container

```css
.photo-container {
  border-radius: var(--radius-md);         /* 8px -- professional, not playful */
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--card);
  position: relative;
}

.photo-container img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}
```

#### Before/After Layout

```
+---------------------------+---------------------------+
|                           |                           |
|        BEFORE             |         AFTER             |
|   [Date: 2024-01-15]     |   [Date: 2024-03-15]     |
|                           |                           |
|   [Photo]                 |   [Photo]                 |
|                           |                           |
+---------------------------+---------------------------+
```

#### Photo Presentation Rules

1. **Side-by-side comparison**: Equal-width containers, synchronized zoom if interactive.
2. **Date labels**: Required on every photo, positioned as overlays or below.
3. **Patient identification**: NEVER show patient name on the photo itself.
   Patient context comes from the surrounding UI (card header, page title).
4. **De-identification overlay**: Provide a tool to add black bar/blur over eyes
   before any photo is shared outside the practice.
5. **Watermark**: Configurable practice watermark for exported photos.
6. **Encryption badge**: Small shield overlay in corner indicating encrypted storage.
7. **Access audit**: "Viewed by Dr. Schmidt on 2024-03-15" below photos.
8. **No decorative borders or frames** -- clinical accuracy is the priority.
9. **Thumbnail grid**: 3-column grid with 8px gap, clickable to modal lightbox.
10. **Lightbox modal**: Dark backdrop, photo centered with max-width/max-height,
    keyboard navigation (arrow keys), close on Escape.

---

## 18. Trust & Security Visual Language

### Encryption Status Indicator

A persistent, subtle indicator that encrypted data is protected. Inspired by
browser SSL indicators and Mercury's security patterns.

#### Vault Status Bar (Sidebar Footer)

```
When locked:
+-------------------------------------------+
| [Lock icon, amber]  Vault Locked           |
| Click to unlock with master password       |
+-------------------------------------------+

When unlocked:
+-------------------------------------------+
| [Shield icon, green]  Vault Active         |
| Patient data accessible                    |
+-------------------------------------------+
```

#### Encrypted Field Indicator

When displaying decrypted patient data, show a subtle inline badge:

```
Patient Name: Max Mustermann [Shield, 12px, green]
```

This communicates that the field was encrypted and has been decrypted client-side.

### Trust Signals

| Signal                         | Where                                      |
|--------------------------------|--------------------------------------------|
| "End-to-end encrypted" badge   | Consent form header, patient detail page    |
| Shield icon                    | Next to all PII fields when decrypted       |
| Lock icon                      | Vault status in sidebar                     |
| "Zero-knowledge" tooltip       | Settings page, expandable info              |
| Audit trail link               | Every consent form detail view              |
| DSGVO/GDPR compliance badge    | Footer of patient-facing pages              |
| SSL indicator                  | Not needed (browser handles), but mention in footer |
| Data location                  | "Data stored in EU" badge in settings       |

### Security-Themed Color Usage

- **Green**: Active protection, successful encryption, vault unlocked
- **Amber**: Attention needed, vault locked, pending actions
- **Red**: Only for actual security issues (failed encryption, unauthorized access attempt)
- **Never use red for routine actions** like form validation

---

## 19. Tablet & Exam Room Optimization

### Responsive Breakpoints

```css
/* Mobile (phones)     */ @media (max-width: 639px)
/* Tablet portrait     */ @media (min-width: 640px) and (max-width: 1023px)
/* Tablet landscape    */ @media (min-width: 1024px) and (max-width: 1279px)
/* Desktop             */ @media (min-width: 1280px)
/* Large desktop       */ @media (min-width: 1536px)
```

### Tablet-Specific Adjustments

1. **Touch targets**: All interactive elements minimum 44px, preferably 48px.
2. **Sidebar**: Collapsed by default on portrait tablet, full width overlay on tap.
   On landscape tablet, sidebar is persistent at 280px.
3. **Button heights**: Use `lg` (40px) as default on tablet instead of `default` (36px).
4. **Input heights**: 44px minimum on tablet.
5. **Table row height**: Comfortable mode (44px) as default on tablet.
6. **Font size**: Body remains 14px; consent form text remains 16px. Never reduce.
7. **Card grid**: 2-column on tablet portrait, 3-column on landscape.
8. **Consent form**: Single column, 100% width with 24px horizontal padding.
9. **Signature canvas**: Full-width, 240px height on tablet (taller for finger signing).
10. **Bottom sheet pattern**: Use bottom sheets instead of dropdown menus on tablet.

### Exam Room Mode (Optional Enhancement)

A toggle-able "Exam Room" mode that:
- Increases all touch targets to 48px
- Hides the sidebar completely
- Shows a simplified toolbar at top
- Maximizes content area for patient-facing consent forms
- Increases consent text to 18px
- Enables auto-lock after 2 minutes of inactivity

---

## 20. Dark Mode & Light Mode

### Default Mode

**Light mode is the default.** Medical software is primarily used in well-lit clinical
environments (exam rooms, reception areas). However, dark mode must be fully supported
for: evening documentation, preferences, and reduced eye strain during long admin sessions.

### Mode Selection

Three options (Vercel/Linear pattern):
1. **Light** -- explicit light mode
2. **Dark** -- explicit dark mode
3. **System** (default) -- follows OS preference via `prefers-color-scheme`

### Dark Mode Design Principles

1. **NOT pure black backgrounds.** Use deep blue-tinted grays (oklch 0.13-0.18 with slight
   blue chroma) -- matches Linear and Stripe's approach.
2. **Reduce font weight by one step** for headings in dark mode (perceived heavier).
3. **Borders use transparency** (`oklch(1 0 0 / 10%)`) rather than fixed gray colors --
   automatically adapts to any background.
4. **Increase shadow opacity** in dark mode -- shadows need to be more pronounced to register.
5. **Status badge colors shift lighter** by approximately +0.10 lightness in OKLCH.
6. **Charts and data viz** use the same hues but shifted lighter for dark backgrounds.
7. **Medical photos**: Lightbox always uses dark backdrop regardless of mode.
8. **Consent form (patient-facing)**: Follows user's system preference but never forced dark.

### Implementation Note

The existing `globals.css` uses `@custom-variant dark (&:is(.dark *))` and the `.dark` class
pattern, which is compatible with this design system. The CSS variables in Section 2 above
are designed to drop into the existing `:root` and `.dark` blocks.

---

## 21. CSS Implementation Reference

### Updated globals.css Structure

The following shows how the existing `globals.css` should be updated to implement
this design system. New tokens are additive to the existing shadcn/ui foundation.

#### New Custom Properties to Add

```css
:root {
  /* Existing shadcn tokens remain -- update values per Section 2 */

  /* NEW: Extended semantic tokens */
  --background-secondary: oklch(0.975 0.004 270);
  --surface:              oklch(0.98 0.003 270);
  --surface-elevated:     oklch(1 0 0);

  --foreground-secondary: oklch(0.45 0.01 270);
  --foreground-muted:     oklch(0.556 0 0);

  --primary-hover:        oklch(0.48 0.16 270);
  --primary-active:       oklch(0.40 0.14 270);
  --primary-subtle:       oklch(0.95 0.03 270);

  --border-subtle:        oklch(0.95 0.003 270);

  --success:              oklch(0.60 0.15 155);
  --success-subtle:       oklch(0.96 0.03 155);
  --warning:              oklch(0.75 0.15 80);
  --warning-subtle:       oklch(0.97 0.03 80);
  --info:                 oklch(0.60 0.14 240);
  --info-subtle:          oklch(0.96 0.03 240);
  --destructive-subtle:   oklch(0.96 0.02 25);

  --status-pending:       oklch(0.70 0.12 80);
  --status-filled:        oklch(0.60 0.14 240);
  --status-signed:        oklch(0.55 0.16 270);
  --status-completed:     oklch(0.60 0.15 155);
  --status-expired:       oklch(0.50 0.01 0);
  --status-revoked:       oklch(0.577 0.200 25);

  /* Shadow tokens */
  --shadow-xs:   0 1px 2px oklch(0 0 0 / 0.04);
  --shadow-sm:   0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04);
  --shadow-md:   0 4px 6px oklch(0 0 0 / 0.05), 0 2px 4px oklch(0 0 0 / 0.03);
  --shadow-lg:   0 10px 15px oklch(0 0 0 / 0.05), 0 4px 6px oklch(0 0 0 / 0.03);
  --shadow-xl:   0 20px 25px oklch(0 0 0 / 0.06), 0 8px 10px oklch(0 0 0 / 0.04);
  --shadow-brand: 0 4px 14px oklch(0.55 0.16 270 / 0.15);

  /* Animation tokens */
  --duration-fast:   100ms;
  --duration-normal: 200ms;
  --duration-slow:   300ms;
  --ease-default:    cubic-bezier(0.25, 0.1, 0.25, 1.0);
  --ease-out:        cubic-bezier(0.215, 0.61, 0.355, 1);
  --ease-spring:     cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

#### Tailwind @theme Additions

Add these to the existing `@theme inline` block:

```css
@theme inline {
  /* Existing tokens remain */

  /* NEW tokens to expose to Tailwind */
  --color-background-secondary: var(--background-secondary);
  --color-surface: var(--surface);
  --color-surface-elevated: var(--surface-elevated);
  --color-foreground-secondary: var(--foreground-secondary);
  --color-foreground-muted: var(--foreground-muted);
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

---

## Appendix A: Comparison Summary

| Aspect                | Linear               | Stripe               | Notion              | Vercel              | Raycast             | Mercury             | DermaConsent        |
|-----------------------|----------------------|----------------------|---------------------|---------------------|---------------------|---------------------|---------------------|
| **Default mode**      | Dark                 | Light                | Light               | Dark                | Dark                | Light               | Light (system)      |
| **Primary font**      | Inter                | Custom (Stripe)      | Inter               | Geist Sans          | Inter               | Roobert/GT          | Geist Sans          |
| **Primary color**     | Indigo #5E6AD2       | Purple #635BFF       | Black #37352F       | Black/White         | Purple gradient     | Purple              | Indigo oklch 270    |
| **Background (light)**| #FFFFFF              | #F6F9FC              | #FFFFFF             | #FFFFFF             | #FFFFFF             | #FFFFFF             | #FAFAFE             |
| **Background (dark)** | #1B1C22              | #0A2540              | #191919             | #000000             | #1A1A1A             | --                  | #111318             |
| **Border style**      | Subtle, transparent  | Visible, gray        | Very subtle         | Crisp, 1px          | Subtle              | Clean               | Subtle blue-tinted  |
| **Border radius**     | 6-8px                | 6-8px                | 4-8px               | 6-8px               | 8-12px              | 8-12px              | 8-10px              |
| **Shadows**           | Minimal              | Subtle, elevation    | Almost none         | Very minimal        | Subtle glow         | Minimal             | Minimal, functional |
| **Information density** | High               | Medium-High          | Medium              | Medium              | Focused             | Medium              | Medium-High         |
| **Sidebar width**     | ~240px               | ~240px               | ~248px              | ~250px              | N/A (launcher)      | ~260px              | 260px               |

## Appendix B: Accessibility Checklist

- [ ] All text meets WCAG AA contrast (4.5:1 for normal, 3:1 for large text)
- [ ] Focus indicators visible on all interactive elements (3px ring)
- [ ] Touch targets minimum 44x44px on mobile/tablet
- [ ] Keyboard navigation for all features (Tab, Enter, Escape, Arrow keys)
- [ ] Screen reader landmarks and ARIA labels on all sections
- [ ] Color is never the sole indicator of status (always paired with text/icon)
- [ ] Reduced motion mode disables all animations
- [ ] Font size never below 12px
- [ ] Consent form text minimum 16px
- [ ] Form errors announced by screen readers via `aria-describedby`
- [ ] Language switcher accessible and clearly labeled
- [ ] All images have alt text (medical photos: descriptive clinical alt text)

## Appendix C: Research Sources

- [Linear Brand Guidelines](https://linear.app/brand)
- [How Linear Redesigned Their UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear Style Design Trend - LogRocket](https://blog.logrocket.com/ux-design/linear-design/)
- [The Rise of Linear Style Design - Medium](https://medium.com/design-bootcamp/the-rise-of-linear-style-design-origins-trends-and-techniques-4fd96aab7646)
- [Stripe Accessible Color Systems](https://stripe.com/blog/accessible-color-systems)
- [Stripe Brand Colors - Mobbin](https://mobbin.com/colors/brand/stripe)
- [Stripe Apps Design Documentation](https://docs.stripe.com/stripe-apps/design)
- [Vercel Geist Design System](https://vercel.com/geist/introduction)
- [Vercel Geist Colors](https://vercel.com/geist/colors)
- [Vercel Geist Font](https://vercel.com/font)
- [Raycast Colors API](https://developers.raycast.com/api-reference/user-interface/colors)
- [Raycast Brand Guidelines](https://www.raycast.com/templates/brand-guidelines)
- [Mercury Bank UI - NicelyDone](https://nicelydone.club/apps/mercury)
- [Mercury Bank Brand Colors](https://logo.com/brand/mercury-bank/colors)
- [Notion Color Codes - Notioneers](https://notioneers.eu/en/insights/notion-colors-codes)
- [Notion Typography - DesignYourWay](https://www.designyourway.net/blog/what-font-does-notion-use/)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Design Principles - GitHub Gist](https://gist.github.com/eonist/c1103bab5245b418fe008643c08fa272)
- [Lucide Icons Stroke Width](https://lucide.dev/guide/basics/stroke-width)
- [Lucide Icon Design Guide](https://lucide.dev/guide/design/icon-design-guide)
- [SaaS Dashboard Design Trends 2026 - Muzli](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/)
- [Top SaaS Design Trends 2026 - DesignStudioUIUX](https://www.designstudiouiux.com/blog/top-saas-design-trends/)
- [SaaS Design Trends & Best Practices 2026 - JetBase](https://jetbase.io/blog/saas-design-trends-best-practices)
- [Healthcare UI Design 2026 - Eleken](https://www.eleken.co/blog-posts/user-interface-design-for-healthcare-applications)
- [Healthcare UX Design Trends 2025 - Webstacks](https://www.webstacks.com/blog/healthcare-ux-design)
- [HIPAA-Compliant UI/UX Design Principles](https://medium.com/@orbix.studiollc/hipaa-compliant-ui-ux-7-design-principles-for-healthcare-f62796899002)
- [Building Trust in HealthTech Apps](https://www.solutelabs.com/blog/build-trust-healthtech-apps)
- [German UI/UX Expectations 2025 - Ironhack](https://www.ironhack.com/us/blog/ui-ux-design-in-transition-what-german-users-expect-today)
- [Sidebar Design Best Practices 2026](https://www.alfdesigngroup.com/post/improve-your-sidebar-design-for-web-apps)
- [SaaS Navigation Menu Anatomy - Lollypop](https://lollypop.design/blog/2025/december/saas-navigation-menu-design/)
- [Table Design UX - Eleken](https://www.eleken.co/blog-posts/table-design-ux)
- [Enterprise Data Table UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables)
- [Empty State UX - Eleken](https://www.eleken.co/blog-posts/empty-state-ux)
- [Consent Form UX Design - LinkedIn](https://www.linkedin.com/advice/3/what-best-practices-designing-presenting-digital)
- [Designing Informed Consent - Ethics Kit](https://medium.com/ethics-kit/designing-informed-consent-e0e790095f2b)
- [HIPAA Photography Rules](https://www.hipaajournal.com/hipaa-photography-rules/)
- [Clinical Photography Best Practices - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8143941/)
- [Glassmorphism UI Trend 2026](https://www.designstudiouiux.com/blog/what-is-glassmorphism-ui-trend/)
- [OKLCH in CSS - Evil Martians](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- [Color Tokens for Light and Dark Modes](https://medium.com/design-bootcamp/color-tokens-guide-to-light-and-dark-modes-in-design-systems-146ab33023ac)
- [Touch Target Sizing Standards - Smashing Magazine](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)
- [Typography in UX Best Practices](https://developerux.com/2025/02/12/typography-in-ux-best-practices-guide/)
- [UI Font Size Guidelines](https://b13.com/blog/designing-with-type-a-guide-to-ui-font-size-guidelines)
- [Dark Mode UX 2025](https://www.graphiceagle.com/dark-mode-ui/)
- [Framer Motion Transitions](https://www.framer.com/motion/transition/)
