# Component Inventory — Student Portal

## 1. Top-Level Application Components

| Component | File | Lines | Classification | Notes |
|-----------|------|-------|---------------|-------|
| App | `src/App.tsx` | 402 | Refactor | State-based routing → URL router |
| Auth | `src/components/Auth.tsx` | 391 | Reuse unchanged | Login/register/forgot/reset |
| ThemeContext | `src/components/ThemeContext.tsx` | - | Reuse unchanged | Dark/light theme provider |
| ChangePasswordModal | `src/components/ChangePasswordModal.tsx` | - | Reuse unchanged | |

## 2. Student-Specific Components

| Component | File | Lines | Classification | Notes |
|-----------|------|-------|---------------|-------|
| StudentDashboard | `src/components/StudentDashboard.tsx` | 367 | Refactor | Consolidate with real API |
| LearningCentre | `src/components/LearningCentre.tsx` | 875 | Refactor | Break into sub-components |
| PracticeEngine | `src/components/PracticeEngine.tsx` | 242 | Reuse unchanged | Reuse as-is in new shell |
| MockTestEngine | `src/components/MockTestEngine.tsx` | 2248 | Refactor | Break into focused sub-components |
| Reports | `src/components/Reports.tsx` | 535 | Refactor | Extract reusable analytics |
| BillingUI | `src/components/BillingUI.tsx` | 488 | Refactor | Use central entitlement resolver |

## 3. Practice Engine Sub-Components

| Component | File | Classification | Notes |
|-----------|------|---------------|-------|
| PracticeMainPanel | `src/practice/components/PracticeMainPanel.tsx` | Reuse unchanged | |
| PracticeResultPanel | `src/practice/components/PracticeResultPanel.tsx` | Reuse unchanged | |
| PracticeSidePanels | `src/practice/components/PracticeSidePanels.tsx` | Reuse unchanged | |
| PracticeTaskForm | `src/practice/components/PracticeTaskForm.tsx` | Reuse unchanged | |
| QuestionNavBar | `src/practice/components/QuestionNavBar.tsx` | Reuse unchanged | |
| TaskSidebar | `src/practice/components/TaskSidebar.tsx` | Reuse unchanged | |

## 4. Practice Task Renderers (22)

| Task Code | Path | Classification |
|-----------|------|---------------|
| RA | `src/practice/tasks/RA/` | Reuse unchanged |
| RS | `src/practice/tasks/RS/` | Reuse unchanged |
| DI | `src/practice/tasks/DI/` | Reuse unchanged |
| RL | `src/practice/tasks/RL/` | Reuse unchanged |
| ASQ | `src/practice/tasks/ASQ/` | Reuse unchanged |
| SGD | `src/practice/tasks/SGD/` | Reuse unchanged |
| RTS | `src/practice/tasks/RTS/` | Reuse unchanged |
| SWT | `src/practice/tasks/SWT/` | Reuse unchanged |
| WE | `src/practice/tasks/WE/` | Reuse unchanged |
| MCS | `src/practice/tasks/MCS/` | Reuse unchanged |
| MCM | `src/practice/tasks/MCM/` | Reuse unchanged |
| ROP | `src/practice/tasks/ROP/` | Reuse unchanged |
| FIBR | `src/practice/tasks/FIBR/` | Reuse unchanged |
| FIBRW | `src/practice/tasks/FIBRW/` | Reuse unchanged |
| SST | `src/practice/tasks/SST/` | Reuse unchanged |
| MCMSL | `src/practice/tasks/MCMSL/` | Reuse unchanged |
| FIBL | `src/practice/tasks/FIBL/` | Reuse unchanged |
| HCS | `src/practice/tasks/HCS/` | Reuse unchanged |
| MCSSL | `src/practice/tasks/MCSSL/` | Reuse unchanged |
| SMW | `src/practice/tasks/SMW/` | Reuse unchanged |
| HIW | `src/practice/tasks/HIW/` | Reuse unchanged |
| WFD | `src/practice/tasks/WFD/` | Reuse unchanged |

## 5. Practice Contracts and Registries

| Component | File | Classification | Notes |
|-----------|------|---------------|-------|
| Types | `src/practice/contracts/types.ts` | Reuse unchanged | CanonicalTaskContract, PTETaskCode |
| Registry | `src/practice/contracts/registry.ts` | Reuse unchanged | All 22 task contracts |
| Policies | `src/practice/contracts/policies.ts` | Reuse unchanged | |
| Validation | `src/practice/contracts/validation.ts` | Reuse unchanged | |
| Transitions | `src/practice/contracts/transitions.ts` | Reuse unchanged | |
| StudentSafeQuestion | `src/practice/contracts/studentSafeQuestion.ts` | Reuse unchanged | |
| PublishValidation | `src/practice/contracts/publishValidation.ts` | Reuse unchanged | |
| Task Registry | `src/practice/tasks/registry.ts` | Reuse unchanged | Maps code → module |
| Task Types | `src/practice/tasks/types.ts` | Reuse unchanged | |

## 6. Practice Hooks

| Hook | File | Classification |
|------|------|---------------|
| useAudioRecorder | `src/practice/hooks/useAudioRecorder.ts` | Reuse unchanged |
| usePracticeAttempt | `src/practice/hooks/usePracticeAttempt.ts` | Reuse unchanged |
| usePracticeNavigation | `src/practice/hooks/usePracticeNavigation.ts` | Reuse unchanged |
| useQuestionNote | `src/practice/hooks/useQuestionNote.ts` | Reuse unchanged |
| useSubmissionHistory | `src/practice/hooks/useSubmissionHistory.ts` | Reuse unchanged |
| useTaskTimer | `src/practice/hooks/useTaskTimer.ts` | Reuse unchanged |

