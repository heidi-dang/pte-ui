# Admin Environment Credential Setup

## Configure admin login

Set these environment variables in `.env`:

```
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-secure-password-min-16-chars
ADMIN_NAME=Platform Admin
ADMIN_SEED_ENABLED=true
```

Then run:

```bash
bun run seed:admin
```

Or use the interactive script:

```bash
bash scripts/reinstall-env.sh
```

## Interactive script

`scripts/reinstall-env.sh` will:
1. Prompt for admin email
2. Prompt for admin password (hidden input, min 16 chars)
3. Confirm password
4. Write values to `.env` with `chmod 600`
5. Run `bun run seed:admin`
6. Print success with admin email (password never printed)

## Re-running

Running the script again updates the same admin account — it does not create duplicates.
To reset a lost admin password, run `bash scripts/reinstall-env.sh` again.

## Safety

- `.env` is in `.gitignore` — never committed
- `.env.example` contains placeholder values only
- Admin password is stored as bcrypt hash in the database
- Plaintext password is never logged or printed
- Set `ADMIN_SEED_ENABLED=false` to disable admin seeding
- Run `chmod 600 .env` after updating it manually
