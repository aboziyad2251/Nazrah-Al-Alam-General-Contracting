# Nazrah Al Alam — Deployment Guide

Hostinger VPS · Docker Compose · Traefik · Let's Encrypt

---

## File tree produced by this setup

```
.
├── Dockerfile.web                  # Next.js multi-stage build
├── Dockerfile.portal               # Vite → nginx multi-stage build
├── .dockerignore
├── docker-compose.yml              # Production services
├── docker-compose.monitoring.yml   # Optional: Loki + Grafana
├── traefik/
│   ├── traefik.yml                 # Traefik static config
│   ├── dynamic.yml                 # Middlewares (hot-reloaded)
│   └── auth/
│       └── .htpasswd               # Dashboard basic auth (you generate)
├── nginx/
│   └── portal.conf                 # nginx SPA config for portal
├── scripts/
│   ├── backup.sh                   # Nightly pg_dump + Supabase storage
│   └── restore.sh                  # Decrypt + restore from backup
├── .env.example                    # Template — copy to .env on VPS
└── .github/
    └── workflows/
        └── deploy.yml              # CI → build → SSH deploy
```

---

## Part 1 — VPS Provisioning

### 1.1 Order and access your Hostinger VPS

- OS: **Ubuntu 22.04 LTS** (KVM, minimum 2 vCPU / 4 GB RAM / 80 GB SSD)
- Enable root SSH in the Hostinger panel, then immediately create a non-root deploy user.

```bash
# On VPS as root
adduser deploy
usermod -aG sudo,docker deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

### 1.2 Install Docker Engine

```bash
# Update and install dependencies
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker apt repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | tee /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify
docker run --rm hello-world
docker compose version
```

### 1.3 Install backup dependencies

```bash
apt install -y postgresql-client rclone age
```

### 1.4 Configure UFW firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

---

## Part 2 — DNS Configuration

In your domain registrar (or Cloudflare), add the following **A records** pointing to your VPS IP:

| Hostname                   | Type | Value      | TTL |
| -------------------------- | ---- | ---------- | --- |
| `nazrahalalam.com`         | A    | `<VPS_IP>` | 300 |
| `www.nazrahalalam.com`     | A    | `<VPS_IP>` | 300 |
| `app.nazrahalalam.com`     | A    | `<VPS_IP>` | 300 |
| `traefik.nazrahalalam.com` | A    | `<VPS_IP>` | 300 |
| `grafana.nazrahalalam.com` | A    | `<VPS_IP>` | 300 |

> If using Cloudflare: set proxy status to **DNS only** (grey cloud) until TLS is confirmed working, then switch to Proxied.

---

## Part 3 — Server Setup

### 3.1 Clone the repository

```bash
mkdir -p /opt/nazrah
cd /opt/nazrah
git clone https://github.com/<your-org>/nazrah-monorepo.git .
```

### 3.2 Prepare Traefik ACME storage

Traefik needs a writable file to store Let's Encrypt certificates. Create it once:

```bash
mkdir -p traefik/auth
touch traefik/acme/acme.json
chmod 600 traefik/acme/acme.json
```

> The `acme.json` file is NOT checked into git (it contains live certs). It lives inside the `traefik-certs` Docker volume.  
> Actually Traefik writes to `/etc/traefik/acme/acme.json` inside the container, backed by the named volume — no host file needed.

### 3.3 Generate Traefik dashboard password

```bash
# Install apache2-utils if not present
apt install -y apache2-utils

# Generate htpasswd entry (replace 'admin' and 'yourpassword')
htpasswd -nb admin yourpassword | sed -e 's/\$/\$\$/g'
```

Copy the output line into `traefik/auth/.htpasswd`:

```bash
mkdir -p traefik/auth
# Paste the output from htpasswd above:
echo 'admin:$$apr1$$...' > traefik/auth/.htpasswd
```

### 3.4 Create the `.env` file

```bash
cp .env.example .env
nano .env   # Fill in all required values
chmod 600 .env
```

Minimum required values to fill:

- `GHCR_REPO` — your GitHub username/org (lowercase)
- `ACME_EMAIL` — must be a real email for Let's Encrypt notifications
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POSTGRES_PASSWORD` — strong random password
- `REDIS_PASSWORD` — strong random password

---

## Part 4 — Secrets Management

### 4.1 age encryption (recommended for team environments)

age lets you encrypt the `.env` file and check the ciphertext into git, so the production config is never lost but also never readable without the private key.

```bash
# On VPS: generate a key pair
age-keygen -o ~/.config/age/key.txt
# The output shows your public key: age1qqq...
cat ~/.config/age/key.txt | grep "Public key"
```

Copy that public key into `.env.example` as `AGE_RECIPIENT=age1qqq...`.

