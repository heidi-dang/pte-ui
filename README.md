# PTE UI — Production PTE Preparation Platform

A production-ready PTE Academic preparation platform with a full student portal, 22 task-type practice engine, auto-grading, mock exams, progress analytics, and a CMS-backed question bank. Delivered as a monorepo with a React + Vite frontend, Express API server, Prisma + PostgreSQL database layer, and a GitHub Actions CI/CD pipeline.

---

## Production Status

| Attribute | Value |
|-----------|-------|
| Production-ready | Yes |
| Student Portal rollout | Closed |
| Final audit score | ≥ 9.5 / 10 |
| P0 defects | 0 |
| P1 defects | 0 |
| Production health | Passing |
| Latest deploy | Successful |

**Key milestones:**
- Rollup PR [#57](https://github.com/heidi-dang/pte-ui/pull/57) — consolidated all student portal PRs into main
- Closure docs PR [#58](https://github.com/heidi-dang/pte-ui/pull/58) — recorded final state
- P2 backlog documented separately at [`docs/student-portal/p2-backlog.md`](./docs/student-portal/p2-backlog.md)

---

## Core Features

### Student Portal
| Feature | Description |
|---------|-------------|
| Dashboard | Greeting, target score, exam date, readiness, daily plan, recent activity, weak areas, subscription summary. 11 sub-components aggregated via a single `GET /api/student/dashboard` endpoint. |
| Practice Library | Task card grid, skill-group sections, search + section filter + sort. All 22 PTE task types displayed dynamically from the central registry. |
| Question Browser | Paginated filterable grid (task code, section, difficulty, search). Select questions for custom practice sets. |
| Custom Practice Builder | 3-step wizard: select tasks → configure count/difficulty → preview and start. |
| Reading Engine | MCS, MCM, ROP, FIBR, FIBRW — passage display, response capture, submission. |
| Listening Engine | SST, FIBL, HCS, MCSSL, MCMSL, SMW, HIW, WFD — audio playback, prompt-playing phase, response capture. |
| Speaking Engine | RA, RS, DI, RL, ASQ, SGD, RTS — recording phase, microphone access, audio upload. |
| Writing Engine | SWT, WE — dynamic task timing, text response capture. |
| Session Manager | Question progress sidebar, session-level timer, per-question timing, auto-submit on timer expiry, exit button, "View Results" on final question. |
| Draft / Session Recovery | Client-side localStorage persistence. Answers are saved on each change and restored on page refresh with a visual indicator. |
| Instant Feedback | Auto-grading for deterministic tasks (MCS, MCM, ROP, FIBR, FIBRW, FIBL, HCS, MCSSL, MCMSL, SMW, HIW, WFD, ASQ). Feedback panel with correct/incorrect status, user vs expected answer, score percentage, color-coded badges. |
| Review Page | Search, section filter, sort by date, expandable rows with feedback. |
| Progress Analytics | Section performance bars, 14-day score trend line chart, task breakdown grid with sparklines, summary cards, recent activity timeline. |
| Mock Exam / Performance History | Mock exam attempt list, combined practice + mock score trend, section averages, multi-section breakdown by exam. |
| Mobile Responsive | Desktop sidebar, mobile bottom navigation with "More" drawer. Verified at 320×568 through 1920×1080. Practice session usable at 320 px. |

### Question Bank / CMS
| Feature | Description |
|---------|-------------|
| Question management | CRUD for question bank items through admin panel. |
| Hidden content boundary | Student-safe question projection — sensitive fields stripped. |
| Publish validation | Schema-based validation before publication. |
| API contracts | Shared TypeScript types between client and server. |
| Question bank navigation | Paginated listing, task code filtering, search. |

### Scoring
| Feature | Description |
|---------|-------------|
| Deterministic scoring | 14 task types graded with exact-match and fuzzy-text algorithms (WFD, FIBL, ROP, etc.). |
| AI scoring | DeepSeek API integration for speaking and writing tasks. Configurable provider with local fake fallback. |
| Feedback panel | Per-question correct/incorrect display, expected answer, score percentage, color-coded badges. |
| Progress tracking | Per-section and per-task score aggregation, 14-day trends, weak-area identification. |

---

## PTE Task Coverage

All 22 PTE Academic task types are implemented:

### Speaking (7)
| Code | Name |
|------|------|
| RA | Read Aloud |
| RS | Repeat Sentence |
| DI | Describe Image |
| RL | Retell Lecture |
| ASQ | Answer Short Question |
| SGD | Summarize Group Discussion |
| RTS | Respond to a Situation |

### Writing (2)
| Code | Name |
|------|------|
| SWT | Summarize Written Text |
| WE | Write Essay |

### Reading (5)
| Code | Name |
|------|------|
| MCS | Multiple Choice, Single Answer |
| MCM | Multiple Choice, Multiple Answers |
| ROP | Re-order Paragraphs |
| FIBR | Fill in the Blanks (Reading) |
| FIBRW | Reading & Writing: Fill in the Blanks |

### Listening (8)
| Code | Name |
|------|------|
| SST | Summarize Spoken Text |
| MCMSL | Multiple Choice, Multiple Answers |
| FIBL | Fill in the Blanks (Listening) |
| HCS | Highlight Correct Summary |
| MCSSL | Multiple Choice, Single Answer |
| SMW | Select Missing Word |
| HIW | Highlight Incorrect Words |
| WFD | Write from Dictation |

Each task type has a `CanonicalTaskContract` registered in the central contract registry and a dedicated `Renderer.tsx` component. All types are loaded dynamically — no hardcoded task lists in student components.

---

## Architecture

```
Student Browser
     ↓
Student Portal UI (React + Vite)
     ↓
Practice / Mock / Review / Dashboard APIs
     ↓
Express Server (src/server/)
     ↓
Prisma ORM
     ↓
PostgreSQL Database
```

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS. 22 task renderers loaded via dynamic module registry.
- **API Server**: Express.js with route modules for student, admin, auth, and scoring.
- **Database**: PostgreSQL via Prisma ORM. Migrations managed with `prisma migrate`.
- **CI/CD**: GitHub Actions — quality checks, server smoke tests, Playwright E2E, and production deploy on push to `main`.
- **Deployment**: systemd service behind the Express production server on the VPS.

---

## Repository Structure

| Path | Purpose |
|------|---------|
| `src/` | Application source code |
| `src/components/` | React components — student portal, admin UI, reused UI primitives |
| `src/components/student/` | Student Portal pages, shell, sidebar, navigation |
| `src/practice/` | Practice engine — task renderers, contracts, scoring, hooks, components |
| `src/practice/tasks/` | 22 individual task renderers (one directory per `PTETaskCode`) |
| `src/practice/contracts/` | Task type metadata, validation schemas, publish validation |
| `src/practice/scoring/` | Deterministic scoring algorithms |
| `src/practice/hooks/` | React hooks for audio recording, timers, submission history, session draft recovery |
| `src/api/` | API client functions (student, admin endpoints) |
| `src/server/` | Express server — route handlers, middleware, jobs, AI service, speech-to-text |
| `src/server/routes/` | Route modules (auth, admin, student, practice) |
| `src/server/jobs/` | Background job queue and workers |
| `src/shared/` | Shared types, routes, API type definitions shared between client and server |
| `prisma/` | Prisma schema and migrations |
| `scripts/` | Smoke tests, integration tests, regression tests, seed scripts |
| `scripts/smoke/` | Offline and server-dependent smoke tests |
| `scripts/integration/` | Behavioural integration tests |
| `tests/` | Playwright E2E tests, API tests, contract tests, scoring tests |
| `docs/` | Audits, student portal closure docs, P2 backlog |
| `.github/workflows/` | CI/CD pipeline definition |

---

## Requirements

| Tool | Version / Notes |
|------|-----------------|
| [Bun](https://bun.sh) | Runtime for development, test execution, and production (lockfile: `bun.lock`) |
| Node.js | Required at runtime for the production server (`node dist/server.cjs`) |
| PostgreSQL | Production database |
| Prisma | ORM and migration tool (v6.19.3) |
| GitHub CLI (`gh`) | Required for PR workflow and CI monitoring |

Optional:
- **DeepSeek API key** — for AI-powered scoring of speaking and writing tasks. Not required for core student portal functionality.
- **AWS S3 credentials** — for audio file storage. Local file system fallback available.

---

## Environment Variables

Refer to `.env.example` for the full list with documentation. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Must start with `postgresql://` in production. |
| `NODE_ENV` | Yes | Set to `production` in production; `development` or `test` otherwise. |
| `PORT` | No | Server port (default: 3000). |
| `JWT_SECRET` | Yes | Secret key for JWT token signing. |
| `DEEPSEEK_API_KEY` | No | API key for DeepSeek AI scoring (required only if `AI_PROVIDER=deepseek`). |
| `AI_PROVIDER` | No | Scoring provider (`fake` for local fallback, `deepseek` for AI). Default: `fake`. |
| `DEMO_MODE` | No | Enables demo data and seed endpoints. Must be `false` in production. |
| `SEED_ON_STARTUP` | No | Auto-seeds demo accounts on server start. Must be `false` in production. |
| `UPLOAD_DIR` | No | Directory for file uploads (default: `uploads`). |
| `ADMIN_EMAIL` | For seed | Admin account email. |
| `ADMIN_PASSWORD` | For seed | Admin account password. |
| `ADMIN_SEED_ENABLED` | No | Must be `true` for admin seed script to run. |

**Production `DATABASE_URL` format:**
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Additional optional variables (AWS S3, STT provider, TTS, job queue tuning) are documented in `.env.example`.

---

## Local Development Setup

```bash
# Clone the repository
git clone https://github.com/heidi-dang/pte-ui.git
cd pte-ui

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, JWT_SECRET, and NODE_ENV

# Generate Prisma client
bunx prisma generate

# Run database migrations
bunx prisma migrate dev

# Start the development server
bun run dev
```

The server starts at `http://localhost:3000`.

---

## Database and Migrations

- **ORM**: Prisma v6.19.3
- **Production**: PostgreSQL
- **Local/Dev**: SQLite (via `DATABASE_URL=file:./prisma/dev.db`)

Prisma commands:

```bash
# Validate schema
bunx prisma validate

# Generate Prisma client
bunx prisma generate

# Apply pending migrations (production)
bunx prisma migrate deploy

# Create and apply a new migration (development)
bunx prisma migrate dev --name <migration_name>
```

**Production rule:** Never run `prisma migrate reset` or `prisma db push` against a production database. Always use `prisma migrate deploy` with version-controlled migrations.

---

## Running the App

```bash
# Development (hot reload via tsx)
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Seed admin account
ADMIN_SEED_ENABLED=true bun run seed:admin
```

---

## Testing

```bash
# Type-check
bun run lint          # tsc --noEmit
bun run typecheck     # tsc --noEmit (alias)

# Full test suite (offline smoke tests + integration)
bun run test

# Targeted smoke tests
bun run smoke:practice-submission
bun run smoke:upload-auth-boundary

# Build verification
bun run build

# Playwright E2E (requires running server)
npx playwright test tests/e2e/

# Prisma validation
bunx prisma validate

# Regression tests (question bank worker pipeline)
bun run regression:question-bank-worker:offline
```

---

## CI/CD

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and runs on every PR and push to `main`.

| Job | Description |
|-----|-------------|
| Quality checks | TypeScript type-check, Prisma validate, lint gates (PracticeEngine line count, legacy endpoint references, fake test assertions), build, offline smoke tests, integration tests. Runs against a PostgreSQL service container. |
| Server smoke tests | Builds the server, starts it, and runs server-dependent smoke tests (upload, practice submission, mock exam). |
| Live server Playwright E2E | Builds the server, starts it, and runs `tests/e2e/live-server.spec.ts`. |
| Deploy to VPS | **Push to `main` only.** Connects via SSH, pulls latest code, runs Prisma preflight (validate + generate + migrate), builds, restarts the systemd service, and runs health checks. |

**Deploy preflight checks:**
- Validates `DATABASE_URL` format (must start with `postgresql://`)
- Runs `prisma validate` and `prisma generate`
- Applies pending migrations via `prisma migrate deploy`
- Runs local and public health checks after restart

---

## Deployment

### Production Server

- **Service**: `pte-ui` (systemd)
- **App directory**: `/home/heidi/pte-ui`
- **Runtime**: Node.js running `dist/server.cjs`
- **Process manager**: systemd (restart on failure, 5-second delay)

### Deploy Flow

1. Push to `main` triggers the GitHub Actions deploy job.
2. SSH into VPS, pull latest `main`, install dependencies.
3. Prisma preflight (validate, generate, migrate).
4. Build (`vite build` + `esbuild server.ts`).
5. Restart systemd service.
6. Local health check (`http://localhost:3000/api/health`).
7. Public smoke test (`https://pte.tnaprovider.com.au` → HTTP 200).

### Health Check

```bash
curl -I https://pte.tnaprovider.com.au
curl -s https://pte.tnaprovider.com.au/api/health
```

Expected: HTTP 200 and `{"status":"ok"}`.

### DATABASE_URL Requirement

In production `DATABASE_URL` must start with `postgresql://`. The deploy pipeline validates this before proceeding — invalid URLs fail fast.

**Maintenance note:** The production `DATABASE_URL` was previously set to a `file:` (SQLite) value, which caused Prisma validation failures during deploy. This was fixed by migrating to PostgreSQL and updating the variable. If the deploy fails with a `DATABASE_URL` error, verify the format in `/home/heidi/pte-ui/.env` on the VPS.

---

## Student Portal Rollout History

1. **14 phase PRs** delivered the student portal incrementally (shell, dashboard, practice library, 22 task renderers, session manager, feedback, review, analytics, performance history).
2. **Final audit** scored the portal at 7.8 / 10 and identified 11 P1 blockers (9 RoutePlaceholder pages, no session recovery, broken deploy pipeline).
3. **Repair PR** (#56) fixed all P1 blockers — implemented placeholder pages, added localStorage draft recovery, added deploy validation.
4. **Rollup PR** (#57) consolidated all 9 open student portal PRs into one integration branch, resolved merge conflicts, and delivered a single passing CI run.
5. **Production deploy** succeeded after fixing the VPS `DATABASE_URL` (SQLite → PostgreSQL) and adding `node` to the VPS for the preflight check.
6. **Closure PR** (#58) documented the final state and the remaining P2 backlog.

---

## P2 Backlog

Five non-blocking improvements are tracked in [`docs/student-portal/p2-backlog.md`](./docs/student-portal/p2-backlog.md):

| Item | Description |
|------|-------------|
| P2-1 | Bundle size code splitting — lazy-load task renderers, charts, audio modules. |
| P2-2 | Accessibility polish — modal/drawer focus trapping, aria-live for submission status. |
| P2-3 | Large-dataset smoke test — verify question browser with 100+ and 250+ items. |
| P2-4 | Notifications page — dedicated page with real data (no placeholder). |
| P2-5 | Registry consolidation — single source of truth for all 22 task types. |

These are **not production blockers**. The platform is fully functional without them.

---

## Contribution Workflow

1. Start from the latest `main`.
2. Create a focused branch per task (e.g., `fix/issue-description`, `feat/feature-name`).
3. Run tests before pushing:
   ```bash
   bun run typecheck && bun run build
   ```
4. Open a PR against `main`.
5. Monitor CI with polling — do not merge failing CI.
6. Merges should be squash-merged with a descriptive commit message.
7. Production changes require post-deploy smoke verification.

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| `prisma validate` fails with URL error | `DATABASE_URL` does not start with `postgresql://` | Update `.env` — production requires `postgresql://USER:PASSWORD@HOST:PORT/DATABASE` |
| Server won't start | Missing `JWT_SECRET` or invalid `DATABASE_URL` | Check `.env` has required values. Run `bunx prisma validate` and `bunx prisma generate`. |
| Deploy fails — `node: command not found` | VPS missing `node` runtime | Install via `sudo apt-get install -y nodejs` |
| Deploy fails — `DATABASE_URL is not set` | SSH session does not inherit env | The deploy script sources `.env`; ensure the path is correct in the workflow. |
| Production health check returns non-200 | Server crashed or port conflict | `sudo systemctl status pte-ui` — check logs with `sudo journalctl -u pte-ui -n 50 --no-pager` |
| Build fails | TypeScript error or stale lockfile | Run `bun install --frozen-lockfile` and fix type errors. |
| E2E tests fail | Server not running or stale test data | Start the server with `bun run dev` and ensure the database is migrated. |
| Student dashboard shows no data | Empty database or demo mode off | Run seed script or set `SEED_ON_STARTUP=true` for local development. |
| RoutePlaceholder page appears | A route references the placeholder component | Search for `RoutePlaceholder` imports — the definition file should remain, but no page should import it. |
| Stale local database | Migration drift | `bunx prisma migrate dev` to reconcile. |

---

## Maintenance Checklist

Before merging any PR to `main`:

- [ ] `bun run lint` / `bun run typecheck` — no TypeScript errors
- [ ] `bun run build` — frontend and server compile
- [ ] `bunx prisma validate` — schema is valid
- [ ] Relevant smoke tests pass
- [ ] RoutePlaceholder scan: only the definition file uses it
- [ ] Frontend AI-provider scan: no direct AI calls from client code
- [ ] Scoring regression scan: no score handling regressions
- [ ] If deploy-related: production health check passes post-deploy

---

## License

Not specified.

---

*PTE UI — Production PTE Preparation Platform. Student Portal rollout closed.*
