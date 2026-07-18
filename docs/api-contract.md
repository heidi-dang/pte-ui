# API Contract

## Conventions

- **Error shape**: `{ error: string }` — all endpoints
- **Success shape**: Either a direct resource object/array, or `{ success: true, ...data }` for mutations
- **Auth errors**: `401 { error: "Access token missing" }`, `403 { error: "Invalid or expired token" }`, `403 { error: "User inactive or not found" }`
- **Role errors**: `403 { error: "Permission denied for this role" }`
- **Route constants**: All paths defined in `src/shared/routes.ts`

---

## Auth — `/api/auth/*`

| Method | Path | Auth | Roles | Request | Success | Frontend caller | Handler | Status |
|--------|------|------|-------|---------|---------|-----------------|---------|--------|
| POST | `/api/auth/signup` | None | public | `{ email, password, name, role?, targetScore? }` | `201 { token, user }` | `auth.api.ts` → `ThemeContext.tsx` | `auth.ts` | ✅ |
| POST | `/api/auth/login` | None | public | `{ email, password }` | `200 { token, user }` | `auth.api.ts` → `ThemeContext.tsx` | `auth.ts` | ✅ |
| GET | `/api/auth/me` | `authenticateToken` | any authed | — | `200 { id, email, name, role, targetScore, currentAvg, subTier, couponApplied, subExpiresAt }` | `auth.api.ts` → `ThemeContext.tsx` | `auth.ts` | ✅ |
| POST | `/api/auth/forgot-password` | None | public | `{ email }` | `200 { message }` — plus `{ resetToken?, resetUrl? }` in dev+lib | `auth.api.ts` → `Auth.tsx` | `auth.ts` | ✅ |
| POST | `/api/auth/reset-password` | None | public | `{ token, newPassword }` | `200 { message }` | `auth.api.ts` → `Auth.tsx` | `auth.ts` | ✅ |
| POST | `/api/auth/change-password` | `authenticateToken` | any authed | `{ currentPassword, newPassword }` | `200 { message }` | `auth.api.ts` → `ChangePasswordModal.tsx` | `auth.ts` | ✅ |

### Notes

- Public signup silently forces `role = "student"`; rejects admin/teacher roles with `400`.
- Forgot-password always returns generic message to prevent user enumeration.
- Reset token returned only when `!config.isProduction && config.demoMode`.

---

## Student — `/api/student/*` (all require `authenticateToken`)

