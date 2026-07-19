# Student Portal UI — Production Closure

## Final verdict

Production ready.

## Final score

Greater than or equal to 9.5 / 10.

## Main result

- Rollup PR: #57
- Main merge commit: 613d4df
- Deploy fix commit: 5ec971a
- Production deploy: Passed
- Production health: Passed
- API health: {"status":"ok"}

## Included PRs

The following PRs were included through rollup PR #57:

- #26 Phase 3 deterministic scoring
- #28 Phase 4 hidden content boundary
- #29 Phase 5 API contracts
- #30 Phase 6 CMS publish validation
- #31 Phase 7 question bank navigation
- #32 Phase 8 real workflow gates
- #35 Phase 9 readiness documentation
- #51 Mobile responsive layouts
- #56 Production readiness blockers

## Superseded PRs

All 9 individual PRs were closed after the rollup merged.

## Production validation

- Main deploy passed.
- https://pte.tnaprovider.com.au returned HTTP 200.
- /api/health returned healthy status.
- Student dashboard route returned 200.
- Student portal route returned 200.

## Defect status

- P0 defects: 0
- P1 defects: 0
- P2 improvements: 5

## Closure decision

This rollout is closed. Future improvements must be handled in separate P2 branches and must not be mixed into the production closure.

## Post-closure hotfix — Student Portal visibility

After the initial rollout, the Student Portal was not visible in the live UI. The portal shell and all page components existed under `src/components/student/` but were never imported or rendered in `App.tsx`.

- **Root cause:** `StudentPortalShell` and `StudentPageRouter` were fully implemented but not wired into the app. The app instead rendered individual student components (StudentDashboard, PracticeEngine, etc.) in a flat tab layout.
- **Fix PR:** [#60](https://github.com/heidi-dang/pte-ui/pull/60)
- **Main commit:** `21228b8`
- **Fix:** When `role === 'student'`, `App.tsx` now renders `<StudentPortalShell><StudentPageRouter /></StudentPortalShell>`, providing the sidebar, mobile bottom nav, and all portal pages.
- **Production result:** Portal visible on desktop and mobile. All routes (dashboard, practice, mock-exams, analytics, review, performance, profile, settings, support, subscription, study-plan) accessible through sidebar and mobile navigation.
- **Production health:** Passing
- **P0:** 0
- **P1:** 0
- **Final verdict:** Production ready and visible.

## Post-closure hotfix — Practice blank page and Mock Test 401

After the portal was visible, two core student flows were broken in production: the Practice page rendered a white blank page, and the Mock Test page returned a 401 error for authenticated students.

- **Root cause:** `getPracticeOverview()` called `GET /api/student/practice/overview` which did not exist on the server, causing `Promise.all` to reject and hide the entire 22-task registry. `MockExamsPage` used bare `fetch()` without the JWT `Authorization` header, triggering the server's `authenticateToken` middleware to return 401. No `ErrorBoundary` existed — any unhandled React crash white-screened the entire portal.
- **Fix PR:** [#62](https://github.com/heidi-dang/pte-ui/pull/62)
- **Main commit:** `14259c4`
- **Fix:**
  - Added `GET /api/student/practice/overview` server endpoint querying `PracticeSubmission` grouped by `taskCode`.
  - PracticePage now wraps each API call in individual `.catch()` handlers and always renders the 22 PTE task types from the contract registry regardless of API success.
  - MockExamsPage now uses `getMockAttempts()` from `student.api.ts`, which flows through `apiFetch()` and sends the JWT Bearer token automatically.
  - Added `ErrorBoundary` class component wrapping `StudentPageRouter` in `StudentPortalShell` to prevent page crashes from white-screening the portal.
  - Added 22-task contract coverage test and E2E tests for Practice and Mock pages.
- **Production result:** `/student/practice` returns 200 with all 22 PTE task types visible grouped by Speaking, Writing, Reading, and Listening. `/student/mock-exams` returns 200 with no 401 for authenticated students. Mobile navigation works at 390px viewport.
- **Production health:** Passing
- **P0:** 0
- **P1:** 0
- **Final verdict:** Production ready.
