# Reports & Analytics

## Overview

Student reports use real database records from practice submissions, mock tests, lesson completions, and flashcard state. No hardcoded scores, simulated data, or fake AI/PTE claims.

---

## Backend APIs

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/student/reports/overview` | Yes | Counts: scored/pending submissions, mock tests, lessons, flashcards, target, average |
| GET | `/api/student/reports/progress` | Yes | Practice/mock/lesson trends from dated records |
| GET | `/api/student/reports/sections` | Yes | Average score per section from graded submissions |
| GET | `/api/student/reports/tasks` | Yes | Task code breakdown: total, scored, pending, other, average |
| GET | `/api/student/reports/recent-activity` | Yes | Combined practice + mock + lesson entries, sorted by date |
| GET | `/api/student/reports/readiness` | Yes | Combined practice + mock score estimate with caveat |

## Data Sources

- `PracticeSubmission` — graded submissions with score, pending without
- `TestAttempt` — completed with overallScore
- `LessonCompletion` — has `completedAt` timestamp for trend
- `FlashcardState` — no timestamp; counted as current total only
- `User.targetScore` — nullable, not defaulted to 79

## Score Handling

- `score: { not: null }` — excludes null (ungraded) from averages
- Score 0 is valid and counted in all averages
- Pending submissions counted separately, not averaged
- Mock test overallScore included in readiness estimate

## Readiness Estimate

- Combined practice + mock scores where available
- If no scored records exist: "Insufficient data for readiness estimate"
- If data exists: "Practice readiness estimate, not an official PTE score"
- Shows inputs: submissions count, mocks count, sections with data

## Empty State

- All endpoints return empty arrays / zero counts when no data exists
- Frontend shows: "No report data available yet. Complete practice submissions and mock tests."

## Data Safety

Student report endpoints do NOT return:
- `answerKeyJson`
- `sampleAnswer`
- `explanation`
- Draft/archived CMS questions
- Admin-only data
- Reset tokens
- Private billing fields

## Limitations

- FlashcardState has no timestamp — no historical flashcard trend
- LessonCompletion timestamps are used for trend, FlashcardState count is current only
- "Other" status submissions (non-graded, non-pending) counted in task totals
