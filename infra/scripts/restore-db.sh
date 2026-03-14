#!/bin/bash
set -euo pipefail

# DermaConsent — PostgreSQL Restore Script
#
# WARNING: This will DROP and recreate all tables in the target database.
# Only use on staging/dev or during disaster recovery.
#
# Usage:
#   ./restore-db.sh backup_file.sql.gz                          # Restore using DATABASE_URL
#   ./restore-db.sh backup_file.sql.gz postgresql://user:pass@host:port/db

BACKUP_FILE="${1:-}"
DATABASE_URL="${2:-${DATABASE_URL:-}}"

if [ -z "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not specified."
  echo "Usage: ./restore-db.sh <backup_file.sql.gz> [DATABASE_URL]"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set. Pass as second argument or set as environment variable."
  exit 1
fi

echo "=== RESTORE WARNING ==="
echo "Target database: $DATABASE_URL"
echo "Backup file: $BACKUP_FILE"
echo "This will OVERWRITE the current database contents."
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

echo "Restoring from $BACKUP_FILE at $(date -u +%Y-%m-%dT%H:%M:%SZ)..."

gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL" --set ON_ERROR_STOP=on 2>&1

echo "Restore completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)."
echo "Run 'npx prisma migrate deploy' to ensure migrations are in sync."
