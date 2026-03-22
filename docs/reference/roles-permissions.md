# Roles & Permissions

Derma Consent has four user roles with granular permissions enforced at both the frontend (middleware route access) and backend (controller guards and decorators).

## Roles

| Role | German | Description |
|------|--------|-------------|
| **ADMIN** | Administrator | Practice owner. Full access to all practice features including team management, billing, settings, analytics, and audit logs. |
| **ARZT** | Arzt (Physician) | Treating doctor. Can manage patients, consent forms, treatment plans, photos, and communicate with patients. |
| **EMPFANG** | Empfang (Reception) | Front desk staff. Can view and create patients, list consent forms, and send communications. |
| **PLATFORM_ADMIN** | Plattform-Admin | Cross-practice superadmin. Manages the platform itself — practices, configuration, emails, and notification logs. Has no access to individual practice features. |

## Frontend Route Access

The Next.js middleware (`packages/frontend/src/middleware.ts`) enforces which routes each role can visit. Unauthorized access redirects to `/dashboard` (practice roles) or `/admin` (platform admin).

| Route Prefix | ADMIN | ARZT | EMPFANG | PLATFORM_ADMIN |
|--------------|:-----:|:----:|:-------:|:--------------:|
| `/dashboard` | Yes | Yes | Yes | No |
| `/patients` | Yes | Yes | Yes | No |
| `/communications` | Yes | Yes | Yes | No |
| `/analytics` | Yes | No | No | No |
| `/team` | Yes | No | No | No |
| `/audit` | Yes | No | No | No |
| `/billing` | Yes | No | No | No |
| `/settings` | Yes | No | No | No |
| `/setup` | Yes | No | No | No |
| `/profile` | Yes | Yes | Yes | Yes |
| `/admin` | No | No | No | Yes |

## Backend Permission Matrix

Backend controllers enforce permissions via the `@Roles()` decorator and guard chain. The table below reflects the actual `@Roles()` annotations on each controller method.

### Patients

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| List patients | Yes | Yes | Yes |
| View patient details | Yes | Yes | Yes |
| Create patient | Yes | Yes | Yes |
| Lookup patient by hash | Yes | Yes | Yes |
| Delete patient | Yes | No | No |

### Consent Forms

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| Create consent form | Yes | Yes | Yes |
| List consent forms (by practice) | Yes | Yes | Yes |
| Generate PDF | Yes | Yes | No |
| Download PDF | Yes | Yes | No |
| Send consent copy | Yes | Yes | No |
| Revoke consent | Yes | Yes | No |

### Treatment Plans

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| Create treatment plan | Yes | Yes | No |
| View treatment plans | Yes | Yes | No |
| Update treatment plan | Yes | Yes | No |
| Delete treatment plan | Yes | Yes | No |
| Manage templates | Yes | Yes | No |
| Generate/send aftercare | Yes | Yes | No |

### Photos

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| Upload photo | Yes | Yes | No |
| View/download photos | Yes | Yes | No |
| Delete photo | Yes | Yes | No |
| Update photo consent | Yes | Yes | No |

### Communications

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| Generate draft | Yes | Yes | Yes |
| Send message | Yes | Yes | Yes |

### Team Management

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| View team members | Yes | No | No |
| Invite team member | Yes | No | No |
| Remove team member | Yes | No | No |
| Change member role | Yes | No | No |
| List pending invites | Yes | No | No |
| Resend/revoke invite | Yes | No | No |
| Accept invite | Yes | Yes | Yes |

### Settings

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| View/edit practice settings | Yes | No | No |
| Upload/delete logo | Yes | No | No |

### Practice

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| View practice info | Yes | Yes | Yes |
| Update practice | Yes | No | No |
| Rotate encryption key | Yes | No | No |

### Billing

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| View plans (public) | Yes | Yes | Yes |
| View subscription | Yes | No | No |
| View usage | Yes | No | No |
| Create checkout session | Yes | No | No |
| Create billing portal | Yes | No | No |

### Analytics

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| View overview | Yes | No | No |
| View by type/period | Yes | No | No |
| View conversion | Yes | No | No |
| View revenue | Yes | No | No |
| View retention flags | Yes | No | No |
| View insights | Yes | No | No |

### Audit

| Action | ADMIN | ARZT | EMPFANG |
|--------|:-----:|:----:|:-------:|
| View audit logs | Yes | No | No |
| Export audit logs (CSV) | Yes | No | No |
| Log vault event | Yes | Yes | Yes |

### Platform Admin

All platform admin endpoints are guarded by `PlatformAdminGuard` instead of `RolesGuard`. Only the `PLATFORM_ADMIN` role has access.

| Action | PLATFORM_ADMIN |
|--------|:--------------:|
| View platform dashboard | Yes |
| View platform usage | Yes |
| List practices | Yes |
| View practice detail | Yes |
| Suspend practice | Yes |
| Activate practice | Yes |
| Override subscription plan | Yes |
| View practice usage | Yes |
| List/get/set/delete platform config | Yes |
| Test service connections | Yes |
| Validate all services | Yes |
| Send admin emails | Yes |
| View notification logs | Yes |
| View notification stats | Yes |
| Send test notifications | Yes |

## Role Assignment

- The first user who creates a practice is automatically assigned the **ADMIN** role.
- New team members are invited via email with a specific role.
- Only **ADMIN** users can change another member's role.
- A practice must always have at least one **ADMIN**.
- **PLATFORM_ADMIN** users are not associated with any practice. They are created directly in the database (see seed data).

## Implementation

### Guard Chain

Backend controllers apply guards in this order:

1. **`JwtAuthGuard`** — Validates the JWT token on every request.
2. **`RolesGuard`** — Checks the `@Roles()` decorator against the user's role from the JWT payload. Used for practice-scoped endpoints.
3. **`SubscriptionGuard`** — Blocks access if the practice is suspended, has no subscription, or the subscription/trial has expired. Platform admins bypass this guard automatically.
4. **`PlatformAdminGuard`** — Used instead of `RolesGuard` for admin endpoints. Requires `PLATFORM_ADMIN` role. Logs a warning if the admin does not have 2FA enabled.

### Practice-Scoped Endpoint Example

```typescript
@Controller('api/patients')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class PatientController {
  @Delete(':id')
  @Roles('ADMIN')
  deletePatient(@Param('id') id: string) { ... }
}
```

### Platform Admin Endpoint Example

```typescript
@Controller('api/admin/practices')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class AdminPracticesController {
  @Post(':id/suspend')
  suspend(@Param('id') id: string) { ... }
}
```

### SubscriptionGuard Behavior

The `SubscriptionGuard` checks the practice's subscription status and blocks access when:

- The practice is **suspended** (`isSuspended` flag set by a platform admin).
- The practice has **no subscription** record.
- The trial has **expired**.
- The subscription is **cancelled** and past the paid billing period.

It allows access when the subscription is `ACTIVE`, `TRIALING` (within trial period), or `PAST_DUE` (Stripe retries payment automatically). `PLATFORM_ADMIN` users bypass subscription checks entirely.

### Frontend Middleware

The Next.js middleware (`src/middleware.ts`) enforces route-level access using a `roleAllowedPaths` map. If a user attempts to visit a route their role cannot access, they are redirected to their default page (`/dashboard` for practice users, `/admin` for platform admins).
