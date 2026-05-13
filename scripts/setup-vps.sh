#!/usr/bin/env bash
# ─── Nazrah Al Alam — VPS bootstrap ──────────────────────────────────────────
# Run once on VPS after removing Coolify-managed containers.
# Prereqs on VPS: docker, docker compose plugin, htpasswd (apache2-utils)
#
# Usage:
#   scp scripts/setup-vps.sh user@76.13.40.119:/tmp/
#   ssh user@76.13.40.119 "bash /tmp/setup-vps.sh"
#
# After this script: copy .env to /opt/nazrah/.env and run:
#   cd /opt/nazrah && docker compose up -d
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_DIR="/opt/nazrah"
GHCR_OWNER="${GHCR_OWNER:-}"   # set in env or pass as GHCR_OWNER=youruser bash setup-vps.sh
GHCR_TOKEN="${GHCR_TOKEN:-}"   # GitHub PAT with read:packages scope

echo "==> Creating directory structure"
mkdir -p "${DEPLOY_DIR}"/{traefik/auth,nginx,scripts}

echo "==> Installing dependencies (if missing)"
if ! command -v htpasswd &>/dev/null; then
    apt-get update -qq && apt-get install -y -qq apache2-utils
fi

# ── Traefik dashboard basic-auth ─────────────────────────────────────────────
HTPASSWD_FILE="${DEPLOY_DIR}/traefik/auth/dashboard.htpasswd"
if [[ ! -f "${HTPASSWD_FILE}" ]]; then
    echo ""
    echo "==> Set Traefik dashboard password"
    read -rp "  Username [admin]: " TRAEFIK_USER
    TRAEFIK_USER="${TRAEFIK_USER:-admin}"
    htpasswd -c "${HTPASSWD_FILE}" "${TRAEFIK_USER}"
    echo "  Created: ${HTPASSWD_FILE}"
else
    echo "==> Traefik htpasswd already exists, skipping"
fi

# ── Fix acme.json permissions ─────────────────────────────────────────────────
echo "==> Setting acme.json permissions"
mkdir -p "${DEPLOY_DIR}/traefik"
ACME_FILE="${DEPLOY_DIR}/traefik/acme.json"
touch "${ACME_FILE}"
chmod 600 "${ACME_FILE}"

# ── GHCR login ────────────────────────────────────────────────────────────────
if [[ -n "${GHCR_TOKEN}" && -n "${GHCR_OWNER}" ]]; then
    echo "==> Logging in to GHCR"
    echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_OWNER}" --password-stdin
else
    echo "==> Skipping GHCR login (set GHCR_OWNER and GHCR_TOKEN to auto-login)"
fi

# ── .env check ────────────────────────────────────────────────────────────────
if [[ ! -f "${DEPLOY_DIR}/.env" ]]; then
    echo ""
    echo "WARNING: ${DEPLOY_DIR}/.env not found."
    echo "  Copy .env.example to ${DEPLOY_DIR}/.env and fill in all values before"
    echo "  running: cd ${DEPLOY_DIR} && docker compose up -d"
else
    echo "==> .env found"
fi

echo ""
echo "Done. Next steps:"
echo "  1. Ensure ${DEPLOY_DIR}/.env is populated (see .env.example)"
echo "  2. Copy config files:"
echo "       scp -r traefik/ nginx/ supervisord.conf docker-compose.yml user@76.13.40.119:${DEPLOY_DIR}/"
echo "  3. Start stack:"
echo "       ssh user@76.13.40.119 'cd ${DEPLOY_DIR} && docker compose up -d'"
echo "  4. Trigger GitHub Actions deploy or push to master"
