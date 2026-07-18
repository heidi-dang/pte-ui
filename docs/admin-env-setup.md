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
4. Write values to `.env` with quoted escaping (handles all special characters)
5. Set `chmod 600 .env`
6. Run `bunx prisma generate` and `bunx prisma db push`
7. Run `bun run seed:admin`
8. Print success with admin email (password never printed)

## Supported

- Only `scripts/seed-admin.ts` is the approved admin setup path
- `scripts/create-admin.ts` does not exist; if found, remove it
- Passwords with special characters (&, |, /, \, spaces, etc.) are supported
- Password is written only to local `.env` (never committed, never printed)
- Plaintext password is only stored in `.env` (600 permissions), not in the database
- Database stores bcrypt hash only

## Rerunning

Running the script again updates the same admin account — it does not create duplicates.
To reset a lost admin password, run `bash scripts/reinstall-env.sh` again.

## Safety

- `.env` is in `.gitignore` — never committed
- `.env.example` contains placeholder values only
- Admin password is stored as bcrypt hash in the database
- Plaintext password is never logged or printed
- Set `ADMIN_SEED_ENABLED=false` to disable admin seeding
- Run `chmod 600 .env` after updating it manually
