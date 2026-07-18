# PTE UI — Production Readiness Overhaul
## Phase 1–4 Technical Explanation

> **Branch:** `feat/pte-task-upgrade`
> **Audit baseline:** Score 28/100 (commercial-production grade). See [implementation-plan.md](./implementation-plan.md) for the complete 7-phase roadmap.

---

## Why This Overhaul Exists

The PTE UI application shipped with a single generic `PracticeEngine` component that attempted to handle all 22 PTE Academic task types from a single 1,234-line React component. This approach introduced seven production-blocking defects:

1. **Random heuristic scoring** — the fallback grader invented scores using `Math.random()` when the AI provider was unavailable. Students received fabricated results indistinguishable from real AI evaluation.
2. **Double-grading** — two simultaneous code paths (background job + synchronous API endpoint) could score the same submission twice with conflicting results.
3. **Listening transcript leakage** — the full audio transcript (e.g. the WFD sentence to dictate, the SST lecture text) was rendered in the UI before the student clicked Play.
4. **Simulated audio** — audio playback used a fake `setInterval` progress timer rather than a real `<audio>` element. No actual audio played.
5. **Unlimited replays** — single-play tasks (WFD, HIW, MCSSL, etc.) allowed unlimited replays, violating PTE exam conditions.
6. **State not resetting on question switch** — timers, recording state, audio progress, and `submitError` persisted across question navigation.
7. **Search not filtering question buttons** — the micro-search input computed `filteredCodeItems` but the Q1/Q2/Q3 buttons continued to iterate over the unfiltered `codeItems`.

Additionally, a **schema–code mismatch** existed: `worker.ts` referenced four Prisma models (`MockQuestionResult`, `AudioMetadata`, `MockQuestionSession`, `PlaybackConsumption`) and nine `BackgroundJob` fields that did not exist in `schema.prisma`. The entire mock-test grading path was crashing at runtime.

Phases 1–4 address these defects in dependency order, building toward a fully contract-driven, deterministically-scored platform.

---

## Phase 1 — Stop False Functionality

**Goal:** Surgically remove every feature that creates false confidence in students without adding any new capability.

### 1a — Remove Random Fallback Scoring

**File:** `src/server/aiService.ts`

The old `getLocalFallbackGrading()` function computed:

```ts
// REMOVED — never do this
const base = 55 + Math.round(wordCount * 0.5);
return Math.min(90, Math.max(10, base + (Math.random() * 16 - 8)));
```

This was replaced with a **`ScoringResult` discriminated union**:

```ts
type ScoringResult =
  | { status: 'scored'; score: number; fluencyScore?: number; ... }
  | { status: 'provider_unavailable'; reason: string }
  | { status: 'empty_response'; reason: string }
  | { status: 'pending_deterministic'; reason: string };
```

When the DeepSeek API is unreachable, `evaluateSubmission()` now returns `{ status: 'provider_unavailable', reason: '...' }`. The worker catches this, marks the submission `scoring_failed`, and throws — triggering the job retry framework. The student sees honest feedback: "AI scoring provider is not configured. Your submission will be retried."

Objective tasks (MCS, MCM, ROP, FIBR, FIBRW, FIBL, HCS, MCSSL, MCMSL, SMW, HIW, WFD, ASQ) return `pending_deterministic` immediately and are never sent to the AI grader. Their correct answers are deterministic and will be scored by the Phase 4 engine.

### 1b — Block Invalid Submissions

**File:** `src/server/student.ts` — `validateSubmissionPayload()`

A server-side guard rejects submissions before they reach the database:

| Task category | Rejection condition |
|---|---|
| Speaking (RA, RS, DI, RL, ASQ, SGD, RTS) | `answerText === '[Speaking audio recorded for practice]'` or no `audioMetadataId` |
| Objective (MCS, MCM, ROP, FIBR, FIBRW, FIBL, etc.) | `answerJson` is missing or all selections are null |
| Writing (SWT, WE, SST) | Fewer than 5 words in `answerText` |

