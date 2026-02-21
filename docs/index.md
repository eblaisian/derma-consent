---
layout: home

hero:
  name: Derma Consent
  text: Zero-knowledge consent management
  tagline: GDPR-compliant digital consent forms, e-signatures, and patient data encryption for dermatology practices.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/your-org/derma-consent

features:
  - title: Zero-Knowledge Encryption
    details: Patient data is encrypted client-side with RSA-4096 + AES-256-GCM before it ever reaches the server. Your server never sees plaintext PII.
  - title: Digital Consent Forms
    details: Six procedure-specific consent types (Botox, Filler, Laser, Chemical Peel, Microneedling, PRP) with e-signatures and PDF generation.
  - title: Multi-Language Support
    details: Consent forms and UI available in German, English, Spanish, and French. Locale auto-detected from the patient's browser.
  - title: Role-Based Access
    details: Three roles — Admin, Arzt (Physician), and Empfang (Reception) — with granular permissions across the entire platform.
  - title: Audit Logging
    details: Every sensitive operation is logged with timestamp, user, IP address, and action type. Export logs as CSV for compliance audits.
  - title: Self-Hostable
    details: Run the entire stack on your own infrastructure with Docker Compose. PostgreSQL, NestJS backend, and Next.js frontend — all open source.
---
