# Introduction

Derma Consent is an open-source consent management platform built for dermatology and aesthetic medicine practices. It handles the full lifecycle of patient consent — from form creation to e-signature to encrypted storage — while staying compliant with German medical regulations (BGB §630e) and GDPR.

## Why Derma Consent?

German dermatology practices face a unique compliance burden:

- **BGB §630e** requires documented informed consent for every procedure, with stricter standards for aesthetic treatments.
- **GDPR Article 9** classifies health data as a special category requiring explicit consent and strong technical safeguards.
- **Before/after photos** are both health data and biometric data, each requiring separate consent.

Most existing tools are either too generic (no aesthetic workflows), too expensive (enterprise-only pricing), or not available in Germany. Derma Consent fills that gap.

## What It Does

- **Digital consent forms** for 6 procedure types: Botox, Filler, Laser, Chemical Peel, Microneedling, and PRP.
- **Zero-knowledge encryption** — patient PII is encrypted client-side before transmission. The server never sees plaintext data.
- **E-signatures** with signature canvas, timestamp, and IP logging.
- **PDF generation** of signed consent forms for archival.
- **Multi-language** UI and consent forms (DE, EN, ES, FR).
- **Role-based access control** with Admin, Arzt (Physician), and Empfang (Reception) roles.
- **Audit logging** of all sensitive operations.
- **Stripe billing** integration with Free Trial, Starter, Professional, and Enterprise plans.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TailwindCSS 4, shadcn/ui |
| Backend | NestJS 11, Prisma 6, PostgreSQL |
| Auth | NextAuth 5 (Google, Microsoft, Apple + credentials) |
| Encryption | Web Crypto API (RSA-4096 + AES-256-GCM) |
| Monorepo | pnpm workspaces |

## Next Steps

- [Getting Started](/guide/getting-started) — run the project in 5 commands
- [Architecture](/guide/architecture) — understand how the pieces fit together
- [Key Concepts](/guide/key-concepts) — encryption, consent lifecycle, and roles
