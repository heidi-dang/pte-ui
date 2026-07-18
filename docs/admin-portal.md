# Admin Portal

## Overview

The Admin Portal provides production-grade command centre capabilities. Admins can manage users, content, submissions, and platform health.

## Key Modules

- Dashboard — real-time platform stats
- User management — search, filter, suspend, reactivate, role assignment
- Question Bank CMS — create, publish, archive content
- Coupons — promotional code management
- Audit logs — security and action tracking
- System settings — backups, logs, jobs monitoring
- Reports — platform-level submission and mock analytics

## Backend APIs

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/dashboard` | Platform stats (users, submissions, questions) |
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users/:id/suspend` | Suspend user (sets Inactive, creates audit log) |
| POST | `/api/admin/users/:id/reactivate` | Reactivate user (sets Active, creates audit log) |
| POST | `/api/admin/users/:id/role` | Change user role |
| GET | `/api/admin/users/:id/activity` | User activity summary |
| GET | `/api/admin/question-bank` | List question bank items |
| POST | `/api/admin/question-bank` | Create question |
| PATCH | `/api/admin/question-bank/:id/status` | Publish/draft/archive |
| DELETE | `/api/admin/question-bank/:id` | Archive (soft delete) |
| GET | `/api/admin/coupons` | List coupons |
| POST | `/api/admin/coupons` | Create coupon |
| GET | `/api/admin/logs` | System logs |
| GET | `/api/admin/jobs` | Background jobs |
| GET | `/api/admin/audit-logs` | Audit trail |
| GET | `/api/admin/backup` | Trigger backup simulation |
| GET | `/api/admin/system-metrics` | System health metrics |
| GET | `/api/admin/reports/overview` | Platform practice/mock analytics |

## Data Safety

- All admin routes require `authenticateToken` + `requireRole(['admin'])`
- No passwords, hashes, reset tokens, JWT secrets, or API keys exposed
- No answerKeyJson, sampleAnswer, or explanation exposed to student routes
- Audits logged for: role changes, status changes, content actions

## Limitations

- Billing management deferred to Phase 15
- Teacher portal is separate (Phase 12)
- Background jobs reliability is Phase 13
