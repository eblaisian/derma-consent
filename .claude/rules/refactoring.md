---
paths:
  - "packages/backend/src/**/*.ts"
  - "packages/frontend/src/**/*.ts"
  - "packages/frontend/src/**/*.tsx"
---

# Refactoring Standards (applies to ALL code modifications)

When modifying any existing file, you MUST:

## Before Writing a Single Line

1. **Read the ENTIRE file** — not just the function you're changing. Understand the full context.
2. **Read all files that import from this file** — understand downstream effects.
3. **Read all files this file imports from** — understand upstream dependencies.

## During Implementation

4. **Rewrite, don't wrap.** If the requirements changed, rewrite the function/component cleanly for the new requirements. Do NOT add branches like `if (newBehavior) { ... } else { oldCode }`.
5. **One change, full propagation.** If you change a function signature, prop interface, DTO shape, or API response — update EVERY caller immediately. Do not leave any caller using the old shape.
6. **Delete the old, don't rename to _old.** When replacing functionality, delete the old implementation. Do not rename it to `_deprecated`, `Old`, or `V1`. Git has history.

## After Implementation

7. **Trace the ripple.** For every file you modified, check:
   - Are all imports still used? → Remove unused ones
   - Are all exports still consumed? → Remove unused ones
   - Are there other files that need updating due to your changes? → Update them
   - Did you remove something? → Grep the entire project for references and clean up
8. **Run the `code-hygienist` agent** — it will catch what you missed.

## Red Flags — If You See Yourself Doing These, STOP

- Creating `ComponentV2` → Instead, modify `Component` and update all usages
- Adding `// @deprecated` → Instead, delete and update callers now
- Writing an adapter between old and new → Instead, migrate fully to new
- Leaving a function that's now only called in one place → Inline it
- Adding a parameter like `legacy?: boolean` → Instead, create the clean version only
