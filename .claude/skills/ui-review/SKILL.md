---
name: ui-review
description: Review UI code for design quality, accessibility, and visual consistency
user_invocable: true
---

# UI Design Review

Perform a comprehensive review of the specified UI code. Report issues and fix them.

## Review Checklist

### 1. Visual Hierarchy
- [ ] Clear heading hierarchy (one h1, logical h2/h3 nesting)
- [ ] Font weights create clear distinction (not everything medium)
- [ ] Color differentiates primary vs secondary content
- [ ] Most important action is visually prominent (primary button)
- [ ] Whitespace guides the eye — related items grouped, distinct sections separated

### 2. Spacing & Layout
- [ ] All spacing on 8px grid (no arbitrary values)
- [ ] Consistent padding within cards/containers
- [ ] Consistent gaps between similar elements
- [ ] Responsive layout works at 375px, 768px, 1280px
- [ ] Content has sensible max-width (doesn't stretch across full ultra-wide screens)

### 3. Interactive Elements
- [ ] All buttons have hover, focus, active, disabled states
- [ ] All links have hover and focus states
- [ ] Clickable elements have cursor-pointer
- [ ] Transitions are smooth (150ms for micro, 300ms for state changes)
- [ ] Loading states on all async actions
- [ ] Form validation is inline and specific

### 4. Component Completeness
- [ ] Loading state (skeleton screens for content areas)
- [ ] Empty state (icon + message + CTA)
- [ ] Error state (inline, contextual, with recovery action)
- [ ] No blank/white screens in any state

### 5. Accessibility
- [ ] Semantic HTML (button for actions, a for links)
- [ ] Visible focus indicators on all interactive elements
- [ ] Form inputs have visible labels
- [ ] Icon-only buttons have aria-label
- [ ] Color contrast passes WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Animations respect prefers-reduced-motion

### 6. Consistency
- [ ] Colors use theme tokens, not hardcoded values
- [ ] Border radius consistent (xl for cards, lg for inputs, full for badges)
- [ ] Icon sizes consistent (h-4 w-4 inline, h-5 w-5 buttons)
- [ ] Similar pages/components follow the same patterns
- [ ] No mixed styling approaches

### 7. Anti-Slop Check
- [ ] No Inter/Roboto/Arial fonts
- [ ] Not everything centered with identical padding
- [ ] Visual variety where appropriate (not all cards identical)
- [ ] Intentional color choices (not generic purple/blue gradients)
- [ ] Design has personality appropriate to the context

## Process

1. Read all specified files thoroughly
2. Check against each category above
3. List all issues found, grouped by severity (critical → minor)
4. Fix all issues
5. Briefly summarize changes made
