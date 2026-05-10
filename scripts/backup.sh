#!/usr/bin/env bash
## Nazrah Al Alam — Nightly Backup Script
##
## Backs up:
##   1. PostgreSQL database → encrypted .sql.gz.age
##   2. Supabase Storage bucket → rclone sync to object store
##
## Dependencies on VPS:
##   apt install postgresql-client rclone age
##
## Cron (run as deploy user):
##   0 2 * * * /opt/nazrah/scripts/backup.sh >> /var/log/nazrah-backup.log 2>&1
##
## Environment (sourced from /opt/nazrah/.env or exported in cron):
##   POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
##   AGE_RECIPIENT       — age public key of backup recipient
##   RCLONE_REMOTE       — rclone remote name (e.g., b2:nazrah-backups)
##   SUPABASE_PROJECT_REF
##   SUPABASE_SERVICE_ROLE_KEY
##   BACKUP_RETENTION_DAYS (default: 30)

set -euo pipefail

# ── Config ─────────────────────────────────────────────────────────────────────
ENV_FILE="/opt/nazrah/.env"
[[ -f "$ENV_FILE" ]] && set -a && source "$ENV_FILE" && set +a

TIMESTAMP="$(date -u '+%Y%m%dT%H%M%SZ')"
BACKUP_DIR="/opt/nazrah/backups/${TIMESTAMP}"
RETENTION="${BACKUP_RETENTION_DAYS:-30}"
LOG_PREFIX="[backup ${TIMESTAMP}]"

POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-nazrah}"
POSTGRES_DB="${POSTGRES_DB:-nazrah}"

# ── Helpers ────────────────────────────────────────────────────────────────────
log()  { echo "${LOG_PREFIX} $*"; }
fail() { echo "${LOG_PREFIX} ERROR: $*" >&2; exit 1; }

require_cmd() {
  command -v "$1" &>/dev/null || fail "'$1' not found. Install it first."
}

require_cmd pg_dump
require_cmd age
require_cmd gzip

[[ -n "${AGE_RECIPIENT:-}" ]] || fail "AGE_RECIPIENT not set"
[[ -n "${RCLONE_REMOTE:-}" ]] || fail "RCLONE_REMOTE not set (e.g. b2:nazrah-backups)"

mkdir -p "$BACKUP_DIR"
log "Backup started → $BACKUP_DIR"

# ─────────────────────────────────────────────────────────────────────────────
# 1. PostgreSQL dump
# ─────────────────────────────────────────────────────────────────────────────
log "Dumping PostgreSQL database '${POSTGRES_DB}'..."

PG_DUMP_FILE="${BACKUP_DIR}/postgres-${POSTGRES_DB}-${TIMESTAMP}.sql.gz"
PG_ENCRYPTED="${PG_DUMP_FILE}.age"

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  --host="$POSTGRES_HOST" \
  --port="$POSTGRES_PORT" \
  --username="$POSTGRES_USER" \
  --no-password \
  --format=plain \
  --no-owner \
  --no-privileges \
  "$POSTGRES_DB" \
  | gzip -9 \
  | age --recipient "$AGE_RECIPIENT" \
  > "$PG_ENCRYPTED"

PG_SIZE="$(du -sh "$PG_ENCRYPTED" | cut -f1)"
log "PostgreSQL dump complete: $PG_SIZE"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Upload PostgreSQL backup to object store
# ─────────────────────────────────────────────────────────────────────────────
require_cmd rclone

log "Uploading PostgreSQL backup to ${RCLONE_REMOTE}/postgres/..."

rclone copyto \
  "$PG_ENCRYPTED" \
  "${RCLONE_REMOTE}/postgres/$(basename "$PG_ENCRYPTED")" \
  --progress \
  --retries 3 \
  --log-level INFO

log "PostgreSQL backup uploaded"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Supabase Storage sync (uses Supabase's S3-compatible API)
# ─────────────────────────────────────────────────────────────────────────────
if [[ -n "${SUPABASE_PROJECT_REF:-}" && -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  log "Syncing Supabase Storage buckets..."

  # Supabase Storage exposes an S3-compatible API at:
  # https://<project-ref>.supabase.co/storage/v1/s3
  # Configure rclone with an S3 remote pointing to this endpoint.
  # See DEPLOYMENT.md § Supabase Storage backup for rclone config.

  rclone sync \
    "supabase-storage:/" \
    "${RCLONE_REMOTE}/supabase-storage/${TIMESTAMP}/" \
    --progress \
    --retries 3 \
    --log-level INFO \
    || log "WARNING: Supabase Storage sync failed (non-fatal)"

  log "Supabase Storage sync complete"
else
  log "SUPABASE_PROJECT_REF or SUPABASE_SERVICE_ROLE_KEY not set — skipping Supabase Storage backup"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. Cleanup local backup files
# ─────────────────────────────────────────────────────────────────────────────
log "Cleaning up local backup files..."
rm -rf "$BACKUP_DIR"
log "Local cleanup done"

# ─────────────────────────────────────────────────────────────────────────────
# 5. Rotate remote backups (delete files older than RETENTION days)
# ─────────────────────────────────────────────────────────────────────────────
log "Rotating remote backups older than ${RETENTION} days..."

rclone delete \
  "${RCLONE_REMOTE}/postgres/" \
  --min-age "${RETENTION}d" \
  --log-level INFO \
  || log "WARNING: Rotation of postgres backups failed (non-fatal)"

# For Supabase Storage backups, delete old dated folders
rclone delete \
  "${RCLONE_REMOTE}/supabase-storage/" \
  --min-age "${RETENTION}d" \
  --log-level INFO \
  || log "WARNING: Rotation of supabase-storage backups failed (non-fatal)"

log "Rotation complete — backups older than ${RETENTION} days removed"

# ─────────────────────────────────────────────────────────────────────────────
# 6. Report remote backup inventory
# ─────────────────────────────────────────────────────────────────────────────
REMOTE_COUNT="$(rclone lsf "${RCLONE_REMOTE}/postgres/" | wc -l)"
log "Remote postgres backups stored: ${REMOTE_COUNT}"

log "Backup completed successfully ✓"
