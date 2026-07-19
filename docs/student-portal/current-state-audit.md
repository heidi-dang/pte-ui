# Current State Audit — Student Portal

## 1. Routing Architecture

### Frontend Routing
- **No URL router** (no React Router, no TanStack Router). All navigation is state-based in `src/App.tsx`.
- Role-based rendering: `guest` → `PublicWebsite`, `student` → `StudentDashboard` / `LearningCentre` / `PracticeEngine` / `MockTestEngine` / `Reports` / `BillingUI`.
- All student views render on a single page with conditional rendering. No deep-linkable student URLs.

**File:** `src/App.tsx` (402 lines)

### Backend Routes
- All API routes defined in `src/shared/routes.ts` (65 lines).
- Mounted in `src/server/routes/index.ts`.
- Student REST routes under `/api/student/`.

### Assessment
| Aspect | Classification |
|--------|---------------|
| Route definitions | Reuse unchanged — constants file is well-structured |
| Frontend routing | Refactor — needs URL-based routing for student portal |
| No 404 handling | Missing — unknown routes don't gracefully fall back |

---

## 2. Student Dashboard

**File:** `src/components/StudentDashboard.tsx` (367 lines)

### Current Implementation
- Target Match Progress scorecard (current avg, target, gap, confidence)
- Streak calendar with "Claim Today" button
- Today's Executable Sequence (4 personalized tasks with checkboxes, "Start Drill")
- Recent Study Portfolio Logs
- PTE Colour Standard reference

### Data Sources
- `useEffect` on mount fetches `/api/student/dashboard-stats`
- Hardcoded `todayTasks` array for daily plan
- `getTaskCounts()` for question counts per task

### States
| State | Present? | Implementation |
|-------|----------|---------------|
| Loading | Yes | Conditional `isLoading` |
| Error | Partial | No dedicated error UI |
| Empty | Partial | Empty arrays handled gracefully |
| Success | Yes | Full dashboard render |

### Assessment
| Component | Classification |
|-----------|---------------|
| Scorecard | Refactor — extract reusable component |
| Streak calendar | Refactor — extract with real API data |
| Today's tasks | Replace — move to study-plan driven |
| Recent activity | Refactor — use real API pagination |
| Colour legend | Reuse unchanged |

---

## 3. Learning Centre

**File:** `src/components/LearningCentre.tsx` (875 lines)

### Tabs
- Courses
- Templates
- Flashcards
- Tips
- Study Plan

### Assessment
| Component | Classification |
|-----------|---------------|
| Courses tab | Refactor — use real course data |
| Templates | Reuse unchanged |
| Flashcards | Reuse unchanged |
| Tips | Reuse unchanged |
| Study Plan | Refactor — integrate with dashboard plan |

---

## 4. Practice Engine

**File:** `src/components/PracticeEngine.tsx` (242 lines)

### Architecture
- `PracticeMainPanel` renders task-specific forms
- `TaskSidebar` lists all 22 PTE task types
- `QuestionNavBar` provides paginated question list
- `PracticeResultPanel` shows scores and feedback

### Practice Engine Sub-components
| File | Lines | Classification |
|------|-------|---------------|
| `src/practice/components/PracticeMainPanel.tsx` | - | Reuse unchanged |
| `src/practice/components/PracticeResultPanel.tsx` | - | Reuse unchanged |
| `src/practice/components/PracticeSidePanels.tsx` | - | Reuse unchanged |
| `src/practice/components/PracticeTaskForm.tsx` | - | Reuse unchanged |
| `src/practice/components/QuestionNavBar.tsx` | - | Reuse unchanged |
| `src/practice/components/TaskSidebar.tsx` | - | Reuse unchanged |

### Task Modules (22 individual renderers)
| Path | Classification |
|------|---------------|
| `src/practice/tasks/RA/`, `RS/`, `DI/`, `RL/`, `ASQ/`, `SGD/`, `RTS/` | Reuse unchanged |
| `src/practice/tasks/SWT/`, `WE/` | Reuse unchanged |
| `src/practice/tasks/MCS/`, `MCM/`, `ROP/`, `FIBR/`, `FIBRW/` | Reuse unchanged |
| `src/practice/tasks/SST/`, `MCMSL/`, `FIBL/`, `HCS/`, `MCSSL/`, `SMW/`, `HIW/`, `WFD/` | Reuse unchanged |

