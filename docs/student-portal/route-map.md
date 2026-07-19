# Student Portal Route Map

## Current (State-Based) Routes

| Current View | Entry Point | Component | Deep-Linkable? |
|-------------|-------------|-----------|----------------|
| Student Dashboard | Role = `student`, default view | `StudentDashboard.tsx` | No |
| Learning Centre | Nav click → `LearningCentre` | `LearningCentre.tsx` | No |
| Practice (all tasks) | Nav click → `PracticeEngine` | `PracticeEngine.tsx` | No |
| Practice Task Detail | Task sidebar click | `PracticeMainPanel.tsx` | No |
| Practice Session | Question click → attempt | Inline in PracticeEngine | No |
| Mock Exams | Nav click → `MockTestEngine` | `MockTestEngine.tsx` | No |
| Mock Exam Session | Start/resume mock | Inline in MockTestEngine | No |
| Reports & Analytics | Nav click → `Reports` | `Reports.tsx` | No |
| Detailed Review | Report item click | Inline in Reports | No |
| Billing/Subscription | Nav click → `BillingUI` | `BillingUI.tsx` | No |
| Change Password | Profile dropdown | `ChangePasswordModal.tsx` | No |

## Target (URL-Based) Routes

All routes should be under `/student/` prefix. These are the routes to implement across phases.

| Route | Page Component | Phase | Priority |
|-------|---------------|-------|----------|
| `/student/dashboard` | DashboardPage | 3 | P0 |
| `/student/practice` | PracticeLibrary | 4 | P0 |
| `/student/practice/:taskType` | TaskDetailPage | 4 | P0 |
| `/student/practice/:taskType/questions` | QuestionBrowser | 5 | P0 |
| `/student/practice/session/:sessionId` | PracticeSession | 6 | P0 |
| `/student/mock-exams` | MockExamLibrary | 8 | P0 |
| `/student/mock-exams/:examId` | MockExamDetail | 8 | P0 |
| `/student/mock-exams/session/:sessionId` | MockExamSession | 8 | P0 |
| `/student/study-plan` | StudyPlanPage | 11 | P1 |
| `/student/analytics` | AnalyticsPage | 10 | P1 |
| `/student/analytics/task/:taskType` | TaskAnalyticsPage | 10 | P1 |
| `/student/review` | ReviewListPage | 9 | P1 |
| `/student/review/:attemptId` | ReviewDetailPage | 9 | P1 |
| `/student/results/:attemptId` | ResultPage | 9 | P1 |
| `/student/assignments` | AssignmentListPage | 12 | P1 |
| `/student/assignments/:id` | AssignmentDetailPage | 12 | P1 |
| `/student/bookmarks` | BookmarkPage | 12 | P1 |
| `/student/achievements` | AchievementPage | 12 | P2 |
| `/student/subscription` | SubscriptionPage | 13 | P1 |
| `/student/profile` | ProfilePage | 2 | P1 |
| `/student/settings` | SettingsPage | 2 | P2 |
| `/student/support` | SupportPage | 2 | P2 |
| `/student/notifications` | NotificationPage | 13 | P2 |

## Phase 2 Placeholder Routes

These routes render a placeholder shell in Phase 2 and are filled in later phases:

| Route | Phase 2 Status | Full Implementation Phase |
|-------|---------------|--------------------------|
| `/student/dashboard` | Placeholder | Phase 3 |
| `/student/practice` | Placeholder | Phase 4 |
| `/student/mock-exams` | Placeholder | Phase 8 |
| `/student/study-plan` | Placeholder | Phase 11 |
| `/student/analytics` | Placeholder | Phase 10 |
| `/student/review` | Placeholder | Phase 9 |
| `/student/assignments` | Placeholder | Phase 12 |
| `/student/bookmarks` | Placeholder | Phase 12 |
| `/student/achievements` | Placeholder | Phase 12 |
| `/student/subscription` | Placeholder | Phase 13 |
| `/student/profile` | Placeholder | Phase 14 |
| `/student/settings` | Placeholder | Phase 14 |
| `/student/support` | Placeholder | Phase 14 |

