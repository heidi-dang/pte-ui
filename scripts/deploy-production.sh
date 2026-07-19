#!/usr/bin/env bash
set -euo pipefail

# Production deploy script for PTE UI
# Called remotely by the GitHub Actions CI/CD workflow.
#
# Usage (on VPS):
#   VPS_APP_DIR=/home/deploy/pte-ui \
#   VPS_SERVICE_NAME=pte-ui \
#   VPS_HEALTHCHECK_URL=http://localhost:3000/api/health \
#   VPS_PUBLIC_URL=https://pte.tnaprovider.com.au \
#   DEPLOY_MODE=systemd \
#   bash scripts/deploy-production.sh
#
# Environment variables (all required):
#   VPS_APP_DIR          Path to the repository on the VPS
#   VPS_SERVICE_NAME     Systemd service or Docker Compose project name
#   VPS_HEALTHCHECK_URL  URL to verify the app is running (local)
#   VPS_PUBLIC_URL       Public HTTPS URL for post-deploy smoke test
#   DEPLOY_MODE          "systemd" or "docker"

echo "=== PTE UI Production Deploy ==="
echo "App dir:   $VPS_APP_DIR"
echo "Service:   $VPS_SERVICE_NAME"
echo "Mode:      $DEPLOY_MODE"

cd "$VPS_APP_DIR"

git fetch origin main
git reset --hard origin/main

bun install --frozen-lockfile

# ---- Prisma production preflight ----
echo "=== Prisma production preflight ==="
bunx prisma validate
bunx prisma generate
bunx prisma migrate deploy
echo "Prisma schema is up to date."

bun run build

if [ "$DEPLOY_MODE" = "docker" ]; then
  docker compose up -d --build
elif [ "$DEPLOY_MODE" = "systemd" ]; then
  # Ensure the systemd service has NODE_ENV=production and correct settings
  SERVICE_FILE="/etc/systemd/system/$VPS_SERVICE_NAME.service"
  if [ -f "$SERVICE_FILE" ]; then
    # Already exists — just ensure NODE_ENV=production is present
    if ! grep -q '^Environment=NODE_ENV=production' "$SERVICE_FILE" 2>/dev/null; then
      sudo sed -i '/^\[Service\]/a Environment=NODE_ENV=production' "$SERVICE_FILE"
      echo "Added NODE_ENV=production to $SERVICE_FILE"
    fi
    # Ensure KillMode is set to mixed for clean process cleanup
    if ! grep -q '^KillMode=mixed' "$SERVICE_FILE" 2>/dev/null; then
      sudo sed -i '/^\[Service\]/a KillMode=mixed' "$SERVICE_FILE"
      echo "Added KillMode=mixed to $SERVICE_FILE"
    fi
    # Ensure TimeoutStopSec is set
    if ! grep -q '^TimeoutStopSec=' "$SERVICE_FILE" 2>/dev/null; then
      sudo sed -i '/^\[Service\]/a TimeoutStopSec=30' "$SERVICE_FILE"
      echo "Added TimeoutStopSec=30 to $SERVICE_FILE"
    fi
    sudo systemctl daemon-reload
  else
    # Create new service file with all hardening
    sudo tee "$SERVICE_FILE" > /dev/null <<SERVICEEOF
[Unit]
Description=PTE Academic Master production server
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$VPS_APP_DIR
Environment=NODE_ENV=production
ExecStart=$(which node) $VPS_APP_DIR/dist/server.cjs
Restart=on-failure
RestartSec=5
KillMode=mixed
TimeoutStopSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF
    sudo systemctl daemon-reload
    echo "Created new service file $SERVICE_FILE with production hardening"
  fi

  # Restart with clean process tree
  echo "Restarting $VPS_SERVICE_NAME..."
  sudo systemctl kill -s KILL "$VPS_SERVICE_NAME" 2>/dev/null || true
  sleep 1
  # Kill orphaned node processes from manual SSH sessions that may still hold the port
  sudo pkill -f "dist/server.cjs" 2>/dev/null || true
  sleep 1
  sudo systemctl start "$VPS_SERVICE_NAME"

  # ---- Verify process ownership ----
  echo "=== Process ownership verification ==="
  ps -eo pid,ppid,cmd | grep -E "node .*dist/server.cjs" | grep -v grep || echo "WARNING: No dist/server.cjs process found"
  sleep 2
  sudo systemctl status "$VPS_SERVICE_NAME" --no-pager | head -15
else
  echo "Unsupported DEPLOY_MODE: $DEPLOY_MODE"
  exit 1
fi

# ---- Local health check ----
echo "=== Local health check ==="
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "$VPS_HEALTHCHECK_URL" >/dev/null 2>&1; then
    echo "Local health check passed (attempt $i)"
    break
  fi
  if [ "$i" -eq 10 ]; then
    echo "Local health check FAILED after 10 attempts"
    sudo journalctl -u "$VPS_SERVICE_NAME" -n 50 --no-pager
    exit 1
  fi
  sleep 2
done

# ---- Public smoke test ----
if [ -n "${VPS_PUBLIC_URL:-}" ]; then
  echo "=== Public smoke test: $VPS_PUBLIC_URL ==="
  for i in 1 2 3 4 5 6 7 8 9 10; do
    HTTP_CODE=$(curl -sI -o /dev/null -w '%{http_code}' "$VPS_PUBLIC_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
      echo "Public smoke test passed (HTTP $HTTP_CODE, attempt $i)"
      break
    fi
    if [ "$i" -eq 10 ]; then
      echo "Public smoke test FAILED after 10 attempts (last HTTP $HTTP_CODE)"
      exit 1
    fi
    sleep 2
  done
else
  echo "VPS_PUBLIC_URL not set, skipping public smoke test"
fi

echo "=== Deploy complete ==="