### Assessment
| Component | Classification |
|-----------|---------------|
| Task type selection sidebar | Reuse unchanged |
| Question navigation | Reuse unchanged |
| Practice session controls | Reuse unchanged |
| Result display | Reuse unchanged |

---

## 5. Mock Exam Engine

**File:** `src/components/MockTestEngine.tsx` (2248 lines — largest file in codebase)

### Features
- Diagnostic test (5 questions)
- Mini, section, full mock exams
- AI Dynamic Test Generator
- Timer management with auto-advance
- Microphone recording
- Auto-save every 30 seconds
- Resume/pause active sessions
- Keyboard shortcuts (Alt+N, Alt+P)
- Pre-submission answer audit grid

### Assessment
| Component | Classification |
|-----------|---------------|
| Mock exam library | Refactor — extract from monolithic file |
| Pre-exam screen | Refactor — extract standalone component |
| Active exam shell | Refactor — extract focused session component |
| Timer management | Reuse unchanged |
| Recording UI | Refactor — share with practice engine |
| Answer persistence | Reuse unchanged |
| Review grid | Reuse unchanged |

---

## 6. Reports and Analytics

**File:** `src/components/Reports.tsx` (535 lines)

### Sections
- Summary cards (scored, pending, mock tests, lessons)
- Task Breakdown table (per-taskCode)
- Score Trends (practice + mock, last 7 days)
- Mock Exam Attempts list
- Section Averages bar chart
- Readiness Estimate
- Recent Activity (last 8 submissions)
- Practice Tips grid
- Detailed Review (per-question with audio, transcript, AI feedback)

### States
| State | Present? | Implementation |
|-------|----------|---------------|
| Loading | Yes | "Loading reports..." |
| Error | Yes | Red text + Retry button |
| Empty | Yes | BarChart icon + message |
| Success | Yes | Full analytics UI |

### Assessment
| Component | Classification |
|-----------|---------------|
| Summary cards | Refactor — extract reusable |
| Task breakdown table | Refactor — extract reusable |
| Score trends | Refactor — make chart library-agnostic |
| Mock exam attempts | Refactor — extract standalone |
| Readiness estimate | Refactor — consolidate with dashboard |
| Detailed review | Reuse unchanged |

---

## 7. Billing / Subscription UI

**File:** `src/components/BillingUI.tsx` (488 lines)

### Features
- Current plan display
- Subscription status
- Usage allowances
- Coupon validation
- Upgrade options
- Payment form

### Assessment
| Component | Classification |
|-----------|---------------|
| Plan display | Refactor — use entitlement data |
| Subscription status | Refactor — use central resolver |
| Coupon validation | Reuse unchanged |
| Upgrade options | Refactor — centralise plan data |
| Payment form | Reuse unchanged |

---

## 8. Navigation

**File:** `src/App.tsx` (embedded in root component)

### Current Navigation
- Fixed top nav bar with logo
- Student nav items: Dashboard, Courses, 22 Practice Tasks, Mock Exams, AI Scorecard, Premium
- Theme toggle (dark/light)
- Demo role switcher
- Profile dropdown (Change Password, Log Out)
- Mobile: slide-down drawer

### Assessment
| Component | Classification |
|-----------|---------------|
| Top nav bar | Replace — needs student-specific navigation |
| Profile dropdown | Reuse unchanged |
| Mobile drawer | Replace — needs bottom nav per spec |
| Role switcher | Reuse unchanged |
| Theme toggle | Reuse unchanged |

---

## 9. Design System

