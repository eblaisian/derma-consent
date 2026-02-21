# Phase 0 — Infrastructure Blockers

> Must resolve before any production deployment. No task in Phase 1+ should begin until all Phase 0 tasks are complete.

---

## T-0.1 — Switch to Versioned Database Migrations

**Goal**: Replace `prisma db push` with `prisma migrate` so schema changes are safe, repeatable, and reversible in production.

**Context**: `prisma db push` can drop columns and lose data. Production databases require versioned, auditable migration files.

**Files to modify**:
- `packages/backend/prisma/` — will contain new `migrations/` directory (auto-generated)
- `packages/backend/package.json` — update scripts
- `Makefile` — update `migrate` target
- `.github/workflows/ci.yml` — add migration step
- `.github/workflows/deploy.yml` — add migration step

**Steps**:

1. In `packages/backend/`, run `npx prisma migrate dev --name init` to generate the initial migration from the current schema. This creates `prisma/migrations/<timestamp>_init/migration.sql`.

2. Update `packages/backend/package.json` scripts:
   ```json
   "prisma:migrate:dev": "prisma migrate dev",
   "prisma:migrate:deploy": "prisma migrate deploy",
   "prisma:migrate:status": "prisma migrate status"
   ```

3. Update `Makefile` — change the `migrate` target:
   ```makefile
   # Old:
   migrate:
   	cd packages/backend && npx prisma db push
   # New:
   migrate:
   	cd packages/backend && npx prisma migrate dev

   migrate-deploy:
   	cd packages/backend && npx prisma migrate deploy
   ```

4. Update `.github/workflows/ci.yml` — in the backend job, replace `npx prisma db push` with:
   ```yaml
   - name: Run migrations
     run: cd packages/backend && npx prisma migrate deploy
   ```

5. Update `.github/workflows/deploy.yml` — add a migration step before Docker build (or document that `prisma migrate deploy` runs on container startup).

6. Update `CLAUDE.md` to reflect the new migration command.

**Acceptance Criteria**:
- [ ] `prisma/migrations/` directory exists with at least one migration file
- [ ] `make migrate` runs `prisma migrate dev` (not `prisma db push`)
- [ ] CI pipeline uses `prisma migrate deploy`
- [ ] Running `npx prisma migrate status` shows no pending migrations
- [ ] Existing seed data still works after migration: `make seed`

**Dependencies**: None

---

## T-0.2 — Health Check Endpoints

**Goal**: Add `/api/health` and `/api/health/ready` endpoints for load balancer and monitoring integration.

**Context**: Container orchestrators (Docker, Kubernetes) and uptime monitors need endpoints to verify the service is alive and ready to serve traffic.

**Files to create**:
- `packages/backend/src/health/health.controller.ts`
- `packages/backend/src/health/health.module.ts`

**Files to modify**:
- `packages/backend/src/app.module.ts` — import `HealthModule`

**Steps**:

1. Create `packages/backend/src/health/health.module.ts`:
   ```typescript
   import { Module } from '@nestjs/common';
   import { HealthController } from './health.controller';
   import { PrismaModule } from '../prisma/prisma.module';

   @Module({
     imports: [PrismaModule],
     controllers: [HealthController],
   })
   export class HealthModule {}
   ```

2. Create `packages/backend/src/health/health.controller.ts`:
   ```typescript
   import { Controller, Get } from '@nestjs/common';
   import { SkipThrottle } from '@nestjs/throttler';
   import { PrismaService } from '../prisma/prisma.service';

   @Controller('api/health')
   @SkipThrottle()
   export class HealthController {
     constructor(private readonly prisma: PrismaService) {}

     @Get()
     async liveness() {
       return { status: 'ok', timestamp: new Date().toISOString() };
     }

     @Get('ready')
     async readiness() {
       const checks: Record<string, string> = {};
       try {
         await this.prisma.$queryRaw`SELECT 1`;
         checks.database = 'ok';
       } catch {
         checks.database = 'error';
       }
       const allOk = Object.values(checks).every((v) => v === 'ok');
       return {
         status: allOk ? 'ok' : 'degraded',
         checks,
         timestamp: new Date().toISOString(),
       };
     }
   }
   ```

3. In `packages/backend/src/app.module.ts`, add `HealthModule` to the `imports` array:
   ```typescript
   import { HealthModule } from './health/health.module';
   // In @Module imports:
   HealthModule,
   ```

4. Update `docker-compose.prod.yml` — change the backend health check to use the new endpoint:
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

**Acceptance Criteria**:
- [ ] `GET /api/health` returns `{ "status": "ok", "timestamp": "..." }` with HTTP 200
- [ ] `GET /api/health/ready` returns database connectivity status
- [ ] Both endpoints bypass rate limiting (`@SkipThrottle()`)
- [ ] Both endpoints require no authentication
- [ ] `make test-backend` passes

