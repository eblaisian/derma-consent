# Installation

Step-by-step guide for deploying Derma Consent manually (without Docker).

::: tip
For most deployments, [Docker Compose](/self-hosted/docker) is simpler. Use this guide if you need more control over individual services.
:::

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/derma-consent.git
cd derma-consent
```

## 2. Install Dependencies

```bash
pnpm install --recursive
```

## 3. Set Up PostgreSQL

Create a database and user:

```sql
CREATE USER derma WITH PASSWORD 'your-secure-password';
CREATE DATABASE dermaconsent OWNER derma;
```

## 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
DATABASE_URL=postgresql://derma:your-secure-password@localhost:5432/dermaconsent
AUTH_SECRET=generate-a-random-64-char-string
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

See [Configuration](/self-hosted/configuration) for all variables.

## 5. Run Database Migrations

```bash
cd packages/backend
npx prisma db push
npx prisma generate
cd ../..
```

## 6. Build for Production

```bash
pnpm --filter @derma-consent/backend build
pnpm --filter @derma-consent/frontend build
```

## 7. Start the Services

Using PM2 as an example:

```bash
# Backend
pm2 start packages/backend/dist/main.js --name derma-backend

# Frontend
cd packages/frontend
pm2 start npm --name derma-frontend -- start
```

Or with systemd — create service files for each:

```ini
# /etc/systemd/system/derma-backend.service
[Unit]
Description=Derma Consent Backend
After=postgresql.service

[Service]
WorkingDirectory=/opt/derma-consent/packages/backend
ExecStart=/usr/bin/node dist/main.js
EnvironmentFile=/opt/derma-consent/.env
Restart=always

[Install]
WantedBy=multi-user.target
```

## 8. Configure Reverse Proxy

Example nginx configuration:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name api.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 9. Verify

Open `https://your-domain.com` in a browser. You should see the login page. Register a new account or run `make seed` to create test data.
