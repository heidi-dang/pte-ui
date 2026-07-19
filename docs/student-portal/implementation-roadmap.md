# Implementation Roadmap — Student Portal

## Overview

14 phases to build a commercial-production-grade student portal for the PTE Academic platform. Each phase is independently reviewable, branches from `main`, and produces a single PR.

---

## Phase 0 — Student Portal Audit and Baseline

**Branch:** `audit/student-portal-baseline`

**Objective:** Document current state before making changes.

**Deliverables:**
- [x] `docs/student-portal/current-state-audit.md`
- [x] `docs/student-portal/route-map.md`
- [x] `docs/student-portal/component-inventory.md`
- [x] `docs/student-portal/api-contract-inventory.md`
- [x] `docs/student-portal/implementation-roadmap.md`

**Acceptance:**
- All current student workflows mapped
- Exact file paths documented
- Reusable and missing components identified
- Baseline test results recorded
- No production code changed

---

## Phase 1 — Student Design Tokens and UI Primitives

**Branch:** `feat/student-portal-design-system`

**Objective:** Create shared visual foundation.

**Scope:**
- Colour, spacing, typography, radius, focus, motion tokens
- 17 reusable primitives: Button, IconButton, Input, SearchField, Select, Checkbox, Tabs, Badge, ProgressBar, Skeleton, Alert, EmptyState, ErrorState, Drawer, Modal, Toast, Tooltip

**Files created:** `src/components/ui/` directory with primitive components

**Risk:** Low — no page logic, pure UI components
**Rollback:** Revert single commit

---

## Phase 2 — Student Portal Shell and Responsive Navigation

**Branch:** `feat/student-portal-shell`

**Objective:** Create reusable shell for every student page.

**Scope:**
- `StudentPortalShell` layout wrapper
- `DesktopStudentSidebar`, `MobileStudentTopBar`, `MobileStudentBottomNavigation`
- `StudentPortalHeader`, `StudentProfileMenu`, `StudentNotificationButton`
- `StudentPageContainer`, `StudentBreadcrumbs`
- 13 placeholder routes under `/student/`

**Dependencies:** Phase 1 (primitives)

**Risk:** Medium — navigation state management, responsive layout
**Rollback:** Remove shell components, revert to state-based routing

---

## Phase 3 — Student Dashboard Foundation

**Branch:** `feat/student-dashboard-foundation`

**Objective:** Dashboard page with real typed data contracts.

**Scope:**
- `GET /api/student/dashboard` aggregated endpoint
- Dashboard cards: greeting, target score, exam date, continue activity, readiness, daily plan, recommendations, recent activity, weak areas, upcoming, subscription
- All states: loading, partial, empty, error

**Dependencies:** Phase 2 (shell)

**Risk:** Medium — API contract design, partial data resilience
**Rollback:** Revert dashboard page, keep placeholder

---

## Phase 4 — Practice Library and 22 Task Types

**Branch:** `feat/student-practice-library`

**Objective:** Production task-type practice library.

**Scope:**
- 22 task cards grouped by skill (Speaking, Writing, Reading, Listening)
- Search, skill filter, recommended filter, attempted status, sort
- Mobile filter bottom sheet
- Remove duplicated `PTE_TASK_TYPES` from `mockData.ts`

**Dependencies:** Phase 2 (shell)

**Risk:** Medium — removing duplicate registry
**Rollback:** Revert library page, keep old mockData

---

## Phase 5 — Large Question Browser and Custom Practice Builder

**Branch:** `feat/student-question-browser`

**Objective:** Handle 100+ question task types.

**Scope:**
- Server-side pagination
- Multi-filter: difficulty, status, bookmarked, incorrect, score range
- Search with debounce
- Practice modes: Quick, Recommended, Custom, Mistakes, Bookmarks, New, Timed
- Custom practice settings dialog

**Dependencies:** Phase 4 (practice library)

**Risk:** Medium — pagination, filter persistence, performance
**Rollback:** Revert browser page, keep old question flow

---

## Phase 6 — Practice Session UI Integration

**Branch:** `feat/student-practice-session-ui`

**Objective:** Connect student portal to existing practice engine.

**Scope:**
- Session route `/student/practice/session/:sessionId`
- Session header, controls, timer, keyboard shortcuts
- Reuse existing task renderer registry
- Hide shell navigation during active session

**Dependencies:** Phase 2 (shell), existing practice engine

**Risk:** Low — integrates existing engine
**Rollback:** Revert session UI changes

---

## Phase 7 — Autosave, Connection Recovery, and Session Restoration

**Branch:** `feat/student-session-recovery`

**Objective:** Resilient practice sessions.

**Scope:**
- Saving/saved/failed/offline/reconnecting status indicators
- Debounced autosave
- POST autosave/recover/submit endpoints
- Server-authoritative state
- Idempotent submission

**Dependencies:** Phase 6 (session UI)

**Risk:** High — data loss prevention, concurrent tab handling
**Rollback:** Revert autosave hooks, keep session UI

---

## Phase 8 — Mock Exam Student UI