This ensures no garbage data enters the `PracticeSubmission` table or the grading queue.

### 1c — Fix Double-Grading

**Files:** `src/server/student.ts`, `src/server/jobs/worker.ts`

The synchronous `POST /practice/:id/score` endpoint was removed entirely. It was being called immediately after `POST /practice/submit` in the frontend, causing the same submission to be graded twice — once inline (bypassing the job queue) and once by the background worker.

The single grading path is now:

```
POST /practice/submit
  → creates PracticeSubmission (status: pending)
  → queueJob('grade_submission', { submissionId })
  → returns submission immediately

GET /practice/:id/status   ← new read-only polling endpoint
  → returns current submission state
  → frontend polls this to detect when grading completes
```

The worker also checks `sub.status === 'graded'` before scoring — any duplicate job messages are silently skipped.

### 1d — Fix Listening Transcript Exposure

**File:** `src/components/PracticeEngine.tsx`

Added `PROMPT_HIDDEN_TASKS`:

```ts
const PROMPT_HIDDEN_TASKS = new Set<PTETaskCode>([
  'RS', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD'
]);
```

For these tasks, `activeItem.promptText` is the audio content itself (the sentence to dictate, the lecture transcript, the passage). Showing it before playback defeats the entire purpose of the task. The render condition changed from:

```tsx
// BEFORE — only hid RS
{activeItem.promptText && activeCode !== 'RS' && ( ... )}

// AFTER — hides all transcript tasks
{activeItem.promptText && !PROMPT_HIDDEN_TASKS.has(activeCode) && ( ... )}
```

### 1e — Real Audio + One-Play Enforcement

**File:** `src/components/PracticeEngine.tsx`

The fake audio playback was replaced with a real `<audio>` element. A `promptAudioRef` holds the HTML audio element and fires real `onTimeUpdate` events to update the progress bar:

```tsx
<audio
  ref={promptAudioRef}
  src={activeItem.audioUrl}
  className="hidden"
  onTimeUpdate={(e) => setAudioPlaybackProgress(
    (e.currentTarget.currentTime / e.currentTarget.duration) * 100
  )}
  onEnded={() => { setIsAudioPlaying(false); setAudioPlaybackProgress(100); }}
/>
```

`ONE_PLAY_TASKS` defines which task types enforce a single playthrough. After first play, the button is disabled and shows a "PLAYED — 1 PLAY ONLY" badge matching real exam conditions.

### 1f — State Reset on Question Switch

**File:** `src/components/PracticeEngine.tsx`

Previously, switching questions left the old prep timer, answer timer, recording state, and `submitError` in place. The `useEffect` on `activeItem.id` now resets all mutable state:

- Prep and answer timers reset to the task-correct values from `PTE_TASK_TYPES`
- `audioPlayed` and `audioPlaybackProgress` reset to `false` / `0`
- Any in-progress `MediaRecorder` is stopped via `stopRecording()`
- `submitError` is cleared

### 1g — Search Filters Question Buttons

**File:** `src/components/PracticeEngine.tsx`

`filteredCodeItems` was computed correctly but never used for the Q1/Q2/Q3 buttons — they always mapped over the full `codeItems`. Fixed by switching the button list to iterate `filteredCodeItems` and resolving the index back through `codeItems.indexOf(item)` to keep `selectedQuestionIndex` consistent.

### 1h — Correct Task Timings

**File:** `src/data/mockData.ts`

| Task | Field | Before | After | Source |
|------|-------|--------|-------|--------|
| SGD | `attemptTime` | 40s | **120s** | Pearson PTE Academic spec |
| RTS | `prepTime` | 20s | **10s** | Pearson PTE Academic spec |

### 1i — WFD Prompt Hidden

**File:** `src/components/PracticeEngine.tsx`

WFD (Write from Dictation) is included in `PROMPT_HIDDEN_TASKS`. The sentence to dictate is stored in `promptText` and must never be displayed — students must transcribe it from audio. Full seed data remediation (moving the sentence to `answerKeyJson` only) is deferred to Phase 5.

