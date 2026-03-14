---
paths:
  - "packages/frontend/**/*.ts"
  - "packages/frontend/**/*.tsx"
---

# Frontend Rules

- Next.js App Router only (no pages directory)
- Protected routes in src/app/(authenticated)/, guarded by middleware.ts
- Platform admin routes in src/app/(platform-admin)/admin/
- Public routes: /consent/[token], /invite/[token], /login, /register
- Auth: NextAuth 5 with JWT accessToken from backend stored in session
- Data fetching: SWR with auth-fetch wrapper (src/lib/auth-fetch.ts)
- Forms: react-hook-form + Zod validation schemas
- i18n: next-intl with 8 locales — always add translation keys to all locale files
- UI components: shadcn/ui in src/components/ui/, feature components by domain

## UI/UX Design Standards

### Typography
- NEVER use Inter, Roboto, or Arial — these are generic AI slop markers
- Use font weight extremes for hierarchy: 300-400 body, 600-700 headings
- Maximum 3 font sizes per view (title, body, caption)
- Line heights: 1.2 for headings, 1.5-1.6 for body

### Spacing & Layout
- 8px grid: p-2 (8px), p-4 (16px), p-6 (24px), p-8 (32px)
- NEVER use arbitrary Tailwind values (w-[347px], mt-[13px])
- Page padding: px-6 py-8 (mobile: px-4 py-6)
- Cards: rounded-xl border bg-card p-6
- Section spacing: space-y-8 between major sections, space-y-4 within
- Max content width: max-w-7xl mx-auto

### Color
- ALL colors via Tailwind theme tokens (foreground, muted-foreground, primary, accent, destructive)
- Never hardcode hex/rgb values in components
- WCAG AA contrast: 4.5:1 text, 3:1 UI components
- Must work in both light and dark mode

### Interactive Elements (EVERY clickable element needs ALL of these)
- cursor-pointer on all clickable elements
- Hover: transition-colors duration-150
- Focus: focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
- Active: subtle scale or color feedback
- Disabled: opacity-50 cursor-not-allowed
- Loading: spinner inside button, button disabled, text changes

### Component States (EVERY component needs ALL of these)
- Loading: skeleton screens for content, spinners only for action confirmations
- Empty: icon/illustration + descriptive message + primary CTA — NEVER a blank page
- Error: inline contextual error with recovery action
- Success: subtle confirmation toast or checkmark

### Motion
- 150ms micro-interactions, 200-300ms state changes, max 500ms
- Only animate transform and opacity (GPU-accelerated)
- ALWAYS wrap in motion-safe: Tailwind variants for prefers-reduced-motion
- Staggered entrance: fade-in slide-in-from-bottom-4 with 50-75ms stagger

### Accessibility
- Semantic HTML: button for actions, a for navigation, nav/main/section for landmarks
- Visible focus indicators on ALL interactive elements
- aria-label on icon-only buttons
- Form inputs MUST have visible labels (not just placeholders)
- Keyboard navigable: Tab, Enter, Escape work correctly
- Never use color alone to convey information

### Anti-Patterns to Avoid
- Everything centered with identical padding (add variety to layouts)
- All cards looking identical (vary content, hierarchy)
- Spinners for page loads (use skeletons)
- Empty states that are just "No data found" (add icon + message + CTA)
- Emoji as UI icons (use Lucide SVG icons)
- Generic purple/blue gradient backgrounds

### UI Polish Workflow
After building any UI, run these skills in order:
1. /baseline-ui — fix spacing, typography, interaction states
2. /fix-accessibility — keyboard nav, ARIA, focus management
3. /fix-motion — animation performance + reduced-motion compliance

### Visual Feedback Loop
When the dev server is running (localhost:3000), use the Playwright MCP to:
1. Navigate to the page being built
2. Take a screenshot
3. Visually verify the design
4. Iterate until it looks intentionally designed, not AI-generated
