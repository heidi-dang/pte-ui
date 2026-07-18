# Background Jobs & Reliability

## Overview
Production-hardened background job system with full lifecycle, retry/backoff, timeouts, and graceful shutdown. Worker polls every 3s, claims jobs atomically, and handles retries with exponential backoff + jitter.

## Job Lifecycle
- **queued**: waiting, with optional scheduledAt for delayed execution
- **retrying**: failed but within maxAttempts, scheduled in future with backoff
- **running**: claimed by worker, with lease and heartbeat
- **completed**: successful
- **failed**: terminal error (attempts < maxAttempts, but status changed by legacy path)
- **dead_letter**: exceeded maxAttempts, requires admin intervention
- **cancelled**: admin-cancelled

## Worker Behaviour
- Claims queued and retrying jobs (scheduledAt <= now)
- Exponential backoff: base 30s, max 10min, with jitter
- Per-job timeout (JOB_TIMEOUT_MS, default 180s)
- Heartbeat refreshes lease every 30s
- Stale recovery runs every 60s
- Graceful shutdown on SIGTERM/SIGINT
- Returns shutdown function for server integration

## Admin APIs

| Method | Path | Query Params | Purpose |
|--------|------|-------------|---------|
| GET | `/api/admin/jobs` | status, name, search, dateFrom, dateTo, page, pageSize | Paginated job list |
| GET | `/api/admin/jobs/:id` | — | Safe job detail |
| POST | `/api/admin/jobs/:id/retry` | — | Retry failed/dead_letter (audit logged) |
| POST | `/api/admin/jobs/:id/cancel` | — | Cancel queued job (audit logged) |
| GET | `/api/admin/runtime-health` | — | Queue stats, stale jobs, 24h failures |

## Data Safety
- Job payloads sanitized (no password/token/key/env secrets)
- Queue rejects unknown job types
- Allowed: grade_submission, grade_mock_test
- Admin APIs never return raw data/result payloads

## Configurable Env Vars
- JOB_POLL_INTERVAL_MS (3000)
- JOB_LEASE_SECONDS (180)
- JOB_HEARTBEAT_SECONDS (30)
- JOB_RECOVERY_INTERVAL_MS (60000)
- JOB_RETRY_BASE_MS (30000)
- JOB_RETRY_MAX_MS (600000)
- JOB_TIMEOUT_MS (180000)