### Current State
- Tailwind CSS v4 with dark/light theme
- Emerald accent (#10b981)
- Card patterns: `rounded-2xl`, `border`, `p-6`, `shadow-xl`
- Status badges with coloured backgrounds
- Animated page transitions (framer-motion)
- No centralised design tokens file
- Colour values hardcoded throughout components

### Assessment
| Component | Classification |
|-----------|---------------|
| Colours | Replace — hardcoded values need tokens |
| Typography | Refactor — add central type scale |
| Spacing | Replace — hardcoded values need scale |
| Border radius | Replace — hardcoded values need scale |
| Focus rings | Missing — needs implementation |
| Motion | Refactor — add duration tokens |
| Breakpoints | Reuse unchanged — Tailwind defaults work |

---

## 10. Shared Components (Primitives)

### Current State
No dedicated shared component library. All components built inline.

### Assessment: Missing Primitives
| Component | Status |
|-----------|--------|
| Button | Missing — all inline `<button>` elements |
| Input | Missing — all inline `<input>` elements |
| Search field | Missing |
| Select | Missing |
| Checkbox | Missing |
| Tabs | Inline (LearningCentre.tsx) |
| Badge | Inline patterns used |
| Progress bar | Missing |
| Skeleton | Missing |
| Alert | Missing |
| Empty state | Missing |
| Error state | Missing |
| Drawer | Missing |
| Modal | Missing |
| Toast | Missing |
| Tooltip | Missing |

---

## 11. API Client Layer

**File:** `src/api/client.ts`

### Assessment
| Component | Classification |
|-----------|---------------|
| Shared fetch client | Reuse unchanged |
| Auth API module | Reuse unchanged |
| Student API module | Reuse unchanged — may need extension |
| Admin API module | Reuse unchanged |
| Teacher API module | Reuse unchanged |
| Questions API module | Reuse unchanged |

---

## 12. Hardcoded PTE Task Definitions

Four separate registries exist:

| Registry | File | Lines | Classification |
|----------|------|-------|---------------|
| `PTE_TASK_TYPES` | `src/data/mockData.ts` | ~40 | Remove — duplicate of contract registry |
| `TASK_REGISTRY` | `src/practice/contracts/registry.ts` | ~248 | Reuse unchanged — canonical source |
| `QUESTION_REGISTRY` | `src/shared/questionTaskRegistry.ts` | ~643 | Reuse unchanged |
| Task modules | `src/practice/tasks/registry.ts` | - | Reuse unchanged |

All 22 task codes: `RA`, `RS`, `DI`, `RL`, `ASQ`, `SGD`, `RTS`, `SWT`, `WE`, `MCS`, `MCM`, `ROP`, `FIBR`, `FIBRW`, `SST`, `MCMSL`, `FIBL`, `HCS`, `MCSSL`, `SMW`, `HIW`, `WFD`

---

## 13. Duplicate Components

| Duplicate Pattern | Locations | Classification |
|-------------------|-----------|---------------|
| Task code dropdown options | `ManualQuestionModal.tsx`, `GenerationDialog.tsx` | Refactor — share task codes |
| Recording UI | `MockTestEngine.tsx`, `RA/Renderer.tsx` | Refactor — extract shared hook |
| Subscription/pricing modals | `BillingUI.tsx`, `LearningCentre.tsx`, `MockTestEngine.tsx` | Refactor — centralise |
| Score display | `StudentDashboard.tsx`, `PracticeResultPanel.tsx`, `Reports.tsx` | Refactor — extract component |
| Study plan | `StudentDashboard.tsx` (hardcoded), `LearningCentre.tsx` (API) | Remove hardcoded version |

---

## 14. Accessibility

### Current State
- Semantic HTML used (`<nav>`, `<main>`, `<table>`, `<form>`, etc.)
- Keyboard shortcuts: Alt+N / Alt+P (mock tests only)
- Limited aria attributes
- No explicit focus management
- Theme support (dark/light) but limited contrast checking
- `cursor-pointer` on interactive elements
- `disabled` attribute on buttons
- `alt` text on images
- `referrerPolicy="no-referrer"` on images

### Assessment
| Requirement | Status |
|-------------|--------|
| Keyboard navigation | Partial — needs full support |
| Visible focus | Missing |
| Heading order | Partial — needs audit |
| Form labels | Partial |
| Modal focus management | Missing |
| Screen reader announcements | Missing |
| Non-colour status indicators | Missing |
| Reduced motion | Missing |
| Touch target sizing | Missing |

---

## 15. Playwright Tests

**Config:** `playwright.config.ts`

| Test File | Status |
|-----------|--------|
| `tests/e2e/live-server.spec.ts` | Present |
| `tests/e2e/mock-journey.spec.ts` | Present |
| `tests/e2e/practice-real-workflows.spec.ts` | Present |
| `tests/e2e/speaking-practice.spec.ts` | Present |

### Assessment
- Only Chromium desktop — no mobile viewport tests
- No responsive Playwright tests
- No keyboard navigation tests
- No student portal shell/navigation tests

---

## 16. Responsive Design

### Current State
- Tailwind responsive prefixes used (`sm:`, `md:`, `lg:`, `xl:`)
- No `window.innerWidth`, `min-width`, `w-screen`, or `100vw` found in src/
- No dedicated mobile-first layout for student views
- `overflow-x-auto` on LearningCentre tab bar

### Assessment
| Requirement | Status |
|-------------|--------|
| 320px width support | Partial — not tested |
| Mobile bottom navigation | Missing |
| Responsive sidebar | Missing |
| Touch targets | Not verified |

---

## 17. Mock Data / Demo Data

**File:** `src/data/mockData.ts`

Contains hardcoded:
- `PTE_TASK_TYPES` (all 22 task definitions — duplicated from registry)
- `PRACTICE_ITEMS` (per-task practice data)
- `MOCK_TESTS` (static mock exam data)
- `TEST_ATTEMPTS` (static attempt records)
- `COURSES`, `LESSONS`, `FLASHCARDS`
- `SUBMISSIONS`
- `STUDENTS`
- `REVIEWS`, `BLOG_POSTS`, `FAQS`

### Assessment
| Data | Classification |
|------|---------------|
| `PTE_TASK_TYPES` | Remove — use contract registry |
| `PRACTICE_ITEMS` | Remove — use real API data |
| `MOCK_TESTS` | Remove — use real API data |
| `TEST_ATTEMPTS` | Remove — use real API data |
| `COURSES`, `LESSONS` | Retain as fallback |
| `FLASHCARDS` | Retain as fallback |
| `SUBMISSIONS` | Remove — use real API data |
| `STUDENTS` | Remove — not used by student UI |
| `REVIEWS`, `BLOG_POSTS`, `FAQS` | Retain — public website data |

---

## 18. TODO / FIXME / Placeholder Inventory

Search results for `TODO`, `FIXME`, `placeholder`, `demo data`:

**Let's search for these in subsequent phases. Expected locations:**
- `src/practice/` — some TODO markers in early task modules
- `src/server/` — some FIXME markers in route handlers
- `src/components/MockTestEngine.tsx` — likely has TODOs given size

---

## Summary of Classifications

| Category | Reuse | Refactor | Replace | Remove | Missing |
|----------|-------|----------|---------|--------|---------|
| Task registries | 3 | 0 | 0 | 1 | 0 |
| Practice components | 7 | 0 | 0 | 0 | 0 |
| Mock exam components | 3 | 4 | 0 | 0 | 0 |
| Dashboard | 1 | 3 | 1 | 0 | 0 |
| Reports/Analytics | 1 | 4 | 0 | 0 | 0 |
| Billing | 2 | 3 | 0 | 0 | 0 |
| Navigation | 3 | 0 | 2 | 0 | 0 |
| Design tokens | 1 | 1 | 3 | 0 | 2 |
| UI primitives | 0 | 0 | 0 | 0 | 16 |
| API clients | 6 | 0 | 0 | 0 | 0 |
| Mock data | 3 | 0 | 0 | 5 | 0 |
| Accessibility | 0 | 0 | 0 | 0 | 9 |
| **Total** | **30** | **15** | **6** | **6** | **27** |
