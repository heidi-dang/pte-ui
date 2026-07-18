#!/usr/bin/env bash
set -euo pipefail

# Production deploy script for PTE UI
# Called remotely by the GitHub Actions CI/CD workflow.
#
# Usage (on VPS):
#   VPS_APP_DIR=/home/deploy/pte-ui \
#   VPS_SERVICE_NAME=pte-ui \
#   VPS_HEALTHCHECK_URL=http://localhost:3000/api/health \
#   DEPLOY_MODE=systemd \
#   bash scripts/deploy-production.sh
#
# Environment variables (all required):
#   VPS_APP_DIR        Path to the repository on the VPS
#   VPS_SERVICE_NAME   Systemd service or Docker Compose project name
#   VPS_HEALTHCHECK_URL URL to verify the app is running
#   DEPLOY_MODE        "systemd" or "docker"

cd "$VPS_APP_DIR"

git fetch origin main
git reset --hard origin/main

bun install --frozen-lockfile
bunx prisma validate
bunx prisma generate
bun run build

if [ "$DEPLOY_MODE" = "docker" ]; then
  docker compose up -d --build
elif [ "$DEPLOY_MODE" = "systemd" ]; then
  # Ensure NODE_ENV=production is set in the systemd service
  SERVICE_FILE="/etc/systemd/system/$VPS_SERVICE_NAME.service"
  if [ -f "$SERVICE_FILE" ]; then
    if ! sudo grep -q '^Environment=NODE_ENV=production' "$SERVICE_FILE"; then
      # Insert Environment=NODE_ENV=production after the [Service] section header
      sudo sed -i '/^\[Service\]/a Environment=NODE_ENV=production' "$SERVICE_FILE"
      echo "Added Environment=NODE_ENV=production to $SERVICE_FILE"
      sudo systemctl daemon-reload
    else
      echo "NODE_ENV=production already set in $SERVICE_FILE"
    fi
  else
    # Create a new service file with all required env vars
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
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF
    sudo systemctl daemon-reload
    echo "Created new service file $SERVICE_FILE with NODE_ENV=production"
  fi
  sudo systemctl restart "$VPS_SERVICE_NAME"
else
  echo "Unsupported DEPLOY_MODE: $DEPLOY_MODE"
  exit 1
fi

for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "$VPS_HEALTHCHECK_URL"; then
    echo "Health check passed"
    exit 0
  fi
  echo "Health check not ready yet, attempt $i"
  sleep 2
done

echo "Health check failed"
exit 1
