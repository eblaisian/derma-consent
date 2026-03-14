---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# Security Rules

- Zero-knowledge encryption: patient PII is encrypted client-side before server sees it
- Encryption: RSA-4096 + AES-256-GCM hybrid (src/lib/crypto.ts), no external crypto libs
- Patient PII stored in encrypted_* columns only — never store plaintext PII
- Lookup uses SHA-256 hash (lookupHash) for deduplication without decryption
- Master password vault: src/hooks/use-vault.ts — private key encrypted with PBKDF2
- Backend PII sanitizer: src/common/pii-sanitizer.interceptor.ts redacts encrypted fields from logs
- Never log, console.log, or expose decrypted patient data server-side
- Platform secrets encrypted with AES-256-GCM using PLATFORM_ENCRYPTION_KEY
