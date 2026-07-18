# Background Jobs & Reliability

## Overview
Background jobs use the production-hardened BackgroundJob model and worker system with full lifecycle management, retry/backoff, stale recovery, timeouts, and admin visibility.

## Job Lifecycle
- **queued**: waiting for a worker
- **running**: claimed by a worker (locked via claimToken, leaseExpiresAt)
- **retrying**: failed but has attempts remaining (re-queued with backoff)
- **completed**: finished successfully
- **failed**: finished with error, retryable (has attempts < maxAttempts)
- **dead_letter**: exceeded maxAttempts, requires admin action
- **cancelled**: admin-cancelled

## Worker
- Polls every 3s (configurable via JOB_POLL_INTERVAL_MS)
- Atomic claim using `$transaction` with claimToken
- Exponential backoff with jitter on retry (base 30s, max 10min)
- Stale job recovery every 60s (configurable JOB_RECOVERY_INTERVAL_MS)
- Per-job timeout (configurable via JOB_LEASE_SECONDS, default 180s)
- Graceful shutdown via shutdown flag
- Safe payload handling in queue.ts (size limit, idempotency keys, allowed job types)

## Admin APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/jobs` | List jobs (filter: status, type; paginated) |
| GET | `/api/admin/jobs/:id` | Job detail (safe fields only) |
| POST | `/api/admin/jobs/:id/retry` | Retry failed/dead_letter (audit logged) |
| POST | `/api/admin/jobs/:id/cancel` | Cancel queued job (audit logged) |
| GET | `/api/admin/runtime-health` | Queue counts, stale jobs, DB status |

## Data Safety
- Job payloads ≤50KB, no secrets (API keys, tokens, passwords, DATABASE_URL)
- Admin APIs return safe fields only (no raw data/result payload)
- Retry/cancel audit logged
- idempotency keys prevent duplicate job execution

## Schema
BackgroundJob model includes: id, name, data, status, result, error, attempts, maxAttempts, scheduledAt, startedAt, completedAt, heartbeatAt, leaseExpiresAt, workerId, claimToken, idempotencyKey, with indexes on [status, scheduledAt] and [status, leaseExpiresAt].