**Dependencies**: None

---

## T-0.3 — Global Exception Filter with Structured Logging

**Goal**: Add a global exception filter that returns consistent JSON error responses and logs in structured JSON format with request ID correlation.

**Context**: Unhandled exceptions currently return inconsistent formats. Production requires structured logging for aggregation tools (Sentry, Datadog, ELK).

**Files to create**:
- `packages/backend/src/common/http-exception.filter.ts`
- `packages/backend/src/common/request-id.middleware.ts`

**Files to modify**:
- `packages/backend/src/main.ts` — register filter and middleware
- `packages/backend/src/app.module.ts` — register as global filter

**Steps**:

1. Create `packages/backend/src/common/request-id.middleware.ts`:
   ```typescript
   import { Injectable, NestMiddleware } from '@nestjs/common';
   import { Request, Response, NextFunction } from 'express';
   import { randomUUID } from 'crypto';

   @Injectable()
   export class RequestIdMiddleware implements NestMiddleware {
     use(req: Request, res: Response, next: NextFunction) {
       const requestId = (req.headers['x-request-id'] as string) || randomUUID();
       req['requestId'] = requestId;
       res.setHeader('X-Request-Id', requestId);
       next();
     }
   }
   ```

2. Create `packages/backend/src/common/http-exception.filter.ts`:
   ```typescript
   import {
     ExceptionFilter,
     Catch,
     ArgumentsHost,
     HttpException,
     HttpStatus,
     Logger,
   } from '@nestjs/common';
   import { Request, Response } from 'express';

   @Catch()
   export class GlobalExceptionFilter implements ExceptionFilter {
     private readonly logger = new Logger('ExceptionFilter');

     catch(exception: unknown, host: ArgumentsHost) {
       const ctx = host.switchToHttp();
       const request = ctx.getRequest<Request>();
       const response = ctx.getResponse<Response>();

       const status =
         exception instanceof HttpException
           ? exception.getStatus()
           : HttpStatus.INTERNAL_SERVER_ERROR;

       const message =
         exception instanceof HttpException
           ? exception.message
           : 'Internal server error';

       const requestId = request['requestId'] || 'unknown';

       const errorResponse = {
         statusCode: status,
         message,
         timestamp: new Date().toISOString(),
         path: request.url,
         requestId,
       };

       // Structured log
       this.logger.error(
         JSON.stringify({
           requestId,
           method: request.method,
           url: request.url,
           statusCode: status,
           message,
           stack: exception instanceof Error ? exception.stack : undefined,
         }),
       );

       response.status(status).json(errorResponse);
     }
   }
   ```

3. In `packages/backend/src/main.ts`, after `app.use(helmet())`:
   ```typescript
   app.useGlobalFilters(new GlobalExceptionFilter());
   ```

4. In `packages/backend/src/app.module.ts`, add the middleware:
   ```typescript
   import { MiddlewareConsumer, NestModule } from '@nestjs/common';
   import { RequestIdMiddleware } from './common/request-id.middleware';

   export class AppModule implements NestModule {
     configure(consumer: MiddlewareConsumer) {
       consumer.apply(RequestIdMiddleware).forRoutes('*');
     }
   }
   ```

**Acceptance Criteria**:
- [ ] All error responses have shape: `{ statusCode, message, timestamp, path, requestId }`
- [ ] Every response includes `X-Request-Id` header
- [ ] Unhandled exceptions return HTTP 500 with consistent shape (not raw stack trace)
- [ ] Known exceptions (404, 400, 401, 403) preserve their status codes
- [ ] Error logs are JSON-structured with requestId, method, url, statusCode, stack
- [ ] `make test-backend` passes

**Dependencies**: None

---

## T-0.4 — HSTS Header

**Goal**: Add HTTP Strict Transport Security header to force HTTPS connections.

**Context**: Without HSTS, the first request to the domain could be intercepted via HTTP downgrade attack. Critical for medical data.

**Files to modify**:
- `packages/frontend/next.config.ts` — add HSTS to headers array
- `packages/backend/src/main.ts` — configure Helmet HSTS option

**Steps**:

1. In `packages/frontend/next.config.ts`, add to the `headers` array inside the existing `headers()` function:
   ```typescript
   { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
   ```

2. In `packages/backend/src/main.ts`, update the `helmet()` call:
   ```typescript
   app.use(
     helmet({
       hsts: {
         maxAge: 31536000,
         includeSubDomains: true,
         preload: true,
       },
     }),
   );
   ```

