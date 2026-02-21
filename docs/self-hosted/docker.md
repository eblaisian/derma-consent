# Docker Deployment

The recommended way to deploy Derma Consent in production.

## Production Docker Compose

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: derma
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: dermaconsent
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U derma"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: packages/backend/Dockerfile
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://derma:${DB_PASSWORD}@db:5432/dermaconsent
      AUTH_SECRET: ${AUTH_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      BACKEND_PORT: 3001
    ports:
      - "3001:3001"

  frontend:
    build:
      context: .
      dockerfile: packages/frontend/Dockerfile
    restart: always
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

## Setup Steps

### 1. Create Environment File

```bash
cp .env.example .env
```

Set at minimum:

```bash
DB_PASSWORD=a-secure-database-password
AUTH_SECRET=generate-a-random-64-char-string
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### 2. Build and Start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Run Migrations

```bash
docker compose -f docker-compose.prod.yml exec backend \
  npx prisma db push
```

### 4. Verify

```bash
# Check all services are running
docker compose -f docker-compose.prod.yml ps

# Check backend health
curl http://localhost:3001/api/health
```

## Reverse Proxy

Place nginx or Caddy in front of the Docker services. Example Caddy configuration:

```
your-domain.com {
    reverse_proxy frontend:3000
}

api.your-domain.com {
    reverse_proxy backend:3001
}
```

## Persistent Data

- **Database:** PostgreSQL data is stored in the `pgdata` Docker volume
- **Backups:** Schedule regular `pg_dump` backups of the database

```bash
# Backup
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U derma dermaconsent > backup-$(date +%F).sql

# Restore
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U derma dermaconsent < backup-2025-01-15.sql
```

## Resource Limits

For production, add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
  db:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```
