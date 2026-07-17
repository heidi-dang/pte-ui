# PTE UI Deployment

## Overview

Deployment is handled by GitHub Actions CI/CD. Every merge into `main` triggers an automatic build and deploy to the production VPS.

---

## CI/CD Pipeline

### Pull requests to `main`

- Runs quality checks only: install, Prisma validate, Prisma generate, lint, build.
- Does **not** deploy.
- PR must pass all checks before merging.

### Pushes / merges to `main`

1. Runs the same quality checks (must pass).
2. If quality checks pass, runs the **deploy** job.
3. Deploy job connects via SSH to the VPS, pulls `main`, builds, restarts the service, and runs a health check.

---

## Required GitHub Secrets (Environment: `production`)

| Secret | Description |
|---|---|
| `VPS_HOST` | VPS IP address or hostname |
| `VPS_USER` | SSH username on the VPS |
| `VPS_SSH_PRIVATE_KEY` | Private SSH key for the deploy user |
| `VPS_KNOWN_HOSTS` | Output of `ssh-keyscan -H <VPS_HOST>` |

## Required GitHub Variables (Environment: `production`)

| Variable | Description |
|---|---|
| `VPS_APP_DIR` | Absolute path to the repository on the VPS (e.g. `/home/deploy/pte-ui`) |
| `VPS_SERVICE_NAME` | Systemd service name (e.g. `pte-ui`) or Docker Compose project |
| `VPS_HEALTHCHECK_URL` | Local health check URL (e.g. `http://localhost:3000/api/health`) |
| `DEPLOY_MODE` | `systemd` or `docker` |

---

## VPS Setup

### 1. Create a deploy user

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
```

### 2. Install required tools

```bash
sudo apt update
sudo apt install -y git curl unzip

# Install Bun
curl -fsSL https://bun.sh/install | bash

# For Docker mode:
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker deploy
```

### 3. Clone the repository

```bash
su - deploy
git clone https://github.com/heidi-dang/pte-ui.git /home/deploy/pte-ui
cd /home/deploy/pte-ui
```

### 4. Create the production `.env` file

```bash
nano /home/deploy/pte-ui/.env
```

Required entries:

```
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="<generate-a-strong-secret>"
DEMO_MODE=false
SEED_ON_STARTUP=false
VITE_DEMO_MODE=false
UPLOAD_DIR=uploads
DEEPSEEK_API_KEY="<optional>"

# Demo mode is opt-in for production. Set DEMO_MODE=true and
# VITE_DEMO_MODE=true only on staging instances.
# SEED_ON_STARTUP requires DEMO_MODE=true to be effective.
```

### 5. Set up the systemd service

```bash
sudo nano /etc/systemd/system/pte-ui.service
```

Example service file:

```
[Unit]
Description=PTE UI Application Server
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/pte-ui
EnvironmentFile=/home/deploy/pte-ui/.env
ExecStart=/home/deploy/.bun/bin/bun run start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable pte-ui --now
```

### 6. Verify health check

```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","time":"..."}
```

### 7. Schema changes (Phase 3+)

This project uses Prisma with SQLite. Schema changes are applied via `prisma db push` rather than Prisma Migrate, because the project has existing SQLite databases without migration history.

**Before deploying schema changes to production:**

1. SSH into the VPS
2. Back up the production database:
   ```bash
   cp /home/deploy/pte-ui/prisma/prod.db /home/deploy/pte-ui/prisma/prod.db.backup.$(date +%Y%m%d_%H%M%S)
   ```
3. Deploy the new code
4. The deploy script will run `prisma db push` which applies any new columns or indexes without recreating tables

To apply schema changes locally:
```bash
bunx prisma db push
```

To review what would change without applying:
```bash
bunx prisma db push --dry-run
```

### 7. Schema changes (Phase 3+)

This project uses Prisma with SQLite. Schema changes are applied via `prisma db push` rather than Prisma Migrate because the project has existing SQLite databases without migration history.

**Before deploying schema changes to production:**

1. SSH into the VPS
2. Back up the production database:
   ```bash
   cp /home/deploy/pte-ui/prisma/prod.db /home/deploy/pte-ui/prisma/prod.db.backup.$(date +%Y%m%d_%H%M%S)
   ```
3. Deploy the new code
4. The deploy script will run `prisma db push` which applies new columns/indexes without recreating tables

To apply schema changes locally:
```bash
bunx prisma db push
```

To review what would change without applying:
```bash
bunx prisma db push --dry-run
```

### 8. Add VPS host key to GitHub secrets

From your local machine:

```bash
ssh-keyscan -H <VPS_HOST>
```

Copy the output and save it as the `VPS_KNOWN_HOSTS` GitHub secret.

---

## Rollback

If a deployment introduces issues:

```bash
# SSH into the VPS
ssh deploy@<VPS_HOST>

# Go to the app directory
cd /home/deploy/pte-ui

# View recent commits
git log --oneline -n 10

# Reset to a previous good commit
git reset --hard <previous-good-commit-hash>

# Rebuild and restart
bun install --frozen-lockfile
bunx prisma generate
bun run build
sudo systemctl restart pte-ui
```

For Docker mode:

```bash
docker compose up -d --build
```

---

## Disable Auto Deploy Temporarily

To stop automatic deployments without deleting the workflow:

1. Go to the GitHub repository → Settings → Environments → `production`.
2. Add a **required reviewer** or temporarily remove the deploy-related secrets.
3. Alternatively, push a commit that changes the deploy trigger condition.

---

## Architecture

See [architecture.md](architecture.md) for the full architecture documentation.
