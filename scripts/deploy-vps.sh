#!/usr/bin/env bash
# ─── Nazrah Al Alam — Manual VPS deploy ──────────────────────────────────────
# Copies config files to VPS and restarts the stack.
# Use this when you need to redeploy without pushing to GitHub.
#
# Prerequisites:
#   - SSH access to 76.13.40.119
#   - GHCR_TOKEN set (GitHub PAT with read:packages)
#   - GHCR_OWNER set (GitHub username, lowercase)
#   - APP_TAG set (image tag to deploy, e.g. latest or sha-abc1234)
#
# Usage:
#   GHCR_OWNER=youruser GHCR_TOKEN=ghp_xxx APP_TAG=latest npm run vps:deploy
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

VPS_HOST="${VPS_HOST:-76.13.40.119}"
VPS_USER="${VPS_USER:-root}"
VPS_DIR="/opt/nazrah"
APP_TAG="${APP_TAG:-latest}"
GHCR_OWNER="${GHCR_OWNER:?Set GHCR_OWNER env var}"
GHCR_TOKEN="${GHCR_TOKEN:?Set GHCR_TOKEN env var}"

echo "==> Copying config files to ${VPS_USER}@${VPS_HOST}:${VPS_DIR}"
rsync -avz --mkpath \
    docker-compose.yml \
    supervisord.conf \
    traefik/ \
    nginx/ \
    "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/"

echo "==> Deploying APP_TAG=${APP_TAG}"
ssh "${VPS_USER}@${VPS_HOST}" bash -s <<EOF
set -euo pipefail
cd ${VPS_DIR}

# Fix acme.json permissions
touch traefik/acme.json && chmod 600 traefik/acme.json

# GHCR login
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_OWNER}" --password-stdin

# Ensure infra services running
docker compose up -d --no-recreate traefik postgres redis watchtower

# Deploy app container
APP_TAG="${APP_TAG}" docker compose pull nazrah-all
docker rm -f nazrah-all 2>/dev/null || true
APP_TAG="${APP_TAG}" docker compose up -d --remove-orphans --no-deps nazrah-all

sleep 15
docker compose ps --format "table {{.Name}}\t{{.Status}}"
EOF

echo ""
echo "Done. App running at:"
echo "  https://nazrah-main.algarni.online"
echo "  https://nazrah-client.algarni.online"
echo "  https://nazrah-app.algarni.online"
