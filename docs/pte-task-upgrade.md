# PTE UI — Production Readiness Overhaul

## 1. Executive Status

| Metric | Value |
|---|---|
| Current readiness score | 10/10 (Phase 8 completed) |
| Accepted phases | Phase 1–8 |
| Remaining phase | Phase 10 — final main-branch release gate |
| Stacked PR chain | Active — not merged to main until Phase 10 |
| Final CI | Must run against `main` after Phase 10 merge |

This document documents the production readiness overhaul after Phases 1–8. All tests, gates, and workflows have been implemented and verified. The remaining work is the final merge to main with CI checks.

---

## 2. Architecture Summary

### Canonical Task Contracts (Phase 1–2)

Each of the 22 PTE task types has a canonical contract (`CanonicalTaskContract`) that defines:

- `questionSchema` / `responseSchema` — Zod schemas for question and response validation
- `timing` — prep and response seconds
- `media` — requires prompt audio, response recording, image
- `playbackPolicy` — autoplay, maxPlays, allowPause/Seek, revealTranscript
- `scoringMode` — `deterministic`, `ai_text`, `ai_speech`, `acoustic`
- `responseMode` — `audio`, `text`, `structured`
- `transcription` — whether transcription is required

### Renderer-Only Frontend Modules (Phase 2)

Each task module (`src/practice/tasks/{CODE}/`) contains only:

- `Renderer.tsx` — the React component for the task
- `createInitialResponse()` — default empty response
- `normalizeResponse()` — response normalizer

All policy decisions (timing, scoring, media, playback) come from the canonical contract, not the task module.

### Server-Authoritative Attempts (Phase 2–3)

Attempts are created and managed server-side:

- `POST /practice/attempts/start` — creates attempt with deadlineAt
- Timer phases driven by `deadlineAt` (server-authoritative)
- `useTaskTimer` FSM: `preparing → recording/answering → completed`
- Timer recomputes from `Date.now()` on each tick, visibilitychange, and focus

### Controlled Prompt Playback (Phase 4)

Prompt audio is never exposed in question list or attempt-start. Students must call `POST /practice/attempts/:id/play-prompt` to get a controlled audio URL. Server enforces playback count atomically.

### Student-Safe Question Boundary (Phase 4)

`buildStudentSafeQuestion()` produces a payload that excludes:

- `answerKeyJson`
- `acceptedAnswers` / `aliases`
- raw `audioUrl`
- hidden prompt transcript
- scoring metadata

### Deterministic Scoring Engine (Phase 3)

13 deterministic task types are scored by a local scorer engine:

- `src/practice/scoring/*.ts` — per-task scorers
- `scorerVersion: 'deterministic-pte-v1'`
- Results persisted with `scorerVersion`, `breakdown`, `maxScore`, `earnedScore`, `normalizedScore`

### Shared API Contracts (Phase 5)

All practice endpoints use a standard response shape:

- Success: `{ success: true, data: { ... } }`
- Error: `{ success: false, error: { code, message, details? } }`
- ApiError class with helpers (`badRequest`, `notFound`, `forbidden`, `internal`)
- Frontend `apiFetch` unwraps `data` on success, throws typed errors on failure

### CMS Publish Validation (Phase 6)

`validatePublishableQuestion()` blocks publishing unscorable questions:

- Task-specific answer-key schemas
- Required audio/image assets enforced
- Hidden prompt leakage blocked
- Structured issues returned to admin

### Question Bank Pagination (Phase 7)

`GET /api/student/questions` supports:

- `taskCode`, `section`, `difficulty`, `search` filters
- `page` and `pageSize` (max 100)
- `random` mode
- Published-only filtering

### Real Workflow Gates (Phase 8)

All 10 required production workflows are proven through real API paths with fake STT/AI providers in test mode.

---

## 3. 22-Task Matrix

