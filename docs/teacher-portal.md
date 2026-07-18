# Teacher Portal

## Overview
Teachers access assigned students only. All routes are scoped via TeacherStudentAssignment.

## Backend APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/teacher/dashboard` | Assigned counts + submission stats |
| GET | `/api/teacher/students` | List assigned students (safe fields) |
| GET | `/api/teacher/students/:id` | Student detail + recent subs/mocks/lessons |
| GET | `/api/teacher/students/:id/activity` | Student submission history |
| GET | `/api/teacher/students/:id/reports` | Section/task averages |
| GET | `/api/teacher/submissions` | Submissions from assigned students |
| GET | `/api/teacher/submissions/:id` | Single submission (assignment-scoped) |
| POST | `/api/teacher/submissions/:id/feedback` | Add feedback via TeacherSubmissionReview |
| PATCH | `/api/teacher/submissions/:id/review-status` | Set review status (pending/reviewed) |
| GET | `/api/teacher/mock-tests` | Mock attempts from assigned students |
| GET | `/api/teacher/learning-progress` | Lesson/flashcard progress aggregate |
| GET | `/api/teacher/notes` | List own notes (admin: all) |
| POST | `/api/teacher/notes` | Create note for assigned student |
| PATCH | `/api/teacher/notes/:id` | Update own note |
| DELETE | `/api/teacher/notes/:id` | Delete own note |

## Admin Assignment Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/assignments` | List all teacher-student assignments |
| POST | `/api/admin/assignments` | Create (validates roles, handles duplicates) |
| DELETE | `/api/admin/assignments/:id` | Remove (audit logged) |

## Data Safety
- Teacher feedback in TeacherSubmissionReview, never alters system score
- subTier/subExpiresAt/couponApplied not returned in teacher-safe selects
- answerKeyJson, questionsJson, answersJson never returned
- password/reset-token fields never exposed
- All routes assignment-scoped; admin can see all for support