```bash
# Encrypt .env → .env.production.age (safe to commit)
age --encrypt --recipient age1qqq... .env > .env.production.age

# Decrypt on VPS
age --decrypt --identity ~/.config/age/key.txt .env.production.age > .env
```

Check in `.env.production.age` (add to git), and add `.env` to `.gitignore`.

### 4.2 GitHub Actions secrets

In your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

| Secret name                     | Value                                         |
| ------------------------------- | --------------------------------------------- |
| `GHCR_TOKEN`                    | GitHub PAT: `packages:write`, `contents:read` |
| `SSH_PRIVATE_KEY`               | Contents of `~/.ssh/id_ed25519` (deploy key)  |
| `SSH_HOST`                      | VPS IP address                                |
| `SSH_USER`                      | `deploy`                                      |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                             |
| `VITE_SUPABASE_URL`             | Same Supabase project URL                     |
| `VITE_SUPABASE_ANON_KEY`        | Same Supabase anon key                        |
| `SLACK_WEBHOOK_URL`             | Optional — deploy notifications               |

### 4.3 Add deploy SSH key to VPS

```bash
# On your local machine: generate a dedicated deploy key
ssh-keygen -t ed25519 -C "nazrah-deploy" -f ~/.ssh/nazrah_deploy

# Copy the public key to VPS
ssh-copy-id -i ~/.ssh/nazrah_deploy.pub deploy@<VPS_IP>

# Test
ssh -i ~/.ssh/nazrah_deploy deploy@<VPS_IP> "echo ok"
```

Add the **private key** (`~/.ssh/nazrah_deploy`) as the `SSH_PRIVATE_KEY` GitHub Secret.

---

## Part 5 — First Deployment

### 5.1 Authenticate with GHCR on VPS

```bash
# On VPS (as deploy user)
# Use a GitHub PAT with packages:read scope
echo "ghp_yourtoken" | docker login ghcr.io -u yourusername --password-stdin
```

### 5.2 Pull and start services

```bash
cd /opt/nazrah

# Pull latest images
docker compose pull

# Start all services
docker compose up -d

# Watch logs
docker compose logs -f --tail=50
```

### 5.3 Verify TLS certificates

After services start, Traefik requests Let's Encrypt certificates automatically via HTTP-01 challenge. This takes ~30 seconds.

```bash
# Check certificate status
docker compose logs traefik | grep -i "acme\|certificate\|error"

# Verify HTTPS is working
curl -I https://www.nazrahalalam.com
curl -I https://app.nazrahalalam.com
```

Expected: `HTTP/2 200` with `strict-transport-security` header.

### 5.4 Verify all containers are healthy

```bash
docker compose ps
```

Expected output (all `healthy`):

```
NAME              IMAGE                              STATUS
traefik           traefik:v3.2                       healthy
nazrah-web        ghcr.io/.../nazrah-web:latest      healthy
nazrah-portal     ghcr.io/.../nazrah-portal:latest   healthy
nazrah-postgres   postgres:16-alpine                 healthy
nazrah-redis      redis:7-alpine                     healthy
watchtower        containrrr/watchtower:1.7.1        running
```

---

## Part 6 — Continuous Deployment

After the initial setup, every push to `main` triggers the GitHub Actions workflow automatically:

1. **quality** — `pnpm typecheck` + `pnpm lint` on all workspaces
2. **build** — builds both Docker images with build-time secrets, pushes to GHCR tagged `sha-<short-sha>` and `latest`
3. **deploy** — SSHes into VPS, pulls the new images, does a rolling restart

To trigger manually:

```bash
# GitHub CLI
gh workflow run deploy.yml --ref main
```

---

## Part 7 — Backup Setup

### 7.1 Configure rclone for Backblaze B2 (or S3)

```bash
rclone config
# Choose: n (new remote)
# Name: b2
# Type: b2
# Account ID: your B2 account ID
# Application Key: your B2 app key
# Test: rclone lsd b2:
```

For Supabase Storage backup, add an additional S3-compatible remote:

```bash
rclone config
# Name: supabase-storage
# Type: s3
# Provider: Other
# Endpoint: https://<project-ref>.supabase.co/storage/v1/s3
# Access Key ID: <project-ref>
# Secret Access Key: <service-role-key>
# Region: us-east-1 (required but ignored by Supabase)
```

### 7.2 Make the backup script executable and test

```bash
chmod +x /opt/nazrah/scripts/backup.sh
chmod +x /opt/nazrah/scripts/restore.sh

# Test run (check for errors before scheduling)
/opt/nazrah/scripts/backup.sh
```

### 7.3 Schedule nightly cron at 02:00 UTC

```bash
crontab -e
# Add:
0 2 * * * /opt/nazrah/scripts/backup.sh >> /var/log/nazrah-backup.log 2>&1
```

