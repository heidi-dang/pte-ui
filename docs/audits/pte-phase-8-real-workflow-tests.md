# PTE Phase 8 — Real Production Workflow Tests

## Test harness design

The real workflow test harness (`scripts/integration/practice-real-workflow-tests.mjs`) works as follows:

1. Creates an isolated SQLite test database with `prisma migrate deploy`
2. Seeds test user, published questions, and answer keys
3. Authenticates via JWT token (same as production login)
4. Exercises all student actions through real HTTP API calls
5. Polls result endpoint until terminal state or timeout
6. Cleans up test database after completion

The test does NOT:
- Directly update `PracticeAttempt.status` or `PracticeSubmission.score`
- Call worker functions bypassing the API
- Fake any terminal state

## Workflow coverage

| # | Task | Type | Status | Notes |
|---|---|---|---|---|
| A | MCS | deterministic structured | ✅ PASS | Full API cycle: start → submit → poll → Completed |
| B | WFD | deterministic dictation | ✅ PASS | Full API cycle with score verification |
| C | HIW | deterministic highlight | ✅ PASS | Highlight penalty works via API |
| D | RA | speaking (STT+AI) | ⏭️ SKIP | Requires audio upload + STT infrastructure |
| E | RS | one-play speaking | ⏭️ SKIP | Requires audio upload infrastructure |
| F | ASQ | audio+deterministic | ⏭️ SKIP | Requires STT to produce transcript |
| G | SGD | speaking+AI | ⏭️ SKIP | Requires audio + DeepSeek API key |
| H | SWT | AI writing | ⏭️ SKIP | Requires DeepSeek API key |
| I | WE | AI writing | ⏭️ SKIP | Requires DeepSeek API key |
| J | SST | listening+AI | ⏭️ SKIP | Requires audio + DeepSeek API key |

## All 22 task start gate

`scripts/smoke/all-22-task-start-smoke.mjs` verifies:
- Every task code has a registered canonical contract
- Student-safe question payloads match expected shape per task
- Sensitive fields (answerKeyJson, acceptedAnswers, audioUrl) never leak
- Hidden prompt tasks do not expose promptText
- Visible text tasks correctly show promptText
- hasPromptAudio matches contract

## Progress status verification

Progress status types are defined in `QuestionProgressStatus`:
- `not_started`, `in_progress`, `submitted`, `completed`, `failed`

The progress status contract is validated in workflow tests. Full implementation of progress join (reading attempt data per question per user) requires additional query work.

## Fake-test removal/gate

`scripts/checks/no-fake-practice-workflow-tests.mjs` scans test files for:
- Direct `PracticeAttempt` status updates to `Completed`
- Direct `PracticeSubmission.score` assignment (fake grading)
- `simulate success` / `manual status` / `fake terminal` patterns
- `pending_deterministic` as expected status (old Phase 3 pattern)

## PTE production readiness gate

`scripts/checks/pte-production-readiness-gate.mjs` runs all Phase 1–8 checks:

1. Task contract parity (Phase 1)
2. No Pending_Deterministic terminal (Phase 3)
3. No unsafe publish (Phase 6)
4. Hidden content boundary (Phase 4)
5. Playback limit (Phase 4)
6. Question bank pagination (Phase 7)
7. No first-question-only (Phase 7)
8. No fake workflow tests (Phase 8)
9. All 22 task start smoke (Phase 8)

## Remaining limitations

- Full audio/speaking/AI workflows require external infrastructure (STT, DeepSeek) and cannot run in isolated test environments.
- The `practice-behavioural-tests.mjs` still contains old patterns but is no longer part of the production-readiness gate.
- Progress status per question requires DB join query work to be fully functional from the API.
- Playwright E2E tests require a running server with seeded data.
- Final CI must run against main before production release.
