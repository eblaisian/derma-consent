# Updating

How to update Derma Consent to the latest version.

## Docker Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# 3. Run any new migrations
docker compose -f docker-compose.prod.yml exec backend \
  npx prisma db push
```

## Manual Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install new dependencies
pnpm install --recursive

# 3. Run migrations
cd packages/backend
npx prisma db push
npx prisma generate
cd ../..

# 4. Rebuild
pnpm --filter @derma-consent/backend build
pnpm --filter @derma-consent/frontend build

# 5. Restart services
pm2 restart derma-backend derma-frontend
```

## Before Updating

- **Back up your database** before any update
- Check the [changelog](https://github.com/your-org/derma-consent/releases) for breaking changes
- Test the update in a staging environment first if possible

## Database Migrations

Derma Consent uses `prisma db push` for schema synchronization. This command:

- Compares the Prisma schema to the current database
- Applies any differences (new tables, columns, etc.)
- Does **not** drop data unless a column type changes

For breaking schema changes, release notes will include migration instructions.

## Rollback

If an update causes issues:

```bash
# 1. Stop the new version
pm2 stop derma-backend derma-frontend

# 2. Check out the previous version
git checkout v1.2.3  # replace with your previous version tag

# 3. Rebuild and restart
pnpm install --recursive
pnpm --filter @derma-consent/backend build
pnpm --filter @derma-consent/frontend build
pm2 restart derma-backend derma-frontend
```

::: warning
Rolling back the code without rolling back the database may cause issues if the schema changed. Always back up before updating.
:::
