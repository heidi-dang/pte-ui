# API Contract Inventory — Student Portal

## 1. Existing Student API Contracts

### Practice Endpoints

| Endpoint | Method | Request | Response Type | Status |
|----------|--------|---------|---------------|--------|
| `/api/student/questions` | GET | `QuestionListParams` | `QuestionListResponse` | ✅ Defined |
| `/api/student/questions/counts` | GET | None | `TaskCount[]` | ✅ Defined |
| `/api/student/practice/attempts/start` | POST | `{ questionBankItemId }` | `StartAttemptData` | ✅ Defined |
| `/api/student/practice/attempts/:id/play-prompt` | POST | None | `PlayPromptData` | ✅ Defined |
| `/api/student/practice/attempts/:id/audio-upload` | POST | FormData (audio) | `UploadAudioData` | ✅ Defined |
| `/api/student/practice/attempts/:id/submit` | POST | `{ responseText? }` | `SubmitAttemptData` | ✅ Defined |
| `/api/student/practice/attempts/:id` | GET | None | `GetAttemptData` | ✅ Defined |
| `/api/student/practice/attempts/:id/result` | GET | None | `GetAttemptResultData` | ✅ Defined |
| `/api/student/practice/submissions` | GET | None | Array | ✅ Defined |
| `/api/student/practice/submit` | POST | Body | Unknown | ⚠️ May overlap |

### Dashboard Endpoints

| Endpoint | Method | Request | Response | Status |
|----------|--------|---------|----------|--------|
| `/api/student/dashboard-stats` | GET | None | Unknown shape | ⚠️ Not typed in shared |
| `/api/student/reports/overview` | GET | None | Unknown shape | ⚠️ Not typed in shared |
| `/api/student/reports/sections` | GET | None | Unknown shape | ⚠️ Not typed in shared |
| `/api/student/reports/tasks` | GET | None | Unknown shape | ⚠️ Not typed in shared |
| `/api/student/reports/progress` | GET | None | Unknown shape | ⚠️ Not typed in shared |
| `/api/student/reports/recent-activity` | GET | None | Unknown shape | ⚠️ Not typed in shared |
| `/api/student/reports/readiness` | GET | None | Unknown shape | ⚠️ Not typed in shared |

### Mock Exam Endpoints

| Endpoint | Method | Request | Response | Status |
|----------|--------|---------|----------|--------|
| `/api/student/mock-tests` | GET | None | Array | ✅ Implemented |
| `/api/student/mock-tests/generate` | POST | Config | Mock test | ✅ Implemented |
| `/api/student/mock-tests/attempts` | GET/POST | Various | Attempt data | ✅ Implemented |
| `/api/student/mock-tests/active` | GET | None | Active attempt | ✅ Implemented |
| `/api/student/mock-tests/save-progress` | POST | Progress | Status | ✅ Implemented |
| `/api/student/mock-tests/complete` | POST | None | Completed data | ✅ Implemented |
| `/api/student/mock-tests/submit` | POST | Answers | Result | ✅ Implemented |

### Learning Endpoints

| Endpoint | Method | Request | Response | Status |
|----------|--------|---------|----------|--------|
| `/api/student/courses` | GET | None | Course[] | ✅ Implemented |
| `/api/student/courses/:id/lessons` | GET | None | Lesson[] | ✅ Implemented |
| `/api/student/lessons/:id/toggle` | POST | None | Status | ✅ Implemented |
| `/api/student/flashcards` | GET | None | Flashcard[] | ✅ Implemented |
| `/api/student/flashcards/:id/toggle` | POST | None | Status | ✅ Implemented |
| `/api/student/learning/overview` | GET | None | Unknown | ⚠️ Not typed |
| `/api/student/study-plan` | GET | None | Unknown | ⚠️ Not typed |

### Subscription Endpoints

| Endpoint | Method | Request | Response | Status |
|----------|--------|---------|----------|--------|
| `/api/student/coupon/validate` | POST | Code | Validation | ✅ Implemented |
| `/api/student/subscribe` | POST | Plan/tier | Status | ✅ Implemented |
| `/api/student/unsubscribe` | POST | None | Status | ✅ Implemented |

### Notification Endpoints

| Endpoint | Method | Request | Response | Status |
|----------|--------|---------|----------|--------|
| `/api/student/notifications` | GET | None | Notification[] | ✅ Implemented |
| `/api/student/notifications/read-all` | POST | None | Status | ✅ Implemented |
| `/api/student/notifications/:id/read` | POST | None | Status | ✅ Implemented |

## 2. Shared API Types

**File:** `src/shared/api/practice.ts`

### Well-Typed Contracts
- `PracticeStatus` — 12-status union
- `NextAction` — 5-action union
- `ApiSuccess<T>` — Generic success wrapper
- `ApiErrorResponse` — Error with code, message, details
- `StartAttemptData` — Full attempt start response
- `PlayPromptData` — Audio playback info
- `UploadAudioData` — Audio upload response
- `SubmitAttemptData` — Submit response with nextAction
- `ResultPayload` — Score, feedback, breakdown
- `GetAttemptResultData` — Result response wrapper
- `GetAttemptData` — Attempt info response
- `QuestionListParams` — Search/filter query params
- `QuestionProgressStatus` — Per-question progress
- `QuestionListItem` — Question list item shape
- `QuestionListResponse` — Paginated response
- `TaskCount` — Per-task question count

