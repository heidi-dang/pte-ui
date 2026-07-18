#!/bin/bash
set -e

echo "=== Admin Credential Setup ==="
echo ""

read -p "Admin email: " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
  echo "Error: email is required."
  exit 1
fi

read -s -p "Admin password (min 16 chars): " ADMIN_PASSWORD
echo ""
if [ ${#ADMIN_PASSWORD} -lt 16 ]; then
  echo "Error: password must be at least 16 characters."
  exit 1
fi

read -s -p "Confirm password: " CONFIRM_PASSWORD
echo ""
if [ "$ADMIN_PASSWORD" != "$CONFIRM_PASSWORD" ]; then
  echo "Error: passwords do not match."
  exit 1
fi

echo ""
echo "Saving credentials to .env..."

update_env() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"

  if [ -f .env ]; then
    grep -v "^${key}=" .env > "$tmp" || true
  fi

  local escaped_value
  escaped_value="$(printf "%s" "$value" | sed 's/\\/\\\\/g; s/"/\\"/g')"
  printf "%s=\"%s\"\n" "$key" "$escaped_value" >> "$tmp"
  mv "$tmp" .env
}

update_env "ADMIN_EMAIL" "$ADMIN_EMAIL"
update_env "ADMIN_PASSWORD" "$ADMIN_PASSWORD"
update_env "ADMIN_NAME" "Platform Admin"
update_env "ADMIN_SEED_ENABLED" "true"

chmod 600 .env

echo ""
echo "=== Running Prisma setup ==="
bunx prisma generate
bunx prisma db push

echo ""
echo "=== Running admin seed/update ==="
bun run seed:admin

echo ""
echo "=== Done ==="
echo "Admin email: $ADMIN_EMAIL"
echo "You can now log in with the password you set."
echo "To reset the admin password, run this script again."
echo "To disable admin seeding, set ADMIN_SEED_ENABLED=false in .env"
