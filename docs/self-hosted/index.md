# Self-Hosted Overview

Derma Consent is designed to be self-hosted on your own infrastructure. This gives you full control over patient data — a key requirement for GDPR compliance in medical settings.

## What You'll Deploy

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 16 | Patient-facing UI + staff dashboard |
| Backend | NestJS 11 | REST API, auth, PDF generation |
| Database | PostgreSQL 15+ | All application data |
| File Storage | Supabase Storage (optional) | PDF and photo storage |

## Deployment Options

### Docker Compose (Recommended)

The fastest way to deploy. A single `docker-compose.yml` brings up all three services. See [Docker Deployment](/self-hosted/docker).

### Manual Deployment

Run each service directly on a VM or bare metal. See [Installation](/self-hosted/installation).

## Next Steps

1. [Prerequisites](/self-hosted/prerequisites) — what you need before starting
2. [Installation](/self-hosted/installation) — step-by-step guide
3. [Configuration](/self-hosted/configuration) — environment variables
4. [Docker Deployment](/self-hosted/docker) — Docker Compose setup