### Missing Typed Contracts
- `DashboardStatsResponse` — Not defined
- `ReportsOverviewResponse` — Not defined
- `StudyPlanResponse` — Not defined
- `AssignmentResponse` — Not defined
- `BookmarkResponse` — Not defined
- `HistoryResponse` — Not defined
- `SubscriptionResponse` — Not defined
- `EntitlementResponse` — Not defined
- `NotificationListResponse` — Not defined

## 3. Error Codes

**Defined in** `src/shared/api/practice.ts`:

| Code | Description |
|------|-------------|
| `ATTEMPT_NOT_FOUND_OR_FORBIDDEN` | Attempt missing or not owned |
| `ATTEMPT_EXPIRED` | Attempt deadline passed |
| `ATTEMPT_NOT_IN_PROGRESS` | Cannot act on non-active attempt |
| `PROMPT_PLAYBACK_LIMIT_REACHED` | Max audio plays exceeded |
| `PROMPT_AUDIO_NOT_AVAILABLE` | Audio not ready |
| `RESPONSE_AUDIO_REQUIRED` | Audio response needed |
| `RESPONSE_AUDIO_MISSING` | Audio not uploaded |
| `RESPONSE_TEXT_MISSING` | Text not provided |
| `INVALID_RESPONSE` | Response format invalid |
| `QUESTION_NOT_FOUND` | Question doesn't exist |
| `QUESTION_NOT_PUBLISHED` | Question not published |
| `VALIDATION_ERROR` | Request validation failed |
| `INTERNAL_ERROR` | Server error |

## 4. New API Contracts Required (Future Phases)

### Phase 3 — Aggregated Dashboard
```typescript
interface DashboardResponse {
  greeting: { name: string; avatar?: string };
  targetScore: { current: number; target: number; examDate?: string } | null;
  continueActivity: { type: 'practice' | 'mock' | 'study'; id: string; label: string } | null;
  readinessSummary: { score: number; level: string; trend: 'up' | 'down' | 'stable' } | null;
  dailyPlan: { activities: StudyActivity[] } | null;
  recommendedActions: RecommendedAction[] | null;
  recentActivity: RecentActivity[] | null;
  weakAreas: { taskCode: string; score: number }[] | null;
  upcomingItems: UpcomingItem[] | null;
  subscription: { status: string; plan: string } | null;
}
```

### Phase 7 — Session Recovery
```typescript
interface AutosaveRequest { responseData: unknown; timestamp: string; }
interface AutosaveResponse { status: 'saved' | 'conflict'; savedAt: string; }
interface RecoverResponse { session: { attemptId: string; responses: unknown; lastSavedAt: string; }; }
interface SubmitResponse { submissionId: string; status: string; nextAction: NextAction; }
```

### Phase 10 — Analytics
```typescript
interface AnalyticsOverviewResponse {
  scoreTrend: { date: string; score: number }[];
  skillTrends: Record<string, { date: string; score: number }[]>;
  studyTime: { total: number; daily: { date: string; minutes: number }[] };
  questionsCompleted: number;
  accuracy: number;
  completionRate: number;
  consistency: number;
  mockPerformance: { score: number; date: string }[];
  targetReadiness: number;
}
```

### Phase 11 — Study Plan
```typescript
interface StudyPlanResponse {
  activities: StudyActivity[];
  weeklyFocus: { week: string; tasks: string[] };
  recommendedTasks: { taskCode: string; count: number }[];
}
```

### Phase 12 — Assignments
```typescript
interface AssignmentResponse {
  id: string;
  title: string;
  assignedBy: string;
  dueDate: string;
  instructions: string;
  requiredTasks: { taskCode: string; count: number }[];
  progress: { completed: number; total: number };
  status: 'not_started' | 'in_progress' | 'submitted' | 'returned' | 'completed' | 'overdue';
}
```

### Phase 13 — Subscription & Entitlements
```typescript
interface SubscriptionResponse {
  plan: string;
  status: 'active' | 'expired' | 'trial' | 'cancelled';
  renewalDate: string;
  features: string[];
  usage: Record<string, { used: number; limit: number }>;
  billingHistory: { date: string; amount: number; status: string }[];
}

interface EntitlementResponse {
  feature: string;
  status: 'available' | 'locked' | 'trial' | 'exhausted' | 'expired';
  message: string;
}
```

## 5. Data Flow Diagram

```
Browser ←→ StudentPortalShell (Phase 2)
  ├── DashboardPage (Phase 3) ←→ GET /api/student/dashboard
  ├── PracticeLibrary (Phase 4) ←→ GET /api/student/questions/counts
  ├── QuestionBrowser (Phase 5) ←→ GET /api/student/questions
  ├── PracticeSession (Phase 6) ←→ StartAttempt → PlayPrompt → AudioUpload → Submit
  ├── SessionRecovery (Phase 7) ←→ Autosave → Recover → Submit
  ├── MockExamLibrary (Phase 8) ←→ GET /api/student/mock-tests
  ├── MockExamSession (Phase 8) ←→ Mock engine endpoints
  ├── ResultsPage (Phase 9) ←→ GET /api/student/practice/attempts/:id/result
  ├── ReviewPage (Phase 9) ←→ GET /api/student/practice/attempts/:id
  ├── AnalyticsPage (Phase 10) ←→ GET /api/student/reports/*
  ├── StudyPlanPage (Phase 11) ←→ GET /api/student/study-plan
  ├── AssignmentsPage (Phase 12) ←→ GET /api/admin/assignments (student)
  ├── BookmarksPage (Phase 12) ←→ Bookmark CRUD
  ├── HistoryPage (Phase 12) ←→ GET /api/student/practice/submissions
  └── SubscriptionPage (Phase 13) ←→ GET /api/student/subscription
```