## Navigation Groups

### Desktop Sidebar
```
Dashboard
Practice
Mock Exams
Study Plan
---
Analytics
Review
Assignments
Bookmarks
Achievements
---
Subscription
Help
```

### Mobile Bottom Navigation
```
Home      → /student/dashboard
Practice  → /student/practice
Mock      → /student/mock-exams
Progress  → /student/analytics
More      → Drawer with remaining routes
```

## Backend API Routes (Existing)

### Student Endpoints
```
GET    /api/student/dashboard-stats
GET    /api/student/courses
GET    /api/student/courses/:courseId/lessons
POST   /api/student/lessons/:lessonId/toggle
GET    /api/student/practice/submissions
POST   /api/student/practice/submit
POST   /api/student/practice/attempts/start
POST   /api/student/practice/attempts/:attemptId/play-prompt
POST   /api/student/practice/attempts/:attemptId/audio-upload
POST   /api/student/practice/attempts/:attemptId/submit
GET    /api/student/practice/attempts/:attemptId
GET    /api/student/practice/attempts/:attemptId/result
GET    /api/student/questions
GET    /api/student/questions/counts
GET    /api/student/mock-tests
POST   /api/student/mock-tests/generate
GET    /api/student/mock-tests/attempts
POST   /api/student/mock-tests/attempts
GET    /api/student/mock-tests/active
POST   /api/student/mock-tests/save-progress
POST   /api/student/mock-tests/complete
POST   /api/student/mock-tests/submit
GET    /api/student/diagnostic-state
POST   /api/student/diagnostic/submit
GET    /api/student/flashcards
POST   /api/student/flashcards/:cardId/toggle
POST   /api/student/coupon/validate
POST   /api/student/subscribe
POST   /api/student/unsubscribe
GET    /api/student/custom-questions
GET    /api/student/reports/overview
GET    /api/student/reports/sections
GET    /api/student/reports/tasks
GET    /api/student/reports/progress
GET    /api/student/reports/recent-activity
GET    /api/student/reports/readiness
GET    /api/student/learning/overview
GET    /api/student/study-plan
GET    /api/student/notifications
POST   /api/student/notifications/read-all
POST   /api/student/notifications/:id/read
```

### New API Contracts Needed (Future Phases)

| Endpoint | Phase |
|----------|-------|
| `GET /api/student/dashboard` (aggregated) | Phase 3 |
| `POST /api/student/sessions/:sessionId/autosave` | Phase 7 |
| `POST /api/student/sessions/:sessionId/recover` | Phase 7 |
| `POST /api/student/sessions/:sessionId/submit` | Phase 7 |
| `GET /api/student/analytics/overview` | Phase 10 |
| `GET /api/student/analytics/task/:taskType` | Phase 10 |
| `GET /api/student/study-plan/activities` | Phase 11 |
| `POST /api/student/study-plan/activities/:id/start` | Phase 11 |
| `POST /api/student/study-plan/activities/:id/complete` | Phase 11 |
| `POST /api/student/study-plan/activities/:id/skip` | Phase 11 |
| `POST /api/student/study-plan/regenerate` | Phase 11 |
| `GET /api/student/assignments` | Phase 12 |
| `GET /api/student/assignments/:id` | Phase 12 |
| `POST /api/student/assignments/:id/submit` | Phase 12 |
| `GET /api/student/bookmarks` | Phase 12 |
| `POST /api/student/bookmarks` | Phase 12 |
| `DELETE /api/student/bookmarks/:id` | Phase 12 |
| `GET /api/student/history` | Phase 12 |
| `GET /api/student/subscription` | Phase 13 |
| `GET /api/student/entitlements` | Phase 13 |
