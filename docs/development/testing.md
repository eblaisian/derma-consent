# Testing

## Running Tests

```bash
# All tests (backend + frontend)
make test

# Backend only (Jest)
make test-backend
# or: cd packages/backend && npx jest

# Frontend only (Vitest)
make test-frontend
# or: cd packages/frontend && npx vitest run
```

## Running a Single Test

```bash
# Backend — match by file path pattern
cd packages/backend && npx jest --testPathPattern=gdt

# Frontend — specific file
cd packages/frontend && npx vitest run src/lib/__tests__/crypto.test.ts
```

## Backend Tests (Jest)

Backend tests are co-located with source files as `*.spec.ts`:

```
src/
├── gdt/
│   ├── gdt.service.ts
│   └── gdt.service.spec.ts
```

### Writing a Backend Test

```typescript
import { Test } from '@nestjs/testing';
import { GdtService } from './gdt.service';

describe('GdtService', () => {
  let service: GdtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [GdtService],
    }).compile();

    service = module.get(GdtService);
  });

  it('should generate a valid GDT record', () => {
    const result = service.generate({ /* ... */ });
    expect(result).toBeDefined();
  });
});
```

## Frontend Tests (Vitest)

Frontend tests are in `src/lib/__tests__/`:

```
src/lib/__tests__/
└── crypto.test.ts
```

### Writing a Frontend Test

```typescript
import { describe, it, expect } from 'vitest';
import { generateKeyPair, encrypt, decrypt } from '../crypto';

describe('crypto', () => {
  it('should encrypt and decrypt data', async () => {
    const keys = await generateKeyPair();
    const plaintext = 'patient data';
    const encrypted = await encrypt(plaintext, keys.publicKey);
    const decrypted = await decrypt(encrypted, keys.privateKey);
    expect(decrypted).toBe(plaintext);
  });
});
```

## Test Configuration

- **Backend:** Jest config is in `packages/backend/package.json` or `jest.config.ts`
- **Frontend:** Vitest config is in `packages/frontend/vitest.config.ts`
