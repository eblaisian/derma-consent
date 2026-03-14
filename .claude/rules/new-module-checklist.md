---
paths:
  - "packages/backend/src/**/*.module.ts"
  - "packages/backend/src/**/*.controller.ts"
---

# New Backend Module Checklist

When creating a new NestJS module or controller:

- [ ] Was the API designed first? (use `api-designer` agent if not)
- [ ] Module registered in AppModule imports
- [ ] Controller has appropriate guards: @UseGuards(JwtAuthGuard, RolesGuard)
- [ ] Controller has @Roles() decorator on role-restricted endpoints
- [ ] All input DTOs have class-validator decorators
- [ ] If touching patient data: uses encrypted_* columns and lookup hashes
- [ ] Service injected via constructor with proper Prisma dependency
- [ ] Spec file created alongside source for test coverage
