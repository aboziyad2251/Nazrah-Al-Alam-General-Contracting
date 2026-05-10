#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Nazrah Al Alam — One-shot VPS bootstrap
# Run as root on a fresh Ubuntu 22.04 LTS Hostinger VPS:
#   curl -fsSL https://raw.githubusercontent.com/aboziyad2251/Nazrah-Al-Alam-General-Contracting/master/scripts/setup-vps.sh | bash
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_USER="deploy"
APP_DIR="/opt/nazrah"
REPO="https://github.com/aboziyad2251/Nazrah-Al-Alam-General-Contracting.git"

echo "════════════════════════════════════════"
echo " Nazrah Al Alam — VPS Setup"
echo "════════════════════════════════════════"

# ── 1. System updates ─────────────────────────────────────────────────────────
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git ufw htpasswd

# ── 2. Docker (official repo) ─────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "→ Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
docker --version

# ── 3. Firewall ───────────────────────────────────────────────────────────────
echo "→ Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status

# ── 4. Deploy user ────────────────────────────────────────────────────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "→ Creating deploy user..."
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"
  mkdir -p "/home/$DEPLOY_USER/.ssh"
  chmod 700 "/home/$DEPLOY_USER/.ssh"
  touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
  chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
  echo "  ⚠  Add your CI public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
fi

# ── 5. App directory ──────────────────────────────────────────────────────────
echo "→ Creating app directory $APP_DIR..."
mkdir -p "$APP_DIR"/{traefik/auth,nginx}
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

# ── 6. Clone repo for compose + config files ──────────────────────────────────
if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
  echo "→ Cloning repo config files..."
  git clone --depth 1 "$REPO" /tmp/nazrah-setup
  cp /tmp/nazrah-setup/docker-compose.yml          "$APP_DIR/"
  cp /tmp/nazrah-setup/traefik/traefik.yml          "$APP_DIR/traefik/"
  cp /tmp/nazrah-setup/traefik/dynamic.yml          "$APP_DIR/traefik/"
  cp /tmp/nazrah-setup/nginx/portal.conf            "$APP_DIR/nginx/"
  cp /tmp/nazrah-setup/nginx/admin.conf             "$APP_DIR/nginx/"
  cp /tmp/nazrah-setup/.env.production.example      "$APP_DIR/.env.example"
  rm -rf /tmp/nazrah-setup
fi

# ── 7. .env file ──────────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo ""
  echo "  ✏  Edit $APP_DIR/.env before starting services:"
  echo "     nano $APP_DIR/.env"
fi

# ── 8. Traefik auth dir ───────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/traefik/auth/.htpasswd" ]; then
  echo "→ Generating Traefik dashboard credentials..."
  DASHBOARD_PASS=$(openssl rand -base64 20)
  htpasswd -bc "$APP_DIR/traefik/auth/.htpasswd" admin "$DASHBOARD_PASS"
  echo "  Traefik dashboard  user: admin"
  echo "  Traefik dashboard  pass: $DASHBOARD_PASS  ← SAVE THIS"
fi

# ── 9. ACME cert storage ──────────────────────────────────────────────────────
ACME_VOL=$(docker volume inspect traefik-certs 2>/dev/null | grep Mountpoint | awk -F'"' '{print $4}')
if [ -z "$ACME_VOL" ]; then
  docker volume create traefik-certs
fi

# ── 10. Backup cron (nightly 2 AM) ───────────────────────────────────────────
if [ ! -f "/tmp/nazrah-setup/scripts/backup.sh" ]; then
  echo "→ Backup script will be set up after first deploy (needs .env loaded)"
fi
CRON_LINE="0 2 * * * cd $APP_DIR && bash scripts/backup.sh >> /var/log/nazrah-backup.log 2>&1"
( crontab -u "$DEPLOY_USER" -l 2>/dev/null | grep -v backup.sh; echo "$CRON_LINE" ) \
  | crontab -u "$DEPLOY_USER" -

# ── 11. GitHub Secrets reminder ───────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo " ✅  VPS setup complete!"
echo "════════════════════════════════════════"
echo ""
echo " Next steps:"
echo ""
echo " 1. Fill in /opt/nazrah/.env"
echo "    nano /opt/nazrah/.env"
echo ""
echo " 2. Point DNS A records to this VPS IP: $(curl -s ifconfig.me)"
echo "    nazrahalalam.com      → <this IP>"
echo "    www.nazrahalalam.com  → <this IP>"
echo "    app.nazrahalalam.com  → <this IP>"
echo "    admin.nazrahalalam.com → <this IP>"
echo "    traefik.nazrahalalam.com → <this IP>"
echo ""
echo " 3. Add GitHub Secrets at:"
echo "    https://github.com/aboziyad2251/Nazrah-Al-Alam-General-Contracting/settings/secrets/actions"
echo ""
echo "    GHCR_TOKEN              — GitHub PAT (packages:write + contents:read)"
echo "    SSH_HOST                — $(curl -s ifconfig.me)"
echo "    SSH_USER                — $DEPLOY_USER"
echo "    SSH_PRIVATE_KEY         — private key matching authorized_keys above"
echo "    NEXT_PUBLIC_SUPABASE_URL"
echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "    VITE_SUPABASE_URL"
echo "    VITE_SUPABASE_ANON_KEY"
echo "    SLACK_WEBHOOK_URL       — optional"
echo ""
echo " 4. Add deploy user's SSH public key:"
echo "    nano /home/$DEPLOY_USER/.ssh/authorized_keys"
echo ""
echo " 5. First deploy — start services manually:"
echo "    cd /opt/nazrah && docker compose up -d"
echo ""
echo " 6. After first push to master → CI builds & deploys automatically."
echo "════════════════════════════════════════"
