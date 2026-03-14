---
name: fix-accessibility
description: Fix accessibility issues — keyboard navigation, ARIA labels, focus management, semantic HTML
user_invocable: true
---

# Accessibility Fix Pass

Audit and fix accessibility issues in the specified files/components.

## Checks & Fixes

### Semantic HTML
- Use `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>` — not generic `<div>` for landmarks
- Use `<button>` for actions, `<a>` for navigation — never `<div onClick>`
- Heading levels must be sequential: `h1` → `h2` → `h3`, no skipping levels
- Lists of items should use `<ul>`/`<ol>` + `<li>`
- Tables should have `<thead>`, `<th scope="col">`, and proper caption if needed

### Keyboard Navigation
- All interactive elements reachable via Tab key
- Logical tab order following visual layout (no `tabIndex > 0`)
- Escape closes modals/dropdowns/popovers
- Enter/Space activates buttons and toggles
- Arrow keys navigate within groups (tabs, menus, radio groups)
- Focus trap inside modals (focus stays within modal until closed)
- Focus returns to trigger element when modal/popover closes

### Focus Indicators
- Every focusable element has a visible focus ring
- Use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Never use `outline-none` without a replacement focus indicator
- Focus ring must have sufficient contrast (3:1 against adjacent colors)

### ARIA Labels
- Images: meaningful `alt` text or `alt=""` for decorative images
- Icon-only buttons: `aria-label` describing the action (e.g., `aria-label="Close dialog"`)
- Form inputs: associated `<label>` elements (use `htmlFor` matching `id`)
- Loading states: `aria-busy="true"` on the container, `aria-live="polite"` for status updates
- Expandable sections: `aria-expanded` on the trigger
- Required fields: `aria-required="true"` or HTML `required` attribute
- Error messages: `aria-describedby` linking input to error text, `aria-invalid="true"`

### Color & Contrast
- Text contrast: 4.5:1 minimum (AA) for normal text, 3:1 for large text (18px+)
- UI component contrast: 3:1 against adjacent colors
- Never use color alone to convey information (add icons, text, or patterns)
- Check both light and dark mode

### Motion & Media
- Wrap animations in `motion-safe:` variants
- Add `prefers-reduced-motion` media query for CSS animations
- No auto-playing media without user consent
- Provide controls for any moving content

### Forms
- Every input has a visible label (not just placeholder)
- Error messages are specific ("Password must be at least 8 characters" not "Invalid input")
- Group related fields with `<fieldset>` + `<legend>` when appropriate
- Autocomplete attributes on relevant inputs (`autocomplete="email"`, `autocomplete="name"`)

## Process

1. Read all specified files
2. Check each element against the rules above
3. Fix all issues — never leave a11y issues for "later"
4. Verify fixes don't break visual design