| Method | Path | Request | Success | Frontend caller | Handler | Status |
|--------|------|---------|---------|-----------------|---------|--------|
| GET | `/api/student/dashboard-stats` | — | `{ overallScore, targetScore, streakDays, lastActive, skills, weeklyActivity }` | `StudentDashboard.tsx`, `Reports.tsx` | `student.ts` | ✅ |
| GET | `/api/student/courses` | — | `Course[]` with `progress` | — | `student.ts` | ✅ |
| GET | `/api/student/courses/:courseId/lessons` | — | `Lesson[]` with `completed` | `StudentDashboard.tsx` | `student.ts` | ✅ |
| POST | `/api/student/lessons/:lessonId/toggle` | — | `{ completed }` | — | `student.ts` | ✅ |
| GET | `/api/student/practice/submissions` | — | `PracticeSubmission[]` | `StudentDashboard.tsx` | `student.ts` | ✅ |
| POST | `/api/student/practice/submit` | `{ taskCode, title, section, answerText?, audioUrl? }` | `201 PracticeSubmission` | `PracticeEngine.tsx` | `student.ts` | ✅ |
| GET | `/api/student/mock-tests` | — | `MockTest[]` (static) | — | `student.ts` | ✅ |
| GET | `/api/student/mock-tests/attempts` | — | `TestAttempt[]` | `MockTestEngine.tsx` | `student.ts` | ✅ |
| POST | `/api/student/mock-tests/submit` | `{ testId, title, type, scores? }` | `201 TestAttempt` | — | `student.ts` | ⚠️ scores default to 50 |
| GET | `/api/student/mock-tests/active` | — | `{ activeAttempt }` | `MockTestEngine.tsx` | `student.ts` | ✅ |
| POST | `/api/student/mock-tests/save-progress` | `{ attemptId?, testId, title, type, ... }` | `{ success: true, attempt }` | `MockTestEngine.tsx` | `student.ts` | ✅ |
| POST | `/api/student/mock-tests/complete` | `{ attemptId?, testId, title, type, scores?, answers? }` | `{ success: true, attempt }` | `MockTestEngine.tsx` | `student.ts` | ✅ |
| POST | `/api/student/mock-tests/generate` | `{ numQuestions?, aiGenerated?, taskCodes?, ... }` | `{ success: true, test }` | `MockTestEngine.tsx` | `student.ts` | ✅ |
| GET | `/api/student/flashcards` | — | `FlashcardState[]` | — | `student.ts` | ✅ |
| POST | `/api/student/flashcards/:cardId/toggle` | — | `{ mastered }` | — | `student.ts` | ✅ |
| GET | `/api/student/diagnostic-state` | — | `{ diagnosticDone, studyPlan?, estimatedScores? }` | `MockTestEngine.tsx` | `student.ts` | ✅ |
| POST | `/api/student/diagnostic/submit` | `{ answers }` | `{ success: true, diagnosticDone, studyPlan, estimatedScores }` | `MockTestEngine.tsx` | `student.ts` | ✅ |
| GET | `/api/student/notifications` | — | `Notification[]` | `ThemeContext.tsx` | `student.ts` | ✅ |
| POST | `/api/student/notifications/:id/read` | — | `{ success: true }` | `ThemeContext.tsx` via `student.api.ts` | `student.ts` | ✅ |
| POST | `/api/student/notifications/read-all` | — | `{ success: true }` | `ThemeContext.tsx` via `student.api.ts` | `student.ts` | ✅ |
| POST | `/api/student/coupon/validate` | `{ code }` | `{ success: true, discountPercent }` | `BillingUI.tsx` | `student.ts` | ✅ |
| POST | `/api/student/subscribe` | `{ planType, price, couponCode?, cardNumber, cardExpiry, cardCvc }` | `{ success: true, user }` | `BillingUI.tsx` | `student.ts` | ✅ |
| POST | `/api/student/unsubscribe` | — | `{ success: true, user }` | `BillingUI.tsx` | `student.ts` | ✅ |
| GET | `/api/student/custom-questions` | — | `CustomTask[]` (published only) | `TeacherUI.tsx` | `student.ts` | ✅ |
| GET | `/api/student/questions` | `{ taskCode?, section?, difficulty?, limit?, random? }` | `QuestionBankItem[]` (published only, safe fields) | `admin.api.ts` | `student.ts` | ✅ |

---

## Teacher — `/api/teacher/*` (require `authenticateToken` + `['teacher', 'admin']`)

All routes are assignment-scoped. Teachers only see assigned students. Admin can see all for support/audit.
Teacher feedback/review status is stored in `TeacherSubmissionReview` and does not alter system score.

| Method | Path | Success | Frontend | Handler | Status |
|--------|------|---------|----------|---------|--------|
| GET | `/api/teacher/dashboard` | `{ assignedCount, totalSubmissions, pendingScoring, scoredCount }` | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| GET | `/api/teacher/students` | `Student[]` (safe fields, assigned only) | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| GET | `/api/teacher/students/:id` | `{ student, submissions, tests, completedLessons }` | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| GET | `/api/teacher/students/:id/activity` | `Submission[]` (summary) | — | `teacher.ts` | ✅ |
| GET | `/api/teacher/students/:id/reports` | `{ sectionAvgs, taskAvgs, scoredCount }` | — | `teacher.ts` | ✅ |
| GET | `/api/teacher/submissions` | `Submission[]` (safe fields, assigned only) | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| GET | `/api/teacher/submissions/:id` | `{ ...submission, teacherReview }` | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| POST | `/api/teacher/submissions/:id/feedback` | `{ success, review }` | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| PATCH | `/api/teacher/submissions/:id/review-status` | `{ success, review }` | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| GET | `/api/teacher/mock-tests` | `TestAttempt[]` (assigned only) | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| GET | `/api/teacher/learning-progress` | `{ assignedStudents, totalLessonsCompleted, totalFlashcardsMastered }` | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| GET | `/api/teacher/notes` | `TeacherStudentNote[]` (own or all for admin) | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| POST | `/api/teacher/notes` | `201 TeacherStudentNote` (scoped) | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| PATCH | `/api/teacher/notes/:id` | `TeacherStudentNote` (own only) | `TeacherUI.tsx` | `teacher.ts` | ✅ |
| DELETE | `/api/teacher/notes/:id` | `{ success }` (own only) | `TeacherUI.tsx` | `teacher.ts` | ✅ |

