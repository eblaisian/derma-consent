# Backend (NestJS)

The backend is a NestJS 11 REST API at `packages/backend/`.

## Module Structure

Each feature follows the standard NestJS pattern:

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   ├── roles.decorator.ts
│   └── current-user.decorator.ts
├── consent/
│   ├── consent.module.ts
│   ├── consent.controller.ts
│   ├── consent-public.controller.ts
│   ├── consent.service.ts
│   └── dto/
│       ├── create-consent.dto.ts
│       └── submit-consent.dto.ts
├── patient/
├── practice/
├── team/
├── billing/
├── audit/
├── analytics/
├── settings/
├── pdf/
├── email/
├── photo/
├── treatment-plan/
└── gdt/
```

## Authentication & Authorization

### JWT Strategy

All protected routes require a Bearer token in the `Authorization` header. The JWT payload contains:

```typescript
{
  sub: string;         // User ID
  email: string;
  practiceId: string;
  role: string;        // ADMIN | ARZT | EMPFANG
}
```

### Guards

Apply guards to controllers or individual routes:

```typescript
@Controller('api/example')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExampleController {

  @Get()
  @Roles('ADMIN', 'ARZT')
  findAll(@CurrentUser() user: CurrentUserPayload) {
    // user.userId, user.practiceId, user.role
  }
}
```

- `JwtAuthGuard` — validates the JWT token, returns 401 if invalid
- `RolesGuard` — checks the `@Roles()` decorator, returns 403 if unauthorized
- `@CurrentUser()` — extracts the user payload from the request

### Rate Limiting

Auth endpoints are rate-limited (5 requests per 60 seconds) using `@Throttle()`.

## DTOs and Validation

DTOs use `class-validator` decorators:

```typescript
export class CreateConsentDto {
  @IsEnum(ConsentType)
  type: ConsentType;

  @IsString()
  patientId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

The `ValidationPipe` is applied globally — invalid requests return 400 with field-level error messages.

## PII Sanitizer

The `PiiSanitizerInterceptor` (`src/common/pii-sanitizer.interceptor.ts`) automatically redacts encrypted fields from API responses and logs. Fields prefixed with `encrypted_` are replaced with `[REDACTED]`.

## Adding a New Module

1. Create the module directory under `src/`
2. Create `*.module.ts`, `*.controller.ts`, `*.service.ts`
3. Create DTOs with `class-validator` decorators
4. Register the module in `app.module.ts`
5. Apply `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles()` as needed