### 7.4 Restore from backup

```bash
# List available backups
rclone lsf b2:nazrah-backups/postgres/

# Restore a specific backup
/opt/nazrah/scripts/restore.sh postgres postgres-nazrah-20260507T020000Z.sql.gz.age
```

---

## Part 8 — Monitoring (Optional)

### 8.1 Configure Loki + Grafana

```bash
mkdir -p monitoring/grafana/provisioning/{datasources,dashboards}

# Loki config
cat > monitoring/loki-config.yml << 'EOF'
auth_enabled: false
server:
  http_listen_port: 3100
ingester:
  chunk_idle_period: 3m
  max_chunk_age: 1h
schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h
storage_config:
  tsdb_shipper:
    active_index_directory: /loki/index
    cache_location: /loki/index_cache
  filesystem:
    directory: /loki/chunks
limits_config:
  reject_old_samples: true
  reject_old_samples_max_age: 168h
EOF

# Promtail config — auto-discovers all Docker containers
cat > monitoring/promtail-config.yml << 'EOF'
server:
  http_listen_port: 9080
positions:
  filename: /tmp/positions.yaml
clients:
  - url: http://loki:3100/loki/api/v1/push
scrape_configs:
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        target_label: container
      - source_labels: ['__meta_docker_container_image']
        target_label: image
EOF

# Grafana Loki datasource
cat > monitoring/grafana/provisioning/datasources/loki.yml << 'EOF'
apiVersion: 1
datasources:
  - name: Loki
    type: loki
    url: http://loki:3100
    isDefault: true
    editable: false
EOF
```

### 8.2 Start monitoring stack

```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### 8.3 Access Grafana

- Via SSH tunnel: `ssh -L 3001:localhost:3001 deploy@<VPS_IP>`
- Via HTTPS: `https://grafana.nazrahalalam.com` (after DNS propagates)
- Default login: `admin` / value of `GRAFANA_ADMIN_PASSWORD` in `.env`

---

## Part 9 — Maintenance

### Updating a single service

```bash
cd /opt/nazrah
WEB_TAG=sha-abc1234 docker compose up -d --no-deps nazrah-web
```

### Rolling back

```bash
# Roll back web to previous SHA
WEB_TAG=sha-abc1111 docker compose up -d --no-deps nazrah-web
```

### Checking real-time logs

```bash
docker compose logs -f nazrah-web
docker compose logs -f nazrah-portal
docker compose logs -f traefik
```

### Accessing Traefik dashboard

```bash
# SSH tunnel to your local port 9090
ssh -L 9090:localhost:8080 deploy@<VPS_IP>
# Open: http://localhost:9090/dashboard/
```

### Updating Traefik middleware config without restart

Edit `traefik/dynamic.yml` on the VPS — Traefik hot-reloads it automatically.

### Renewing certificates

Let's Encrypt certificates auto-renew via Traefik. To force renewal:

```bash
docker compose restart traefik
```

### Adding the admin panel

Once `apps/admin` is production-ready:

1. Add a `Dockerfile.admin` (same pattern as `Dockerfile.portal`)
2. Build and push to GHCR via CI
3. Uncomment the `nazrah-admin` service in `docker-compose.yml`
4. Add `admin.nazrahalalam.com` DNS A record
5. `docker compose up -d nazrah-admin`

---

## Part 10 — Troubleshooting

### TLS certificate not issuing

```bash
# Check Traefik logs for ACME errors
docker compose logs traefik | grep -i "acme\|challeng\|error"

# Common causes:
# - Port 80 blocked by UFW → ufw allow 80/tcp
# - DNS not propagated → dig +short www.nazrahalalam.com
# - Rate limit hit → wait 1 hour (Let's Encrypt: 5 failures/hr per domain)
```

### Next.js server.js path after monorepo build

If the container exits immediately, the standalone server.js path may differ.
Inspect the build artifact:

```bash
# Run the builder stage interactively
docker run --rm -it \
  $(docker build -q --target builder -f Dockerfile.web .) \
  find /app/apps/web/.next/standalone -name "server.js"
```

Adjust the `CMD` in `Dockerfile.web` to match the path found.

### Portal shows blank page

The Vite SPA needs all routes to return `index.html`. Verify nginx is working:

```bash
docker compose exec nazrah-portal wget -qO- http://localhost:8080/some-deep-route
# Should return index.html content, not 404
```

### Database connection refused

Postgres binds to `127.0.0.1:5432` on the host. Connect from within the Docker network using the service name:

```bash
# From another container on the backend network
docker compose exec nazrah-postgres psql -U nazrah -d nazrah
```

### Container out of memory

```bash
docker stats --no-stream
# Increase VPS RAM tier in Hostinger panel, or adjust container limits:
# Add to docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       memory: 1g
```