### Admin Assignment Management

| Method | Path | Success | Frontend | Handler | Status |
|--------|------|---------|----------|---------|--------|
| GET | `/api/admin/assignments` | `TeacherStudentAssignment[]` | — | `admin.ts` | ✅ |
| POST | `/api/admin/assignments` | `201 TeacherStudentAssignment` (validates roles + duplicates) | — | `admin.ts` | ✅ |
| DELETE | `/api/admin/assignments/:id` | `{ success }` (audit logged) | — | `admin.ts` | ✅ |

### Data Safety
Teacher routes never expose: password, passwordResetTokenHash, passwordResetExpiresAt, passwordChangedAt, subTier, subExpiresAt, couponApplied, answerKeyJson, questionsJson, answersJson, audioUrl, answerText.

---

## Admin — `/api/admin/*` (require `authenticateToken` + `['admin']`)

| Method | Path | Request | Success | Frontend caller | Handler | Status |
|--------|------|---------|---------|-----------------|---------|--------|
| GET | `/api/admin/users` | — | `User[]` | `AdminUI.tsx` via `admin.api.ts` | `admin.ts` | ✅ |
| POST | `/api/admin/users/:id/role` | `{ role }` | `200 User` | — | `admin.ts` | ✅ |
| POST | `/api/admin/users/:id/status` | `{ status }` | `200 User` | — | `admin.ts` | ✅ |
| POST | `/api/admin/users/:id/tier` | `{ subTier }` | `200 User` | — | `admin.ts` | ✅ |
| GET | `/api/admin/coupons` | — | `Coupon[]` | `AdminUI.tsx` via `admin.api.ts` | `admin.ts` | ✅ |
| POST | `/api/admin/coupons` | `{ code, discountPercent, maxUses? }` | `201 { success: true, coupon }` | `AdminUI.tsx` via `admin.api.ts` | `admin.ts` | ✅ *(fixed)* |
| GET | `/api/admin/logs` | — | `LogEntry[]` | `AdminUI.tsx` via `admin.api.ts` | `admin.ts` | ✅ |
| GET | `/api/admin/jobs` | — | `BackgroundJob[]` | `AdminUI.tsx` via `admin.api.ts` | `admin.ts` | ✅ |
| GET | `/api/admin/audit-logs` | — | `AuditLog[]` | `AdminUI.tsx` via `admin.api.ts` | `admin.ts` | ✅ |
| POST | `/api/admin/backup` | — | `{ success: true, filename, size, destination }` | `AdminUI.tsx` via `admin.api.ts` | `admin.ts` | ✅ |
| GET | `/api/admin/system-metrics` | — | `{ totalUsers, roles, tiers, completedExams, customTasks, systemStatus }` | — | `admin.ts` | ✅ |
| GET | `/api/admin/question-bank` | `{ taskCode?, section?, difficulty?, status? }` | `QuestionBankItem[]` | `AdminUI.tsx` (direct) | `admin.ts` | ✅ |
| GET | `/api/admin/question-bank/:id` | — | `QuestionBankItem` | `admin.api.ts` | `admin.ts` | ✅ |
| POST | `/api/admin/question-bank` | `{ taskCode, section, title, instruction, promptText, ...optional }` | `201 { success: true, item }` | `AdminUI.tsx` (direct) | `admin.ts` | ✅ |
| PATCH | `/api/admin/question-bank/:id` | partial fields | `{ success: true, item }` | `admin.api.ts` | `admin.ts` | ✅ |
| PATCH | `/api/admin/question-bank/:id/status` | `{ status }` | `{ success: true, item }` | `AdminUI.tsx` (direct) | `admin.ts` | ✅ |
| DELETE | `/api/admin/question-bank/:id` | — | `{ success: true, item }` (archived) | `admin.api.ts` | `admin.ts` | ✅ *(soft delete)* |