## 7. Practice Scorers

| Component | File | Classification |
|-----------|------|---------------|
| Scorer registry | `src/practice/scoring/index.ts` | Reuse unchanged |
| Individual scorers | `src/practice/scoring/*.ts` | Reuse unchanged |

## 8. Shared Type Definitions

| File | Classification | Notes |
|------|---------------|-------|
| `src/types.ts` | Reuse unchanged | Core types |
| `src/shared/api/practice.ts` | Reuse unchanged | API response types |
| `src/shared/routes.ts` | Reuse unchanged | Route constants |
| `src/shared/questionTaskRegistry.ts` | Reuse unchanged | Zod validation schemas |

## 9. API Client Modules

| File | Classification | Notes |
|------|---------------|-------|
| `src/api/client.ts` | Reuse unchanged | Shared fetch wrapper |
| `src/api/student.api.ts` | Reuse unchanged | Student API functions |
| `src/api/auth.api.ts` | Reuse unchanged | |
| `src/api/admin.api.ts` | Reuse unchanged | |
| `src/api/teacher.api.ts` | Reuse unchanged | |
| `src/api/questions.api.ts` | Reuse unchanged | |

## 10. Server-Side Student Module

| File | Classification | Notes |
|------|---------------|-------|
| `src/server/student.ts` | Reuse unchanged | Student route handlers |
| `src/server/routes/index.ts` | Reuse unchanged | Route mounting |

## 11. New Components Required

These components are missing and need to be built across phases:

### Phase 1 — Design Tokens & Primitives
- Button
- IconButton
- Input
- SearchField
- Select
- Checkbox
- Tabs
- Badge
- ProgressBar
- Skeleton
- Alert
- EmptyState
- ErrorState
- Drawer / BottomSheet
- Modal
- Toast
- Tooltip

### Phase 2 — Portal Shell
- StudentPortalShell
- DesktopStudentSidebar
- MobileStudentTopBar
- MobileStudentBottomNavigation
- StudentPortalHeader
- StudentProfileMenu
- StudentNotificationButton
- StudentPageContainer
- StudentBreadcrumbs

### Phase 3 — Dashboard
- DashboardGreeting
- TargetScoreCard
- ExamDateCard
- ContinueActivityCard
- ReadinessSummary
- DailyStudyPlanSummary
- RecommendedActions
- RecentActivityList
- WeakAreasList
- UpcomingItems
- SubscriptionSummaryCard

### Phase 4 — Practice Library
- PracticeLibraryPage
- TaskCard
- SkillGroupSection
- PracticeSearchBar
- PracticeFilterSheet (mobile)
- PracticeSortDropdown

### Phase 5 — Question Browser
- QuestionBrowserPage
- QuestionList
- QuestionFilterBar
- QuestionSearchBar
- PaginationControls
- CustomPracticeDialog
- PracticeModeSelector

### Phase 6 — Session UI
- SessionHeader
- SessionControls
- QuestionRenderer
- KeyboardShortcutHelp
- ExitConfirmDialog

### Phase 7 — Session Recovery
- SaveStatusIndicator
- ConnectionBanner
- OfflineBanner
- SessionRestoreDialog

### Phase 8 — Mock Exam
- MockExamLibrary
- MockExamCard
- PreExamScreen
- ExamShell
- ExamTimer
- SectionLockIndicator
- SubmissionConfirmDialog
- ProcessingResult

### Phase 9 — Results
- ResultSummaryCard
- SkillScoreCard
- QuestionReviewPanel
- ScoreBreakdown
- FeedbackPanel
- StrengthsWeaknesses
- ImprovementRecommendations
- ReviewFilterBar

### Phase 10 — Analytics
- AnalyticsOverview
- ScoreTrendChart
- SkillTrendChart
- StudyTimeChart
- TaskAnalytics
- DateRangePicker
- AnalyticsSummaryText

### Phase 11 — Study Plan
- StudyPlanSetup
- DailyActivityList
- WeeklyFocusCard
- ActivityCard
- RescheduleDialog

### Phase 12 — Learning Management
- AssignmentList
- AssignmentCard
- AssignmentDetail
- BookmarkList
- BookmarkCard
- HistoryList
- HistoryFilter

### Phase 13 — Subscription & Notifications
- SubscriptionPlanCard
- UsageMeter
- EntitlementResolver
- NotificationList
- NotificationCard
- NotificationPreferences
- NotificationBadge

## 12. Dependencies Between Component Groups

```
Phase 1 (Tokens + Primitives) → Phase 2 (Shell) → Phase 3-14 (Pages)
Phase 2 (Shell) → All page components
Phase 3 (Dashboard) → Phase 9 (Results reference)
Phase 4 (Practice Library) → Phase 5 (Question Browser) → Phase 6 (Session)
Phase 6 (Session) → Phase 7 (Recovery)
Phase 8 (Mock Exam) → Phase 9 (Results)
Phase 9 (Results) → Phase 10 (Analytics)
Phase 11 (Study Plan) → Phases 3, 4, 6, 8 (activity launch)
Phase 12 (Learning Management) → Phase 4, 5, 6 (bookmarks, assignments)
Phase 13 (Commercial) → All phases (entitlement gating)
Phase 14 (Hardening) → All phases (audit + repair)
```
