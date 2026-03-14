---
paths:
  - "packages/frontend/src/app/**"
  - "packages/frontend/src/components/**"
  - "packages/backend/src/**"
---

# Feature Removal & Replacement Checklist

When removing, replacing, or significantly reworking a feature, you MUST clean up ALL of these artifacts. Do NOT leave any behind.

## Frontend Artifacts to Remove
- [ ] Page/route files in `src/app/`
- [ ] Components in `src/components/` specific to this feature
- [ ] Hooks in `src/hooks/` specific to this feature
- [ ] Utility functions in `src/lib/` specific to this feature
- [ ] Translation keys in ALL 8 locale files (`src/i18n/messages/{de,en,es,fr,ar,tr,pl,ru}.json`)
- [ ] Navigation/sidebar entries that link to removed routes
- [ ] Type definitions and interfaces specific to this feature
- [ ] Test files for removed components/hooks/utilities
- [ ] Any assets (images, icons) only used by this feature

## Backend Artifacts to Remove
- [ ] Controller file and its routes
- [ ] Service file
- [ ] Module file (and remove from AppModule imports)
- [ ] DTO files for removed endpoints
- [ ] Prisma model fields (if the data is no longer needed) + migration
- [ ] Seed data for removed models
- [ ] Test/spec files for removed modules
- [ ] Guard or interceptor registrations specific to this feature
- [ ] Webhook handlers if applicable

## Cross-Cutting Artifacts
- [ ] Environment variables no longer needed (update `.env.example`)
- [ ] CI/CD steps specific to this feature
- [ ] Documentation references in `docs/`

## Verification
After cleanup, run:
```bash
npx tsc --noEmit  # in both packages — catches broken imports
make test          # catches broken tests
make build         # catches build issues
```

If TypeScript compilation succeeds with no errors, the cleanup is likely complete.