| Task | Section | Response Mode | Scoring Mode | Prompt Audio | Response Recording | Hidden Prompt | Scorer/Test Status |
|---|---|---|---|---|---|---|---|
| RA | Speaking | audio | ai_speech | No | Yes | No | ✅ AI speech (fake verified) |
| RS | Speaking | audio | ai_speech | Yes | Yes | Yes | ✅ AI speech (fake verified) |
| DI | Speaking | audio | ai_speech | No | Yes | No | ✅ AI speech |
| RL | Speaking | audio | ai_speech | Yes | Yes | Yes | ✅ AI speech |
| ASQ | Speaking | audio | deterministic | Yes | Yes | Yes | ✅ Deterministic (score=1) |
| SGD | Speaking | audio | ai_speech | Yes | Yes | Yes | ✅ AI speech (fake verified) |
| RTS | Speaking | audio | ai_speech | No | Yes | No | ✅ AI speech |
| SWT | Writing | text | ai_text | No | No | No | ✅ AI text (fake verified) |
| WE | Writing | text | ai_text | No | No | No | ✅ AI text (fake verified) |
| MCS | Reading | structured | deterministic | No | No | No | ✅ Deterministic (tested) |
| MCM | Reading | structured | deterministic | No | No | No | ✅ Deterministic (tested) |
| ROP | Reading | structured | deterministic | No | No | No | ✅ Deterministic (tested) |
| FIBR | Reading | structured | deterministic | No | No | No | ✅ Deterministic (tested) |
| FIBRW | Reading | structured | deterministic | No | No | No | ✅ Deterministic (tested) |
| SST | Listening | text | ai_text | Yes | No | Yes | ✅ AI text (fake verified) |
| FIBL | Listening | structured | deterministic | Yes | No | Yes | ✅ Deterministic |
| HCS | Listening | structured | deterministic | Yes | No | Yes | ✅ Deterministic |
| MCSSL | Listening | structured | deterministic | Yes | No | Yes | ✅ Deterministic |
| MCMSL | Listening | structured | deterministic | Yes | No | Yes | ✅ Deterministic |
| SMW | Listening | structured | deterministic | Yes | No | Yes | ✅ Deterministic |
| HIW | Listening | structured | deterministic | Yes | No | Yes | ✅ Deterministic (tested) |
| WFD | Listening | text | deterministic | Yes | No | Yes | ✅ Deterministic (score=6/6) |

---

## 4. Deterministic Scoring Status

All 13 deterministic tasks are scored by `src/practice/scoring/`:

| Task | Scorer | Formula | scorerVersion |
|---|---|---|---|
| MCS | scoreMCS | 1 if correct, 0 if wrong | deterministic-pte-v1 |
| MCM | scoreMCM | correct - incorrect, clamped ≥0 | deterministic-pte-v1 |
| ROP | scoreROP | correct adjacent pairs | deterministic-pte-v1 |
| FIBR/FIBRW/FIBL | scoreFIBR/FIBRW/FIBL | per-blank exact match | deterministic-pte-v1 |
| HCS/MCSSL/SMW | scoreMCS (alias) | 1 if correct | deterministic-pte-v1 |
| MCMSL | scoreMCM (alias) | correct - incorrect | deterministic-pte-v1 |
| HIW | scoreHIW | correct - incorrect highlights | deterministic-pte-v1 |
| WFD | scoreWFD | position-based word match | deterministic-pte-v1 |
| ASQ | scoreASQ | transcript vs acceptedAnswers | deterministic-pte-v1 |

**Key properties:**

- scorerVersion: `deterministic-pte-v1`
- Results persisted via JSON in `feedback` field, parsed by result endpoint
- ASQ path: prompt audio → recorded answer → fake STT transcript → deterministic scorer → Completed
- No task remains stuck in `Pending_Deterministic` (transition to `Completed` or `Grading_Failed`)
- No `Math.random` used in any scorer

---

## 5. Media and Playback Boundary

- Prompt audio is not exposed in question list (`GET /api/student/questions`)
- Prompt audio is not exposed in attempt-start (`POST /practice/attempts/start`) question payload
- Student receives `hasPromptAudio: boolean` only
- Audio URL is returned only through `POST /practice/attempts/:id/play-prompt`
- Server atomically enforces playback count via `PracticePlaybackConsumption` table
- Second play for `maxPlays: 1` returns 403 `PROMPT_PLAYBACK_LIMIT_REACHED`
- Hidden transcript tasks (RS, RL, ASQ, SGD, SST, WFD, etc.) never expose the transcript
- Local/dev mode: play-prompt returns raw stored URL (not signed)

---

## 6. Student-Safe Question Boundary

`buildStudentSafeQuestion()` blocks these fields from reaching student-facing APIs:

| Field | Status |
|---|---|
| answerKeyJson | ❌ Blocked |
| acceptedAnswers | ❌ Blocked |
| aliases | ❌ Blocked |
| hidden prompt transcript | ❌ Blocked |
| raw prompt audio URL | ❌ Blocked |
| scoring metadata | ❌ Blocked |
| internal storage keys | ❌ Blocked |

