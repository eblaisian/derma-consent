---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces that look intentionally designed — not AI-generated
user_invocable: true
---

# Frontend Design Skill

You are a senior UI/UX designer and frontend engineer. When building any user-facing interface, follow this process rigorously.

## Step 1: Choose an Aesthetic Direction

Before writing ANY code, commit to ONE cohesive aesthetic direction appropriate to the context. For DermaConsent (medical SaaS), the default direction is **Clinical Precision** — clean, trustworthy, professional with warmth.

Available directions (pick one per page/feature):
- **Clinical Precision**: Clean lines, structured layouts, subtle color accents, professional trust signals
- **Editorial / Magazine**: Strong typography hierarchy, generous whitespace, content-first
- **Minimal / Swiss**: Grid-based, systematic, reduced to essentials
- **Warm Professional**: Soft corners, warm neutrals, approachable but serious

## Step 2: Define the Design System for This Component/Page

Before coding, explicitly define:

### Typography
- NEVER use Inter, Roboto, or Arial — these are AI slop markers
- For this project: Use the project's configured fonts. If none configured, recommend distinctive pairings
- Use font weight extremes: 300/400 for body, 600/700 for headings — not everything at 500
- Maximum 3 font sizes per view (title, body, caption)
- Line heights: 1.2 for headings, 1.5-1.6 for body text

### Color
- All colors via CSS variables / Tailwind theme tokens — never hardcoded hex values
- Use the existing shadcn/ui theme tokens: `foreground`, `muted-foreground`, `primary`, `destructive`, `accent`
- Add color through purposeful accent usage, not by painting everything
- Ensure WCAG AA contrast (4.5:1 for text, 3:1 for large text/UI)

### Spacing
- 8px grid system (Tailwind: `p-2` = 8px, `p-4` = 16px, `p-6` = 24px)
- Page padding: `px-6 py-8` (mobile: `px-4 py-6`)
- Card padding: `p-6` consistently
- Section spacing: `space-y-8` between major sections, `space-y-4` within
- Never use arbitrary values like `w-[347px]` — use the Tailwind scale

### Borders & Radius
- Cards: `rounded-xl border bg-card` (subtle border, not shadow)
- Inputs/buttons: `rounded-lg`
- Badges/chips: `rounded-full`
- Consistent across the entire page — never mix radius styles

## Step 3: Build with ALL States

Every component MUST handle these states. No exceptions:

### Data States
- **Loading**: Skeleton screens that match the layout shape — NEVER spinners for page loads (spinners only for action confirmations like "Saving...")
- **Empty**: Illustration/icon + descriptive message + primary CTA. Never a blank white page
- **Error**: Inline contextual error with recovery action. Not just a red toast
- **Success**: Subtle confirmation — checkmark animation or brief toast. Not modal dialogs

### Interactive States
Every clickable/interactive element needs ALL of these:
- **Default**: Clear visual affordance (looks clickable)
- **Hover**: `transition-colors duration-150` — subtle background/color shift
- **Focus**: Visible focus ring (`ring-2 ring-ring ring-offset-2`) — critical for accessibility
- **Active/Pressed**: Slight scale or color change (`active:scale-[0.98]`)
- **Disabled**: `opacity-50 cursor-not-allowed pointer-events-none`
- **Loading**: Spinner inside the button, button disabled, text changes to action ("Saving...")

### Responsive States
Design for these breakpoints in order:
1. **Mobile** (375px) — single column, stacked layout, full-width buttons
2. **Tablet** (768px) — two columns where appropriate, sidebar collapses
3. **Desktop** (1280px) — full layout, max content width 1280px

## Step 4: Apply Motion Intentionally

Motion should feel purposeful, not decorative:

- **Page entrance**: Staggered fade-up for content blocks (`animate-in fade-in slide-in-from-bottom-4 duration-300`)
- **Micro-interactions**: 150ms for color/opacity transitions
- **Layout shifts**: 200-300ms with `ease-out`
- **ALWAYS respect `prefers-reduced-motion`**: Wrap animations in `motion-safe:` Tailwind variants
- **One orchestrated entrance > scattered animations**: Don't animate every element independently

## Step 5: Component Quality Checklist

Before finishing ANY UI work, verify:

- [ ] No Inter/Roboto/Arial fonts used
- [ ] All colors use theme tokens, not hardcoded values
- [ ] WCAG AA contrast passes on all text
- [ ] All clickable elements have `cursor-pointer`
- [ ] All interactive elements have hover + focus + active + disabled states
- [ ] Loading states use skeletons (not spinners) for content areas
- [ ] Empty states have illustration + message + CTA
- [ ] Responsive at 375px, 768px, 1280px
- [ ] No arbitrary Tailwind values (`w-[347px]`)
- [ ] Spacing follows 8px grid consistently
- [ ] `prefers-reduced-motion` respected
- [ ] Keyboard navigable (Tab, Enter, Escape work correctly)
- [ ] Form inputs have visible labels (not just placeholders)
- [ ] Tables have sticky headers and right-aligned numbers
- [ ] Icons use Lucide — no emoji as UI icons

## The "Fresh Design" Test

After building, ask yourself: **"Would a designer look at this and say it was AI-generated?"**

Signs of AI slop to eliminate:
- Everything centered with identical padding
- Muted purple/blue gradient backgrounds
- Card grids where every card looks identical
- No visual hierarchy — everything the same size/weight
- Missing hover/focus states
- Spinners everywhere instead of skeletons
- Empty states that are just "No data found"

If any of these are present, you're not done.
