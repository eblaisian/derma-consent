---
paths:
  - "packages/backend/**/*.ts"
---

# Backend Rules

- Follow NestJS module pattern: *.module.ts, *.controller.ts, *.service.ts, *.dto.ts
- Validate all DTOs with class-validator decorators
- Apply guards in order: JwtAuthGuard → RolesGuard → PlatformAdminGuard
- Use @CurrentUser() decorator to access the authenticated user
- Four roles: ADMIN, ARZT, EMPFANG, PLATFORM_ADMIN
- After Prisma schema changes: run `make migrate && make generate`
- Column names use snake_case via @@map, Prisma models use camelCase
- Tests use Jest — spec files live alongside source files
