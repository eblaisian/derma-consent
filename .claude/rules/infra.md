---
paths:
  - "infra/**"
  - "docker-compose*.yml"
  - "packages/*/Dockerfile"
  - ".github/workflows/**"
---

# Infrastructure Rules

- Cloud: OCI free tier with ARM A1 nodes — always consider resource constraints
- Kubernetes: Kustomize-based, base + overlays (staging, production)
- Terraform: OCI provider, S3-compatible backend on OCI Object Storage
- CI/CD: GitHub Actions — ci.yml (tests), deploy.yml (build + deploy), infra.yml (terraform)
- Docker: Multi-stage builds on Node 20-alpine, both packages have Dockerfiles
- Deploy script: infra/scripts/deploy-env.sh handles Kustomize + kubectl + Prisma migrations
- Production deploy requires manual GitHub Actions environment approval
- Database: PostgreSQL 16 — local Docker on port 5433, managed in production with SSL
- Never commit credentials — use Kubernetes secrets and GitHub Actions secrets
- Deployment images are linux/arm64 (OCI ARM A1 instances)
