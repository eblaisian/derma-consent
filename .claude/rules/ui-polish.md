---
paths:
  - "packages/frontend/src/app/**/*.tsx"
  - "packages/frontend/src/components/**/*.tsx"
---

# Mandatory UI Polish — Automatic After Every Frontend Change

When you modify ANY `.tsx` file that renders UI (pages, components, layouts), the following is **mandatory and automatic** — never ask the user, just do it.

## 1. Visual Verification (if dev server is running)

After writing/editing UI code:
1. Navigate to the affected page via Playwright at `http://localhost:3000`
2. Take a screenshot
3. Read `.claude/ui-references/` screenshots for comparison
4. Ask yourself: **"Does this look like it was designed by a professional, or does it look AI-generated?"**

**AI-generated slop markers to catch and fix:**
- Everything centered with identical padding → add visual variety
- All cards look identical → vary content emphasis, add hierarchy
- No hover/focus states → add transitions (150ms for micro, 300ms for state)
- Spinners for page loads → replace with skeleton screens matching layout shape
- Empty state says "No data" → add icon + descriptive message + primary CTA
- Generic blue/purple gradient → use theme tokens purposefully
- Everything same font weight → use 300-400 body, 600-700 headings
- Missing loading states → add skeletons
- Numbers not aligned → add `tabular-nums`
- Headings not balanced → add `text-balance`

## 2. Interactive States Check

For EVERY new interactive element, verify it has:
- [ ] `cursor-pointer`
- [ ] Hover state with `transition-colors duration-150`
- [ ] Focus ring: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- [ ] Disabled state: `opacity-50 cursor-not-allowed`
- [ ] Loading state on buttons that trigger async actions

If any are missing, add them before proceeding.

## 3. Component States Check

For EVERY new component/page, verify:
- [ ] Loading state: skeleton screens (NOT spinners for content)
- [ ] Empty state: icon + message + CTA (NOT blank page or "No data")
- [ ] Error state: inline contextual error with recovery action
- [ ] Success state: subtle confirmation

If any are missing, implement them before proceeding.

## 4. Responsive Quick-Check

If dev server is running:
1. Resize browser to 375px width via Playwright
2. Take screenshot
3. Verify layout doesn't break (single column, stacked, no horizontal overflow)
4. Resize back to desktop

## 5. Design System Consistency

Every UI change must use:
- Theme tokens for colors (never hardcoded hex)
- 8px grid for spacing (p-2, p-4, p-6, p-8 — no arbitrary values)
- Existing shadcn/ui components (never rebuild what exists)
- Existing patterns from similar pages in the app

If you see inconsistency with the existing app, fix it to match — don't leave the new UI looking different from the rest.
