# Prerequisites

## System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 vCPU | 2 vCPUs |
| RAM | 2 GB | 4 GB |
| Disk | 10 GB | 20 GB+ |
| OS | Any Linux with Docker, or macOS | Ubuntu 22.04 / Debian 12 |

## Software Requirements

### For Docker Deployment

- **Docker** 24+ with Docker Compose v2
- A domain name with DNS configured
- TLS certificate (Let's Encrypt recommended)

### For Manual Deployment

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 15+
- A process manager (PM2, systemd, etc.)
- A reverse proxy (nginx, Caddy, etc.)

## External Services (Optional)

These are optional but needed for full functionality:

| Service | Purpose | Required? |
|---------|---------|-----------|
| **Stripe** | Payment processing | Only if billing is enabled |
| **Resend** | Transactional emails (invites, consent links) | Recommended |
| **Supabase** | PDF and photo storage | Recommended for production |
| **Google / Microsoft / Apple** | OAuth login providers | Optional — credentials login always works |

## Network Requirements

| Port | Service | Access |
|------|---------|--------|
| 443 | HTTPS (reverse proxy) | Public |
| 3000 | Frontend (internal) | Reverse proxy only |
| 3001 | Backend API (internal) | Reverse proxy only |
| 5432 | PostgreSQL (internal) | Backend only |
