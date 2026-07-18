# Background Jobs & Reliability

## Worker Behaviour
- Claims queued and retrying jobs (scheduledAt <= now)
- `withJobTimeout()` wraps execution with `Promise.race` + `JOB_TIMEOUT_MS` (default 180s)
- Timeout errors enter the failure handler: writes retrying + scheduledAt backoff when attempts remain, dead_letter when max reached
- Heartbeat refreshes lease every 30s; cleared in finally after completion/timeout
- Completion requires `claimToken` match — late completion after timeout cannot overwrite
- Stale recovery: running jobs with expired lease become retrying + scheduledAt backoff or dead_letter
- Graceful shutdown on SIGTERM/SIGINT via returned shutdown function

## Job Lifecycle
- queued → running → completed
- queued → running → retrying (backoff) → running → ...
- queued → running → retrying (max exceeded) → dead_letter
- running (lease expired) → retrying (with backoff) or dead_letter
- failed/dead_letter → admin retry → queued

## Admin APIs

| Method | Path | Query Params | Purpose |
|--------|------|-------------|---------|
| GET | `/api/admin/jobs` | status, name, search, dateFrom, dateTo, page, pageSize | Paginated job list |
| GET | `/api/admin/jobs/:id` | — | Safe job detail |
| POST | `/api/admin/jobs/:id/retry` | — | Retry failed/dead_letter |
| POST | `/api/admin/jobs/:id/cancel` | — | Cancel queued job |
| GET | `/api/admin/runtime-health` | — | Queue stats, stale jobs, 24h failures |

## Data Safety
- Job payloads sanitized (no password/token/key/env secrets)
- Allowed types: grade_submission, grade_mock_test
- Admin APIs return safeJobSelect only (no raw data/result)
- Idempotency keys prevent duplicate execution

## Configurable Env Vars
- JOB_POLL_INTERVAL_MS (3000), JOB_LEASE_SECONDS (180), JOB_HEARTBEAT_SECONDS (30)
- JOB_RECOVERY_INTERVAL_MS (60000), JOB_RETRY_BASE_MS (30000), JOB_RETRY_MAX_MS (600000)
- JOB_TIMEOUT_MS (180000)