**Acceptance Criteria**:
- [ ] Frontend responses include `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- [ ] Backend responses include the same HSTS header
- [ ] `make build` succeeds
- [ ] `make test` passes

**Dependencies**: None

---

## T-0.5 — Content Security Policy Header

**Goal**: Add a Content Security Policy to prevent XSS attacks via injected scripts.

**Context**: CSP is the most effective XSS mitigation. The app loads Stripe.js externally and uses inline styles (TailwindCSS). The policy must allow these while blocking everything else.

**Files to modify**:
- `packages/frontend/next.config.ts` — add CSP header
- `packages/backend/src/main.ts` — configure Helmet CSP

**Steps**:

1. In `packages/frontend/next.config.ts`, add to the `headers` array:
   ```typescript
   {
     key: "Content-Security-Policy",
     value: [
       "default-src 'self'",
       "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
       "style-src 'self' 'unsafe-inline'",
       "img-src 'self' data: blob: https://*.supabase.co",
       "font-src 'self'",
       "connect-src 'self' https://api.stripe.com https://*.supabase.co " + (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"),
       "frame-src https://js.stripe.com https://hooks.stripe.com",
       "object-src 'none'",
       "base-uri 'self'",
     ].join("; "),
   },
   ```

2. In `packages/backend/src/main.ts`, update Helmet:
   ```typescript
   app.use(
     helmet({
       contentSecurityPolicy: {
         directives: {
           defaultSrc: ["'self'"],
           scriptSrc: ["'self'"],
           styleSrc: ["'self'", "'unsafe-inline'"],
           imgSrc: ["'self'", "data:"],
           connectSrc: ["'self'"],
           objectSrc: ["'none'"],
           baseUri: ["'self'"],
         },
       },
       hsts: {
         maxAge: 31536000,
         includeSubDomains: true,
         preload: true,
       },
     }),
   );
   ```

**Acceptance Criteria**:
- [ ] Frontend responses include `Content-Security-Policy` header
- [ ] Stripe checkout still works (js.stripe.com allowed in script-src and frame-src)
- [ ] Images from Supabase still load (*.supabase.co allowed in img-src)
- [ ] API calls to backend still work (backend URL in connect-src)
- [ ] No CSP violations in browser console on: login, dashboard, consent form, billing
- [ ] `make build` succeeds

**Dependencies**: None

---

## T-0.6 — Fix CI/CD: Tests Must Pass Before Deploy

**Goal**: Ensure Docker images are only built and pushed after all tests pass.

**Context**: Currently `deploy.yml` triggers on `v*` tags and pushes images without running tests. A broken build could reach production.

**Files to modify**:
- `.github/workflows/deploy.yml` — add test jobs as prerequisites

**Steps**:

1. In `.github/workflows/deploy.yml`, add test jobs (copy from `ci.yml`) and make the build jobs depend on them:

   ```yaml
   jobs:
     test-backend:
       runs-on: ubuntu-latest
       services:
         postgres:
           image: postgres:16-alpine
           env:
             POSTGRES_USER: test
             POSTGRES_PASSWORD: test
             POSTGRES_DB: derma_test
           ports:
             - 5432:5432
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: pnpm
         - run: pnpm install --frozen-lockfile
         - run: cd packages/backend && npx prisma generate
         - run: cd packages/backend && npx prisma migrate deploy
           env:
             DATABASE_URL: postgresql://test:test@localhost:5432/derma_test
         - run: cd packages/backend && npx jest
           env:
             DATABASE_URL: postgresql://test:test@localhost:5432/derma_test
             AUTH_SECRET: test-secret-for-ci

     test-frontend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: pnpm
         - run: pnpm install --frozen-lockfile
         - run: cd packages/frontend && npx vitest run

     build-and-push:
       needs: [test-backend, test-frontend]  # KEY: depends on tests
       # ... existing build steps ...
   ```

**Acceptance Criteria**:
- [ ] `deploy.yml` has `test-backend` and `test-frontend` jobs
- [ ] `build-and-push` job has `needs: [test-backend, test-frontend]`
- [ ] If any test fails, Docker images are NOT pushed
- [ ] YAML is valid (check with: `python -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"`)

**Dependencies**: T-0.1 (migrations must exist for CI to use `prisma migrate deploy`)

---

## T-0.7 — Non-Root User in Backend Dockerfile

**Goal**: Run the backend container as a non-root user for security hardening.

**Context**: If a container escape exploit occurs, running as root grants full system access. Running as a restricted user limits damage.

**Files to modify**:
- `packages/backend/Dockerfile`

**Steps**:

1. In `packages/backend/Dockerfile`, in the final (runner) stage, add before the `COPY` commands:
   ```dockerfile
   # Create non-root user
   RUN addgroup --system --gid 1001 nodejs && \
       adduser --system --uid 1001 nestjs
   ```

2. After all `COPY` commands, add:
   ```dockerfile
   USER nestjs
   ```

3. Ensure the final stage looks like:
   ```dockerfile
   FROM node:20-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV=production

   RUN addgroup --system --gid 1001 nodejs && \
       adduser --system --uid 1001 nestjs

   COPY --from=build /app/node_modules ./node_modules
   COPY --from=build /app/packages/backend/dist ./dist
   COPY --from=build /app/packages/backend/prisma ./prisma
   COPY --from=build /app/packages/backend/node_modules/.prisma ./node_modules/.prisma

   USER nestjs
   EXPOSE 3001
   CMD ["node", "dist/main"]
   ```

**Acceptance Criteria**:
- [ ] `docker build -f packages/backend/Dockerfile .` succeeds
- [ ] Container runs as non-root: `docker run --rm <image> whoami` outputs `nestjs`
- [ ] Backend starts and responds on port 3001

**Dependencies**: None

---

## T-0.8 — Add LICENSE File

**Goal**: Add a license file to clarify the legal terms for the codebase.

**Context**: Without a license, the default copyright applies (all rights reserved). For a SaaS product, BSL (Business Source License) or AGPL are common choices that protect commercial interests while allowing inspection.

**Files to create**:
- `LICENSE` (in repository root)

**Steps**:

1. Create `LICENSE` in the repository root with the Business Source License 1.1. Set the Change Date to 4 years from now and the Change License to Apache 2.0:

   ```
   Business Source License 1.1

   Licensor: DermaConsent
   Licensed Work: DermaConsent
   Change Date: 2030-02-21
   Change License: Apache License, Version 2.0

   Terms:
   The Licensor hereby grants you the right to copy, modify, create derivative
   works, redistribute, and make non-production use of the Licensed Work.

   The Licensor may make an Additional Use Grant, above, permitting limited
   production use.

   Effective on the Change Date, or the fourth anniversary of the first publicly
   available distribution of a specific version of the Licensed Work under this
   License, whichever comes first, the Licensor hereby grants you rights under
   the terms of the Change License, and the rights granted in the paragraph
   above terminate.
   ```

   (Use the full BSL 1.1 template from https://mariadb.com/bsl11/)

**Acceptance Criteria**:
- [ ] `LICENSE` file exists in repository root
- [ ] Contains BSL 1.1 text with appropriate Change Date and licensor

**Dependencies**: None (business decision — confirm license choice with co-founder)

---

## T-0.9 — Pagination Limit Enforcement

**Goal**: Enforce a maximum pagination limit of 100 on all paginated endpoints to prevent database overload.

**Context**: No max limit validation exists. A client could send `?limit=999999` and cause a full table scan.

**Files to create**:
- `packages/backend/src/common/pagination.dto.ts`

**Files to modify**:
- `packages/backend/src/patient/patient.controller.ts` — use PaginationDto
- `packages/backend/src/consent/consent.controller.ts` — use PaginationDto
- `packages/backend/src/audit/audit.controller.ts` — use PaginationDto
- `packages/backend/src/photo/photo.controller.ts` — use PaginationDto
- `packages/backend/src/treatment-plan/treatment-plan.controller.ts` — use PaginationDto
- `packages/backend/src/analytics/analytics.controller.ts` — validate `days` param

**Steps**:

1. Create `packages/backend/src/common/pagination.dto.ts`:
   ```typescript
   import { IsOptional, IsInt, Min, Max } from 'class-validator';
   import { Type } from 'class-transformer';

   export class PaginationDto {
     @IsOptional()
     @Type(() => Number)
     @IsInt()
     @Min(1)
     page?: number = 1;

     @IsOptional()
     @Type(() => Number)
     @IsInt()
     @Min(1)
     @Max(100)
     limit?: number = 25;
   }
   ```

2. In each controller that accepts `page` and `limit` query params, replace inline `@Query()` parsing with `@Query() pagination: PaginationDto`. The controllers are:
   - `patient.controller.ts` — `GET /api/patients`
   - `consent.controller.ts` — `GET /api/consent/practice`
   - `audit.controller.ts` — `GET /api/audit`
   - `photo.controller.ts` — `GET /api/photos/patient/:patientId`
   - `treatment-plan.controller.ts` — `GET /api/treatment-plans/patient/:patientId`

3. In each corresponding service method, use `pagination.limit` (already capped at 100) and `pagination.page` for offset calculation: `skip: (page - 1) * limit, take: limit`.

**Acceptance Criteria**:
- [ ] `GET /api/patients?limit=200` returns at most 100 results
- [ ] `GET /api/patients?limit=-1` returns a 400 validation error
- [ ] `GET /api/patients?limit=abc` returns a 400 validation error
- [ ] Default pagination (no params) returns 25 results
- [ ] All 5 paginated controllers use `PaginationDto`
- [ ] `make test-backend` passes

**Dependencies**: None
