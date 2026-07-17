# PTE UI Architecture

## Overview

PTE UI is a single-repository full-stack application with a React frontend, Express backend, SQLite database (via Prisma), and Vite as the development/build tool.

---

## Backend Entry Flow

```
server.ts
  └─ createApp()           (src/server/app.ts)
       ├─ middleware (cors, json, urlencoded)
       ├─ runSeeding()     (src/server/seed.ts)
       ├─ /uploads static   (src/server/uploads.ts)
       ├─ /api/health
       ├─ /api/upload       (src/server/uploads.ts)
       ├─ /api/seed         (reuses seed.ts)
       ├─ /api/*            (src/server/routes/index.ts)
       │    ├─ /auth        (src/server/auth.ts)
       │    ├─ /student     (src/server/student.ts)
       │    ├─ /teacher     (src/server/teacher.ts)
       │    └─ /admin       (src/server/admin.ts)
       ├─ startJobProcessor (src/server/jobs/worker.ts)
       └─ Vite dev middleware or static dist/
```

- **server.ts** — Thin entry point. Imports `createApp` and `config`, starts the HTTP server.
- **app.ts** — Assembles the Express application. Registers middleware, routes, seeding, job processor, and frontend handler.
- **config.ts** — Centralised runtime configuration (port, environment, upload directory, demo mode flag).
- **seed.ts** — Creates demo accounts, sample submissions, coupons, and audit logs on startup. Must be behind demo mode in Phase 2.
- **uploads.ts** — Manages the upload directory and Multer configuration; exposes the `/api/upload` route.
- **routes/index.ts** — Mounts the four API route groups under `/api`.
- **jobs/queue.ts** — Exports `queueJob` for enqueuing background tasks.
- **jobs/worker.ts** — Exports `startJobProcessor` which polls for queued jobs every 3 seconds.

### Database

- **Prisma** with SQLite (`prisma/dev.db`).
- Schema defined in `prisma/schema.prisma`.
- Models: User, Session, PracticeSubmission, TestAttempt, Coupon, CustomTask, CourseProgress, LessonCompletion, FlashcardState, Notification, BackgroundJob, LogEntry, AuditLog.

---

## Frontend Provider / API Flow

```
src/main.tsx
  └─ <ThemeProvider>        (src/components/ThemeContext.tsx)
       ├─ theme/role/user state
       ├─ login/register/logout/setRole
       ├─ notification management
       └─ apiFetch utility exposed via context

Components access context via useGlobalContext().
```

### API Client Layer

- **src/api/client.ts** — Single `apiFetch` function used across the frontend.
  - Reads JWT token from `localStorage`.
  - Sets `Authorization` and `Content-Type` headers automatically.
  - Parses JSON responses; throws on HTTP errors with the backend error message.
- **src/api/auth.api.ts** — Exports `loginRequest`, `registerRequest`, `getMeRequest`.
- **src/api/student.api.ts** — Exports `getNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `triggerSeed`.
- **src/api/teacher.api.ts** — Exports teacher-specific API functions.
- **src/api/admin.api.ts** — Exports admin-specific API functions.

### Shared Route Constants

- **src/shared/routes.ts** — Centralised route path constants used by API modules.

### Context (ThemeContext.tsx)

- Provides theme toggling, user session, role management, notification state, and `apiFetch` to all descendants.
- Functions are wrapped in `useCallback` and the context value in `useMemo` to prevent unnecessary re-renders.
- Components that need API access import `apiFetch` from the context or call the typed API modules directly.

---

## Demo Seed Behaviour

On every server startup, `runSeeding()` in `src/server/seed.ts` checks for and creates:

1. Three default accounts: `student@example.com`, `teacher@example.com`, `admin@example.com` (password: `password123`).
2. Sample practice submissions and test attempts for the student account.
3. Promotional coupons (`FIFTYOFF`, `LAUNCHPTE`, `VIP2026`).
4. Custom teacher tasks.
5. Sample audit log entries.

**Important:** The current role-switching UI (`setRole` in ThemeContext) depends on these seeded accounts. They must remain in Phase 1.

**TODO (Phase 2):** Move seeding behind `config.demoMode` so it only runs in development/staging environments.

---

## Known Phase 2 / 3 Follow-Up Items

- **Database migration to PostgreSQL** — SQLite is adequate for development but not production.
- **Startup seeding behind demo mode** — `runSeeding()` should be gated by `config.demoMode`.
- **Subscription / billing integration** — Coupon validation and subscription routes are placeholders.
- **Background job queue** — The current polling-based `startJobProcessor` should be replaced with a proper job queue (Bull, RabbitMQ, etc.).
- **Authentication hardening** — Rate limiting, refresh tokens, and proper password reset flow.
- **Frontend state management** — Consider a dedicated state library (Zustand, Redux) if context triggers become a bottleneck.
- **Testing** — Unit and integration test suites are not yet present.

---

## What Phase 1 Intentionally Does Not Solve

- No UI redesign or visual changes.
- No database schema changes or migration to PostgreSQL.
- No removal of demo seeded accounts (they are required for the current role-switching flow).
- No new product features.
- No Gemini / AI Studio cleanup (separate Phase 0).
- No comprehensive test coverage.
- No production deployment configuration beyond the basic server setup.
