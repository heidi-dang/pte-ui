# Mock Test Engine

## Overview

The MockTestEngine provides CMS-backed mock exams for PTE practice. Tests are generated from published QuestionBankItems and support mini, section, and full modes. Attempt progress is persisted for resume after interruption.

---

## CMS-Backed Generation

- Tests use only `status: 'published'` QuestionBankItems
- Generator queries per task code and cycles through available questions
- Questions carry `source: 'cms'` or `source: 'fallback'` labels
- Fallback questions appear when CMS has insufficient published content for a task code

### Test Modes

| Mode | Structure | Time |
|------|-----------|------|
| mini | 9 questions across all sections | ~20 min |
| section | Focused on selected section (Speaking/Writing/Reading/Listening) | ~30 min |
| full | Full PTE distribution (62 questions) | ~120 min |

---

## Attempt Lifecycle

1. **Generate** (`POST /api/student/mock-tests/generate`) — creates question sequence from CMS
2. **Start** (`POST /api/student/mock-tests/save-progress`) — creates attempt with `questionsJson`
3. **Save** (every 30s or on action) — persists `currentQuestionIndex`, `secondsRemaining`, `answersJson`
4. **Pause** — sets status to `Paused`
5. **Resume** (`GET /api/student/mock-tests/active`) — restores questions, answers, index, and time
6. **Complete** (`POST /api/student/mock-tests/complete`) — marks as `Completed`

## Resume

- Active endpoint finds most recent `In Progress` or `Paused` attempt
- Questions are restored from `questionsJson` (not regenerated)
- Answers, current question index, and seconds remaining are all restored

---

## Scoring

- Mock tests are submitted with scores set to 0 (pending)
- No fake scoring — no `Math.random()` scores, no AI label claims
- Scoring integration is pending Phase 7 AI scoring service
- Notification says "Mock Exam Submitted", not "Scored"

---

## Timer

- Client-side countdown with autosave every 30 seconds
- Seconds remaining persists in the database
- On resume, timer restores from database value

---

## Production Safety

- No `/uploads/mock-student-recording.wav` or fake audio URLs
- No `answerKeyJson` exposed before submission
- No draft/archived CMS questions in tests
- No official PTE score claims
- No AI scoring labels unless service actually runs
