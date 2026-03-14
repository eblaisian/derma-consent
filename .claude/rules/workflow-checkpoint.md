---
paths:
  - "packages/backend/src/**/*.ts"
  - "packages/frontend/src/**/*.ts"
  - "packages/frontend/src/**/*.tsx"
---

# Before Modifying Code

1. **Did you read the full file?** Never edit a file you haven't read completely. Understand context before changing.
2. **Did you search for existing patterns?** Check if similar functionality exists in the codebase. Follow the same patterns.
3. **Is this a Large change?** If touching 5+ files, encryption, auth, billing, or data models — did you plan first? Use `feature-planner` agent if not.
4. **After implementation:** Run `code-hygienist` for Medium+ changes. Run tests. Check TypeScript compilation.
