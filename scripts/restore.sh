#!/usr/bin/env bash
## Nazrah Al Alam — Restore Script
## Usage:
##   ./scripts/restore.sh postgres <backup-filename>
##     Downloads the encrypted backup from the object store, decrypts, restores.
##
## Example:
##   ./scripts/restore.sh postgres postgres-nazrah-20260507T020000Z.sql.gz.age

set -euo pipefail

ENV_FILE="/opt/nazrah/.env"
[[ -f "$ENV_FILE" ]] && set -a && source "$ENV_FILE" && set +a

MODE="${1:-}"
BACKUP_FILE="${2:-}"

[[ -n "$MODE" && -n "$BACKUP_FILE" ]] || {
  echo "Usage: $0 postgres <backup-filename>" >&2
  exit 1
}

POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-nazrah}"
POSTGRES_DB="${POSTGRES_DB:-nazrah}"
RCLONE_REMOTE="${RCLONE_REMOTE:?RCLONE_REMOTE not set}"
AGE_IDENTITY="${AGE_IDENTITY:-$HOME/.config/age/key.txt}"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

case "$MODE" in
  postgres)
    echo "[restore] Downloading ${BACKUP_FILE} from ${RCLONE_REMOTE}/postgres/..."
    rclone copyto \
      "${RCLONE_REMOTE}/postgres/${BACKUP_FILE}" \
      "${WORK_DIR}/${BACKUP_FILE}" \
      --retries 3

    echo "[restore] Decrypting..."
    DECRYPTED="${WORK_DIR}/dump.sql.gz"
    age --decrypt \
      --identity "$AGE_IDENTITY" \
      --output "$DECRYPTED" \
      "${WORK_DIR}/${BACKUP_FILE}"

    echo "[restore] ⚠️  This will DROP and recreate database '${POSTGRES_DB}'."
    read -r -p "Type 'yes' to continue: " CONFIRM
    [[ "$CONFIRM" == "yes" ]] || { echo "Aborted."; exit 0; }

    echo "[restore] Restoring into ${POSTGRES_DB}..."
    PGPASSWORD="$POSTGRES_PASSWORD" psql \
      --host="$POSTGRES_HOST" \
      --port="$POSTGRES_PORT" \
      --username="$POSTGRES_USER" \
      --dbname="postgres" \
      -c "DROP DATABASE IF EXISTS ${POSTGRES_DB}; CREATE DATABASE ${POSTGRES_DB};"

    gunzip -c "$DECRYPTED" \
      | PGPASSWORD="$POSTGRES_PASSWORD" psql \
          --host="$POSTGRES_HOST" \
          --port="$POSTGRES_PORT" \
          --username="$POSTGRES_USER" \
          --dbname="$POSTGRES_DB"

    echo "[restore] ✓ Restore complete"
    ;;

  *)
    echo "Unknown mode: $MODE" >&2
    exit 1
    ;;
esac