### Admin — Publish Validation Gate

**File:** `src/server/admin.ts` — `validateForPublish()`

Before any question can be set to `status: published` via `PATCH /admin/question-bank/:id/status`, a completeness check runs:

- Audio tasks require `audioUrl`
- DI requires `imageUrl`
- All objective tasks require `answerKeyJson`
- MCQ tasks require `optionsJson` with ≥ 2 options
- ROP requires `correctOrder[]` in the answer key
- HIW requires `incorrectTokenPositions[]` in the answer key

This prevents partially-authored questions from reaching students.

---

## Phase 2 — Task Contracts

> **Status:** Planned — ready to execute after Phase 1 review.

### Problem

The single `PracticeEngine` component (~1,234 lines) uses a cascade of `if/else` branches to detect task type at render time. Each task's renderer, timing policy, response validator, and scoring contract are interleaved in one file. Adding a new task or fixing a bug in one task requires editing this entire component and risks regressing other tasks.

### Approach

Each of the 22 PTE task types gets its own **task module** — a self-contained directory:

```
src/practice/tasks/
  RA/
    schema.ts       ← Zod schema for valid RA responses
    Renderer.tsx    ← UI component for RA practice
    index.ts        ← exports TaskModule<RAConfig>
  RS/
    ...
  (×22)
  types.ts          ← TaskModule<T> interface
  registry.ts       ← Map<PTETaskCode, TaskModule>
```

The `TaskModule` interface:

```ts
interface TaskModule<TResponse = unknown> {
  code: PTETaskCode;
  section: 'Speaking' | 'Writing' | 'Reading' | 'Listening';
  timingPolicy: TimingPolicy;           // prepTime, attemptTime, onePlay
  responseSchema: z.ZodType<TResponse>; // Zod — validated before submit
  validateResponse: (r: TResponse) => ValidationResult;
  Renderer: React.FC<RendererProps<TResponse>>;
}
```

`PracticeEngine.tsx` becomes a **thin shell** — it handles routing, CMS loading, timer orchestration, and submission — but delegates all rendering and validation to `registry.get(activeCode)`.

### What this enables

- Each task module is independently testable (Phase 7 contract tests)
- Adding a new task = adding one directory, not editing a 1,200-line file
- Publishing validation in `admin.ts` can import the task module's schema to verify `optionsJson`, `answerKeyJson`, and `audioUrl` requirements per task

---

## Phase 3 — Production Media Pipeline

> **Status:** Planned.

### Problem

- Speaking tasks (RA, RS, DI, RL, ASQ, SGD, RTS) record audio into an in-memory `Blob` URL (`URL.createObjectURL`). This blob is never uploaded anywhere — the `audioUrl` field in the submission is always `null`.
- Listening tasks (SST, RL, FIBL, HCS, etc.) reference `activeItem.audioUrl` — a string from mock data. No real audio content exists.
- Without a real audio file, Speech-to-Text transcription is impossible, and speaking tasks cannot be scored.

### Approach

**Upload pipeline:**

```
1. Student records → MediaRecorder → chunks[]
2. On stop: Blob assembled → POST /api/practice/audio-upload (multipart)
3. Server: validates MIME type (audio/webm, audio/mp4, audio/ogg)
         → uploads to object storage (S3/R2/GCS)
         → creates AudioMetadata row
         → returns { audioMetadataId, objectKey }
4. Frontend: includes audioMetadataId in submission payload
5. Worker: grade_submission job fetches objectKey → downloads → sends to STT
```

**One-play enforcement for prompt audio:**

```
POST /api/practice/play-prompt
  body: { attemptId, questionId }
  → checks PlaybackConsumption row
  → if playedCount >= 1 and task is in ONE_PLAY_TASKS: 403 Forbidden
  → else: increments playedCount, returns signed CDN URL (30-second TTL)
```

