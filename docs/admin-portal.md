# Admin Portal

## Key Modules

- Dashboard — platform stats (users, submissions, mocks, questions)
- Users — search, filter, suspend/reactivate, role change, password reset
- Teachers — teacher account management, assignment via admin
- Question Bank CMS — create, edit, publish, archive, student-safe preview
- Submissions — filter by status/section/taskCode, safe views
- Mock Tests — filter by status/type, section scores
- Reports — practice volume, section/task averages, score 0, pending
- Reliability — health dashboard, job list, retry/cancel, runtime health
- Audit Logs — real DB records, category/action filters
- System — coupons, system metrics, deferred backup

## Reliability Tab

| Feature | Description |
|---------|-------------|
| Health cards | queued, running, failed, dead letter, stale, 24h failures |
| Job list | Status/date filters, pagination, safe fields only |
| Job detail | Drawer with safe fields (no raw data/result) |
| Retry | Failed/dead_letter jobs (audit logged) |
| Cancel | Queued jobs (audit logged) |
| Runtime health | Queue stats, DB reachable, worker heartbeat |

## Data Safety
- All admin routes require `authenticateToken` + `requireRole(['admin'])`
- No passwords, hashes, reset tokens, JWT secrets, or API keys exposed
- Job payloads sanitized (no secrets, max 50KB)
- Backups deferred to Phase 16
