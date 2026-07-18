# Learning Centre

## Overview

The Learning Centre provides backend-persisted course, lesson, flashcard, and study plan functionality. All progress is stored in the database — not localStorage.

---

## Backend APIs

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/student/courses` | Yes | List courses with progress (%) computed from lesson completions |
| GET | `/api/student/courses/:id/lessons` | Yes | List lessons for a course with `completed` flag |
| POST | `/api/student/lessons/:id/toggle` | Yes | Toggle lesson completion (creates/deletes record) |
| GET | `/api/student/flashcards` | Yes | List flashcards with `mastered` state |
| POST | `/api/student/flashcards/:id/state` | Yes | Set flashcard `mastered` to explicit boolean |
| POST | `/api/student/flashcards/:id/toggle` | Yes | Legacy toggle (not used by LearningCentre) |
| GET | `/api/student/learning/overview` | Yes | Summary: completedLessons, flashcard counts, scored submissions |
| GET | `/api/student/study-plan` | Yes | Personalised study plan from practice/mock/lesson data |
| POST | `/api/student/study-plan/regenerate` | Yes | Regenerate study plan with latest data |

## Flashcard Persistence

- "Needs Study" button calls `POST /flashcards/:id/state { mastered: false }`
- "Mastered" button calls `POST /flashcards/:id/state { mastered: true }`
- The explicit state endpoint ensures repeated clicks do not toggle unexpectedly
- Frontend updates visible state from backend response

## Study Plan

- Generated from: PracticeSubmission (scored), TestAttempt (completed), LessonCompletion, FlashcardState
- Starter/fallback plan provided when no data exists
- Fallback plan is labelled: "Starter plan based on incomplete activity data"
- Daily tasks, weekly plan, weak areas, and source data counts are displayed
- Regenerate button calls POST endpoint with latest data

## Student Questions Safety

Student `GET /api/student/questions` does NOT return:
- `sampleAnswer`
- `explanation`
- `answerKeyJson`

These fields are only available via admin routes or after-submission review.

## localStorage Usage

- Bookmarks: cached in localStorage (non-authoritative)
- Session notes: temporary, not persisted to backend
- All learning progress data is stored in the database

## Limitations

- Notes are session-only and lost on refresh
- Bookmark persistence is localStorage only — no DB model exists
- Flashcard data is static (5 cards) — not CMS-backed
- No real AI scoring claims made