This means the UI never has direct access to the raw audio URL — it must request a time-limited signed URL each time, and the server enforces the play limit.

**STT integration:**

The `grade_submission` worker step calls `getTranscriber()` (an abstraction in `src/server/stt.ts`) which supports Whisper API, Google Cloud Speech, or AssemblyAI depending on the `STT_PROVIDER` environment variable. The transcript is stored in `AudioMetadata.transcript` and passed to `evaluateSubmission()` as `answerText`.

---

## Phase 4 — Deterministic Scoring

> **Status:** Planned.

### Problem

Objective tasks (13 of the 22 task types) have definitive correct answers. Sending them to an AI language model introduces:
- **Cost:** unnecessary API calls
- **Latency:** 2–10 second round trips
- **Non-determinism:** the same correct answer may score differently across calls
- **Inaccuracy:** an LLM may hallucinate a justification for marking a correct answer wrong

### Approach

A `taskScorers/` dispatcher replaces AI grading for all 13 objective task types:

```
src/utils/taskScorers/
  index.ts   ← dispatch by taskCode
  MCS.ts     ← single correct answer → 0 or full credit
  MCM.ts     ← partial credit: correct−incorrect / total
  ROP.ts     ← Damerau–Levenshtein on order vs correctOrder
  FIBR.ts    ← exact or fuzzy match per blank, partial credit
  FIBRW.ts   ← same as FIBR
  FIBL.ts    ← same as FIBR
  HCS.ts     ← exact option match
  MCSSL.ts   ← exact option match
  MCMSL.ts   ← partial credit as MCM
  SMW.ts     ← match against summary keywords
  HIW.ts     ← correct token positions vs incorrectTokenPositions
  WFD.ts     ← word-level diff against reference sentence
  ASQ.ts     ← fuzzy keyword match
```

**Scoring formulas:**

| Task | Formula |
|------|---------|
| MCS, HCS, MCSSL | 1 if correct, 0 if wrong (no negative marking) |
| MCM, MCMSL | `max(0, correctChosen − incorrectChosen) / totalCorrect × maxCredit` |
| ROP | `(totalPairs − incorrectAdjacencies) / totalPairs × maxCredit` |
| FIBR, FIBRW, FIBL | `correctBlanks / totalBlanks × maxCredit` |
| WFD | `1 − (editDistance / referenceLength)`, clamped to [0, 1] |
| HIW | `correctHighlights / totalIncorrectWords` |
| ASQ | Keyword presence match (fuzzy, stopword-filtered) |

The `evaluateSubmission()` function already returns `{ status: 'pending_deterministic' }` for these tasks (Phase 1a). In Phase 4, the dispatcher intercepts before reaching `evaluateSubmission()` and scores immediately from `answerKeyJson`.

**Open-response tasks keep AI grading** (RA, RS, DI, RL, SGD, RTS via transcript; SWT, WE, SST via text) but receive task-specific rubric system prompts instead of the previous generic prompt.

---

## File Change Summary (Phase 1)

| File | Change type | Description |
|------|-------------|-------------|
| `src/server/aiService.ts` | **Rewrite** | Removed random fallback. Added ScoringResult union. Per-task rubric prompts. |
| `src/server/student.ts` | **Modified** | Added `validateSubmissionPayload()`. Removed sync score endpoint. Added `GET /practice/:id/status`. |
| `src/server/jobs/worker.ts` | **Modified** | Idempotency check. ScoringResult union handling. Provider-failure sets scoring_failed. |
| `src/server/admin.ts` | **Modified** | Added `validateForPublish()`. Hooked into `PATCH /question-bank/:id/status`. |
| `src/components/PracticeEngine.tsx` | **Modified** | PROMPT_HIDDEN_TASKS, ONE_PLAY_TASKS, real audio element, state reset, search fix. |
| `src/data/mockData.ts` | **Modified** | SGD 120s, RTS prep 10s. |

**TypeScript:** Zero errors after all Phase 1 changes (`npx tsc --noEmit` clean).