---

## Upload — `/api/upload`

| Method | Path | Auth | Request | Success | Frontend caller | Handler | Status |
|--------|------|------|---------|---------|-----------------|---------|--------|
| POST | `/api/upload` | `authenticateToken` *(fixed)* | `multipart/form-data`, field: `file` | `{ url }` | — | `uploads.ts` | ✅ |

---

## System — `/api/*`

| Method | Path | Auth | Success | Handler | Status |
|--------|------|------|---------|---------|--------|
| GET | `/api/health` | None | `{ status: "ok", time }` | `app.ts` | ✅ |
| POST | `/api/seed` | None (gated by `demoMode`) | `{ success: true, message }` | `app.ts` | ✅ |

---

## Route Constants

All paths centralized in `src/shared/routes.ts` (40+ entries). Frontend API client files (`auth.api.ts`, `student.api.ts`, `teacher.api.ts`, `admin.api.ts`) use ROUTES exclusively. Component files that bypass API client files still contain some hardcoded paths; these are documented here but not refactored to avoid scope creep.

### Remaining hardcoded paths (not using ROUTES)

| File | Hardcoded path | Reason not replaced |
|------|----------------|---------------------|
| `StudentDashboard.tsx` | `/api/student/dashboard-stats`, `/api/student/practice/submissions`, `/api/student/courses/C-01/lessons` | Direct `apiFetch` calls, embedded in component logic |
| `BillingUI.tsx` | `/api/student/coupon/validate`, `/api/student/subscribe`, `/api/student/unsubscribe` | Direct `apiFetch` calls, embedded in component logic |
| `TeacherUI.tsx` | `/api/teacher/submissions`, `/api/teacher/students`, `/api/student/custom-questions`, `/api/teacher/custom-tasks`, `/api/teacher/grade` | Direct `apiFetch` calls, some through API client + some direct |
| `AdminUI.tsx` | `/api/admin/users`, `/api/admin/jobs`, `/api/admin/logs`, `/api/admin/coupons`, `/api/admin/audit-logs`, `/api/admin/backup` | Direct `apiFetch` calls, embedded in component logic |
| `PracticeEngine.tsx` | `/api/student/practice/submit` | Direct `apiFetch` call |
| `MockTestEngine.tsx` | 10+ paths (dashboard-stats, diagnostic-state, mock-tests/*) | Direct `apiFetch` calls |
| `Reports.tsx` | `/api/student/dashboard-stats` | Direct `apiFetch` call |

These are low-risk because they are consumed directly and their response shapes match the backend.

---

## Production Safety Checklist

- ✅ No JWT fallback (removed Phase 2)
- ✅ No reset token in production (`!config.isProduction && config.demoMode`)
- ✅ No public admin/teacher signup
- ✅ Role switcher gated behind `VITE_DEMO_MODE=true`
- ✅ No hardcoded host/port/model/provider values
- ✅ Upload endpoint requires authentication
- ✅ Demo seed gated behind `config.demoMode`

---

## Manual Verification Checklist

- [ ] Login success → returns `{ token, user }`
- [ ] Login failure → returns `401 { error }`
- [ ] Signup student success → returns `201 { token, user }`
- [ ] Signup admin/teacher → returns `400 { error }`
- [ ] `/me` with valid token → returns user object
- [ ] `/me` with invalid token → returns `403 { error }`
- [ ] Forgot-password → always returns `200 { message }`
- [ ] Reset-password with valid token → returns `200 { message }`
- [ ] Reset-password with invalid/expired token → returns `400 { error }`
- [ ] Change-password with correct current password → returns `200 { message }`
- [ ] Change-password with wrong current password → returns `403 { error }`
- [ ] Subscribe/unsubscribe → frontend reflects updated user profile
- [ ] Teacher create custom task → backend accepts and returns `{ success: true, customTask }`
- [ ] Teacher grade submission → backend accepts and returns updated submission
- [ ] Admin create coupon → backend accepts and returns `{ success: true, coupon }`
- [ ] Upload file → returns `{ url }`
- [ ] No console errors from response shape mismatches during main user flows