**Branch:** `feat/student-mock-exam-ui`

**Objective:** Student-facing mock exam library and active exam.

**Scope:**
- Mock exam library (full/section/mini/assigned)
- Pre-exam screen with structure, rules, readiness
- Focused exam shell with section locking
- Server-authoritative timer
- Final submission confirmation

**Dependencies:** Phase 2 (shell), existing mock engine

**Risk:** Medium — section locking, timer sync
**Rollback:** Revert mock exam UI changes

---

## Phase 9 — Results and Question Review

**Branch:** `feat/student-results-review`

**Objective:** Understandable, actionable results.

**Scope:**
- Result summary (overall score, skill breakdown, comparison)
- Question review with response, reference, score, feedback
- AI feedback from backend (not direct frontend call)
- Review filters

**Dependencies:** Phase 6 (sessions), Phase 8 (mock exams)

**Risk:** Medium — legacy result compatibility
**Rollback:** Revert results/review routes

---

## Phase 10 — Student Analytics

**Branch:** `feat/student-analytics`

**Objective:** Progress analytics across complete learning history.

**Scope:**
- Overview: score trend, skill trends, study time, accuracy
- Task analytics: per-task scores, trends, attempts
- Time filters: 7d/30d/90d/all/custom
- Lazy-loaded charts
- Text summaries for accessibility

**Dependencies:** Phase 9 (results data)

**Risk:** Low — read-only analytics
**Rollback:** Revert analytics routes

---

## Phase 11 — Study Plan

**Branch:** `feat/student-study-plan`

**Objective:** Personalised actionable study plan.

**Scope:**
- Setup: target score, exam date, available days, weak skills
- Generated daily/weekly activities
- Start/complete/skip/reschedule/replace actions
- Historical completion immutability

**Dependencies:** Phase 3 (dashboard), Phase 4 (practice library)

**Risk:** Medium — plan generation, timezone handling
**Rollback:** Revert study plan routes

---

## Phase 12 — Assignments, Bookmarks, and History

**Branch:** `feat/student-learning-management`

**Objective:** Learning management features.

**Scope:**
- Assignment list/detail with progress and statuses
- Bookmark add/remove/list with search
- History with date/type filters

**Dependencies:** Phase 2 (shell), Phase 4 (practice)

**Risk:** Low — CRUD-heavy feature set
**Rollback:** Revert individual feature routes

---

## Phase 13 — Subscription, Entitlements, and Notifications

**Branch:** `feat/student-commercial-experience`

**Objective:** Commercial subscription states and notifications.

**Scope:**
- Subscription: plan, status, renewal, usage, billing history
- Central entitlement resolver
- Notifications: list, read/unread, mark all read, deep links, preferences

**Dependencies:** Phase 2 (shell)

**Risk:** Medium — entitlement gating correctness
**Rollback:** Revert subscription UI changes

---

## Phase 14 — Accessibility, Performance, and Production Hardening

**Branch:** `harden/student-portal-production`

**Objective:** Final production audit and remediation.

**Scope:**
- Full accessibility audit (keyboard, focus, aria, screen reader)
- Responsive audit (8 viewport sizes)
- Performance audit (bundle size, lazy loading, rerenders)
- 13 critical E2E journeys
- All existing tests pass

**Dependencies:** All phases

**Risk:** Low — audit and fix only
**Rollback:** Revert individual fixes

---

## Dependency Graph

```
Phase 0 (Audit)
  │
Phase 1 (Tokens + Primitives)
  │
Phase 2 (Shell + Navigation)
  ├────────────┬────────────┬──────────────┐
  ▼            ▼            ▼              ▼
Phase 3    Phase 4      Phase 8       Phase 12
(Dashboard) (Library)   (Mock Exams)  (Assignments)
  │            │            │              │
  ▼            ▼            ▼              │
Phase 11    Phase 5      Phase 9 ◄────────┘
(Study Plan) (Browser)     │
  │            ▼           ▼
  └────────►Phase 6    Phase 10
            (Session)  (Analytics)
              │
              ▼
          Phase 7
          (Recovery)

Phase 13 (Subscription — depends on Phase 2)
Phase 14 (Hardening — depends on all)
```

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|-----------|
| 0 | None | No code changes |
| 1 | Low | Pure UI, no logic |
| 2 | Medium | State management complexity |
| 3 | Medium | API contract design |
| 4 | Medium | Registry deduplication |
| 5 | Medium | Performance at scale |
| 6 | Low | Existing engine reuse |
| 7 | High | Data integrity critical |
| 8 | Medium | Section lock correctness |
| 9 | Medium | Legacy data compatibility |
| 10 | Low | Read-only views |
| 11 | Medium | Plan generation logic |
| 12 | Low | CRUD operations |
| 13 | Medium | Entitlement correctness |
| 14 | Low | Audit and fixes |

## Rollback Strategy

Each phase produces a single PR. Rollback by reverting the merge commit:

```bash
git revert -m 1 <merge-commit>
```

For API changes, redeploy the previous server version first to maintain backward compatibility.
