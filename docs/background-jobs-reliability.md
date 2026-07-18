# Background Jobs & Reliability

## Overview
Background jobs use Prisma's BackgroundJob model with full lifecycle: queued → running → completed/failed/dead_letter. Worker picks up jobs with atomic claims, supports retries with backoff, stale lock recovery, and admin visibility.

## Job Lifecycle
- **queued**: waiting to be processed
- **running**: actively being processed (locked by worker)
- **completed**: finished successfully
- **failed**: finished with error, retryable
- **dead_letter**: exceeded max retries, requires admin action
- **cancelled**: admin-cancelled before execution

## Worker
- Polls every 3 seconds with SQLite busy handling
- Atomic job claim using `claimToken`
- Exponential backoff with jitter on retries
- Stale running jobs recover after lease expires (5 min)
- Graceful shutdown on SIGTERM

## Admin APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/jobs` | List jobs (filter by status) |
| GET | `/api/admin/jobs/:id` | Job detail |
| POST | `/api/admin/jobs/:id/retry` | Retry failed/dead_letter job |
| POST | `/api/admin/jobs/:id/cancel` | Cancel queued job |
| GET | `/api/admin/runtime-health` | Queue counts, stale jobs, DB status |

## Data Safety
- Job payloads contain only safe metadata (no secrets)
- Admin APIs never expose: passwords, reset tokens, JWT secrets, API keys, DATABASE_URL
- Retry preserves idempotency via idempotencyKey
