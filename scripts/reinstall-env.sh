#!/bin/bash
set -e

echo "=== Admin Credential Setup ==="
echo ""

# Ask for admin email
read -p "Admin email: " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
  echo "Error: email is required."
  exit 1
fi

# Ask for admin password with hidden input
read -s -p "Admin password (min 16 chars): " ADMIN_PASSWORD
echo ""
if [ ${#ADMIN_PASSWORD} -lt 16 ]; then
  echo "Error: password must be at least 16 characters."
  exit 1
fi

# Confirm password
read -s -p "Confirm password: " CONFIRM_PASSWORD
echo ""
if [ "$ADMIN_PASSWORD" != "$CONFIRM_PASSWORD" ]; then
  echo "Error: passwords do not match."
  exit 1
fi

echo ""
echo "Updating .env with admin credentials..."

# Update or add values in .env
touch .env

update_env() {
  local key=$1
  local value=$2
  if grep -q "^${key}=" .env 2>/dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" .env
    else
      sed -i "s|^${key}=.*|${key}=${value}|" .env
    fi
  else
    echo "${key}=${value}" >> .env
  fi
}

update_env "ADMIN_EMAIL" "$ADMIN_EMAIL"
update_env "ADMIN_PASSWORD" "$ADMIN_PASSWORD"
update_env "ADMIN_NAME" "Platform Admin"
update_env "ADMIN_SEED_ENABLED" "true"

chmod 600 .env

echo ""
echo "=== Running admin seed/update ==="
bun run seed:admin

echo ""
echo "=== Done ==="
echo "Admin email: $ADMIN_EMAIL"
echo "You can now log in with the password you set."
echo ""
echo "To reset the admin password, run this script again."
echo "To disable admin seeding, set ADMIN_SEED_ENABLED=false in .env"