**Visible exceptions:**

| Exception | Tasks |
|---|---|
| Passage text visible | RA |
| Image visible | DI |
| Written prompt visible | RA, DI, RTS, SWT, WE, MCS, MCM |
| Options visible | MCS, MCM, ROP, FIBR, FIBRW, HCS, MCSSL, MCMSL, SMW |
| Correct/hidden answers | Never exposed |

---

## 7. API Contract Status

**Standard response shape:**

```
Success: { success: true, data: { ... } }
Error:   { success: false, error: { code, message, details? } }
```

**Endpoint contracts:**

| Endpoint | Response data shape | Error samples |
|---|---|---|
| POST /practice/attempts/start | `{ attemptId, status, deadlineAt, timing, playbackPolicy, question }` | VALIDATION_ERROR (400), QUESTION_NOT_FOUND (404) |
| POST /practice/attempts/:id/play-prompt | `{ attemptId, playbackId, audioUrl, expiresAt, remainingPlays, playedCount, maxPlays }` | PROMPT_PLAYBACK_LIMIT_REACHED (403) |
| POST /practice/attempts/:id/audio-upload | `{ attemptId, responseAudioId, status }` | RESPONSE_AUDIO_REQUIRED (400) |
| POST /practice/attempts/:id/submit | `{ attemptId, submissionId, status, nextAction }` | INVALID_RESPONSE (400), ATTEMPT_EXPIRED (400) |
| GET /practice/attempts/:id/result | `{ attemptId, status, result: { score, maxScore, ... }|null }` | ATTEMPT_NOT_FOUND_OR_FORBIDDEN (404) |

**Deterministic result includes:**
- `scorerVersion`: e.g. `"deterministic-pte-v1"`
- `breakdown`: e.g. `{ isCorrect: true, transcript: "photosynthesis", ... }`
- `maxScore`, `earnedScore`, `normalizedScore`

**Error codes are stable and map correctly:**
- Expected validation errors → 400/403/404 (never 500)

---

## 8. CMS Publish Validation

- `validatePublishableQuestion()` validates before any question transitions to `published`
- Task-specific answer-key schemas via `getAnswerKeySchema(taskCode)`
- Required audio (`requiresPromptAudio`) and image (`requiresImage`) enforced
- Hidden prompt leakage blocked (`HIDDEN_PROMPT_EXPOSED`)
- AI-generated candidates must pass validation before publish
- Admin publish failure returns `{ error: { code: "QUESTION_NOT_PUBLISHABLE", details: { issues: [...] } } }`

**Remaining limitation:** Admin validation panel shows inline error messages; dedicated validation panel with field-level highlighting is not yet implemented.

---

## 9. Question Bank Navigation

`GET /api/student/questions` supports:

| Parameter | Type | Default | Max |
|---|---|---|---|
| taskCode | string | — | — |
| section | string | — | — |
| difficulty | string | — | — |
| search | string | — | — |
| page | int | 1 | — |
| pageSize | int | 20 | 100 |
| random | string | — | — |

Additional features:

- `GET /api/student/questions/counts` — published question counts per taskCode
- Frontend separates task selection (sidebar) from question selection (numbered buttons)
- `questionIndex` state, not `items[0]`
- Pagination controls (prev/next page)
- Next/Previous question and task buttons
- Empty state: "No published questions available for this task yet."
- Demo fallback only when `total === 0`, with clear warning label

**Remaining limitations:**
- Progress per question (not_started/in_progress/completed/failed) requires richer attempt joins
- Random mode uses JS `Math.random()` — no stable session seed
- Search uses `contains` — may need index optimization at scale

---

## 10. Real Workflow Testing

Phase 8 provides comprehensive real-path workflow coverage:

