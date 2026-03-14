---
name: fix-motion
description: Fix animations for performance and reduced-motion compliance
user_invocable: true
---

# Motion & Performance Fix Pass

Audit and fix animation/motion issues in the specified files.

## Rules

### Performance-First Motion
- Only animate `transform` and `opacity` — these are GPU-accelerated
- Never animate `width`, `height`, `margin`, `padding`, `top`, `left` — these trigger layout recalculation
- Use `will-change` sparingly and only on elements about to animate
- Prefer CSS transitions over JavaScript animations for simple state changes
- Use Tailwind's `transition-*` utilities: `transition-colors`, `transition-opacity`, `transition-transform`

### Duration Guidelines
- Micro-interactions (hover, focus, toggle): `duration-150` (150ms)
- State changes (expand/collapse, tab switch): `duration-200` (200ms)
- Page transitions / entrance animations: `duration-300` (300ms)
- Complex orchestrated sequences: `duration-500` max (500ms)
- NEVER exceed 500ms — anything longer feels sluggish

### Easing
- Enter animations: `ease-out` (fast start, gentle stop)
- Exit animations: `ease-in` (gentle start, fast exit)
- State changes: `ease-in-out`
- Spring/bounce: only for playful interactions (not appropriate for medical SaaS)

### Entrance Animations
- Use staggered fade-in for lists and content blocks
- Content should animate from below: `animate-in fade-in slide-in-from-bottom-4`
- Stagger delay: 50-75ms between items (no more than 5-6 items staggered)
- One orchestrated page entrance > many independent animations

### Reduced Motion Compliance
- EVERY animation MUST be wrapped in `motion-safe:` Tailwind variant
- Example: `motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300`
- For CSS animations, use:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- When reduced motion is active, content should still appear — just without animation

### Anti-Patterns to Fix
- Spinners used for page/content loading → replace with skeleton screens
- Animations on scroll (parallax, scroll-triggered) → remove or make opt-in
- Auto-playing carousels → static or user-controlled
- Infinite animations (pulsing, rotating) → use only for critical loading indicators
- Layout animations that cause content shift → use `transform` instead

## Process

1. Read all specified files
2. Find all animations, transitions, and motion
3. Fix performance issues (non-GPU properties being animated)
4. Add `motion-safe:` wrappers to all animations
5. Verify durations follow guidelines
6. Ensure content is accessible without motion
