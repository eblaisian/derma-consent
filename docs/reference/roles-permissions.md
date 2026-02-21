# Roles & Permissions

Derma Consent has three user roles with granular permissions.

## Roles

| Role | German | Description |
|------|--------|-------------|
| **ADMIN** | Administrator | Practice owner. Full access to all features including team management, billing, and settings. |
| **ARZT** | Arzt (Physician) | Treating doctor. Can manage patients, consent forms, treatment plans, photos, and view analytics. |
| **EMPFANG** | Empfang (Reception) | Front desk staff. Can create consent forms and view the patient list. Limited access. |

## Permission Matrix

| Feature | ADMIN | ARZT | EMPFANG |
|---------|:-----:|:----:|:-------:|
| **Dashboard** | | | |
| View dashboard | Yes | Yes | Yes |
| **Patients** | | | |
| List patients | Yes | Yes | Yes |
| View patient details | Yes | Yes | No |
| Create patient | Yes | Yes | No |
| Delete patient | Yes | No | No |
| **Consent Forms** | | | |
| Create consent form | Yes | Yes | Yes |
| List consent forms | Yes | Yes | No |
| View consent details | Yes | Yes | No |
| Revoke consent | Yes | Yes | No |
| **Treatment Plans** | | | |
| Create treatment plan | Yes | Yes | No |
| View treatment plans | Yes | Yes | No |
| Update treatment plan | Yes | Yes | No |
| Delete treatment plan | Yes | Yes | No |
| **Photos** | | | |
| Upload photo | Yes | Yes | No |
| View photos | Yes | Yes | No |
| Delete photo | Yes | Yes | No |
| **Team Management** | | | |
| View team members | Yes | No | No |
| Invite team member | Yes | No | No |
| Remove team member | Yes | No | No |
| Change member role | Yes | No | No |
| **Settings** | | | |
| View/edit settings | Yes | No | No |
| Upload logo | Yes | No | No |
| **Billing** | | | |
| View subscription | Yes | No | No |
| Manage subscription | Yes | No | No |
| **Analytics** | | | |
| View analytics | Yes | Yes | No |
| View revenue analytics | Yes | No | No |
| **Audit** | | | |
| View audit logs | Yes | No | No |
| Export audit logs | Yes | No | No |

## Role Assignment

- The first user who creates a practice is automatically assigned the **ADMIN** role.
- New team members are invited via email with a specific role.
- Only **ADMIN** users can change another member's role.
- A practice must always have at least one **ADMIN**.

## Implementation

Roles are enforced at the backend via:

1. **`JwtAuthGuard`** — validates the JWT token on every request
2. **`RolesGuard`** — checks the `@Roles()` decorator against the user's role in the JWT payload
3. **`@Roles('ADMIN', 'ARZT')`** — decorator applied to controller methods

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Delete(':id')
deletePatient(@Param('id') id: string) { ... }
```