| Workflow | Status | Notes |
|---|---|---|
| RA | ✅ PASS | Visible passage → upload audio → fake STT → fake AI → Completed (score=75) |
| RS | ✅ PASS | Hidden transcript → play prompt (2 succeeds, 3rd rejected) → audio → Completed (78) |
| ASQ | ✅ PASS | Hidden prompt → play → upload → fake STT returns "photosynthesis" → deterministic → Completed (score=1, scorerVersion=deterministic-pte-v1) |
| SGD | ✅ PASS | Hidden prompt → play → audio → fake STT → fake AI → Completed (74) |
| WFD | ✅ PASS | Play → submit typed text → deterministic → Completed (6/6) |
| HIW | ✅ PASS | Submit highlights → deterministic → Completed |
| MCM | ✅ PASS | Submit `selectedMultiple: [A,B]` with `correct={A,C}` → score=1-1=0 → Completed |
| SWT | ✅ PASS | Submit text → fake AI → Completed (73) |
| WE | ✅ PASS | Submit essay → fake AI → Completed (70) |
| SST | ✅ PASS | Hidden audio → play → submit text → fake AI → Completed (71) |

**Test infrastructure:**
- `PTE_TEST_MODE=1` / `STT_PROVIDER=fake` — `FakeTranscriber` returns task-specific transcripts
- `PTE_TEST_MODE=1` / `AI_PROVIDER=fake` — `evaluateSubmission` returns deterministic scores for AI tasks
- Audio fixture: `tests/fixtures/audio/sample.wav` (8044 bytes valid WAV)
- No direct DB terminal-status writes
- All tests use real HTTP API calls through an in-process Express server

---

## 11. Verification Matrix

| Gate | Command | Status |
|---|---|---|
| TypeScript check | `npx tsc --noEmit` | ✅ |
| Build | `bun run build` | ✅ |
| Deterministic scorer tests | `bun test tests/scoring/deterministic-scorers.test.ts` | ✅ |
| Student-safe question tests | `bun test tests/contracts/student-safe-question.test.ts` | ✅ |
| Publish validation tests | `bun test tests/contracts/publish-validation.test.ts` | ✅ |
| API contract tests | `bun test tests/api/practice-api-contract.test.ts` | ✅ |
| Hidden-content smoke | `bun run scripts/smoke/hidden-content-boundary-smoke.mjs` | ✅ |
| Playback-limit smoke | `bun run scripts/smoke/playback-limit-smoke.mjs` | ✅ |
| Question-bank pagination smoke | `bun run scripts/smoke/question-bank-pagination-smoke.mjs` | ✅ |
| All 22 task start smoke | `bun run scripts/smoke/all-22-task-start-smoke.mjs` | ✅ |
| Real workflow integration | `bun run scripts/integration/practice-real-workflow-tests.mjs` | ✅ |
| No Pending_Deterministic terminal gate | `node scripts/checks/no-pending-deterministic-terminal.mjs` | ✅ |
| No unsafe publish gate | `node scripts/checks/no-unsafe-question-publish.mjs` | ✅ |
| No first-question-only gate | `node scripts/checks/no-first-question-only.mjs` | ✅ |
| No fake workflow gate | `node scripts/checks/no-fake-practice-workflow-tests.mjs` | ✅ |
| No skipped workflow gate | `node scripts/checks/no-skipped-required-pte-workflows.mjs` | ✅ |
| No false ASQ pass gate | `node scripts/checks/no-false-asq-workflow-pass.mjs` | ✅ |
| Production readiness gate | `bun run scripts/checks/pte-production-readiness-gate.mjs` | ✅ 12/12 |

---

## 12. Remaining Risks

1. **Stacked PRs still need final main-branch CI.** The current chain (Phase 1–9) is stacked on `fix/pte-production-phase-X-*` branches. No branch has been flattened or merged to `main`. Final CI against `main` is required in Phase 10.

2. **Fake AI/STT verifies routing, not real external scoring quality.** The fake providers return deterministic scores/routing but do not test real OpenAI Whisper or DeepSeek API calls. Production integration testing with real API keys is needed.

3. **Local/dev play-prompt returns raw stored URL.** The play-prompt endpoint returns the stored `audioUrl` directly. Production should return a short-lived signed URL from object storage.

4. **Final production deploy needs migration and health checks.** The SQLite database schema may need migration steps or indexes before handling production load.

5. **DB search/index performance.** The question list search uses `contains` which may be slow on large datasets without proper indexes. Consider adding indexes for common query patterns.

---

## 13. Phase 10 — Final Release Gate

Phase 10 must:

1. Flatten or merge stacked branches in order (Phase 1 → Phase 2 → ... → Phase 9)
2. Resolve any merge conflicts
3. Run full CI against `main`
4. Run migration-safe deployment checks
5. Run production smoke tests
6. Verify VPS health
7. Update final production readiness score
