#!/bin/bash
set -euo pipefail

# DermaConsent — PostgreSQL Backup Script
# Designed for DigitalOcean Managed Database but works with any PostgreSQL instance.
#
# Usage:
#   ./backup-db.sh                          # Backup using DATABASE_URL env var
#   ./backup-db.sh postgresql://user:pass@host:port/db   # Backup using explicit URL
#
# Output: timestamped .sql.gz file in ./backups/

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${1:-${DATABASE_URL:-}}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/derma_consent_${TIMESTAMP}.sql.gz"

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set. Pass as argument or set as environment variable."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Starting backup at $(date -u +%Y-%m-%dT%H:%M:%SZ)..."
echo "Target: $BACKUP_FILE"

pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --format=plain \
  --verbose \
  2>&1 | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"

# Keep only last 30 backups
cd "$BACKUP_DIR"
ls -t derma_consent_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm -v
echo "Cleanup complete. Backups retained: $(ls derma_consent_*.sql.gz 2>/dev/null | wc -l)"
