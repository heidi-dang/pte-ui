# PTE UI — Production Readiness Overhaul

The application currently scores 28/100 for commercial production readiness.
The audit identified seven critical blockers, 22 blocked task interactions, and numerous shared frontend defects.
This plan addresses every blocker in the recommended sequence:
**task contracts → scoring contracts → media pipeline → CMS validation → content generation → release gate**.

---

## User Review Required

> [!CAUTION]
> **Scope decision required.** This plan is structured across seven phases. Each phase is a meaningful deliverable that can be shipped independently. Confirm whether you want all seven phases planned now, or whether you prefer to approve and execute one phase at a time before the next is planned.

> [!WARNING]
> **Schema–code mismatch (immediate crash risk).** `worker.ts` references `prisma.mockQuestionResult`, `prisma.audioMetadata`, `prisma.mockQuestionSession`, `prisma.playbackConsumption`, and extended `BackgroundJob` fields (`attempts`, `maxAttempts`, `workerId`, `claimToken`, `startedAt`, `heartbeatAt`, `leaseExpiresAt`) — **none of these exist in `schema.prisma`**. The entire mock-test grading path and the distributed job-claiming system currently throw Prisma runtime errors. Phase 1j resolves this before any other work.

> [!WARNING]
> **Database migration.** Phase 1 extends the Prisma schema. Because the project currently runs `prisma db push` in development and disables production seeding, any schema change will require a manual migration review. The plan proposes `prisma migrate dev` for all future changes and a one-time migration script to convert existing JSON blobs to normalized columns.

> [!IMPORTANT]
> **No AI scoring for objective tasks until Phase 4.** Phases 1–3 will leave objective tasks (MCS, MCM, ROP, FIBR, FIBRW, FIBL, HCS, MCSSL, MCMSL, SMW, HIW, WFD, ASQ) in a "pending" state until the deterministic scoring engines are implemented. This is the correct behaviour per the audit — random fallback scores will be removed.

---

## Open Questions

> [!IMPORTANT]
> **Speech-to-text provider.** Phase 3 requires a real STT service to transcribe speaking recordings. Supported options: OpenAI Whisper API, Google Cloud Speech-to-Text, AssemblyAI. Which provider should be integrated, or should the architecture stub out the interface first?

> [!IMPORTANT]
> **Object storage provider.** Audio files and images need durable object storage. Options: AWS S3, Cloudflare R2, Google Cloud Storage. Which provider should be used?

> [!IMPORTANT]
> **Production database.** The audit recommends PostgreSQL for production. Do you want the migration to PostgreSQL included in this plan (Phase 1 schema work), or should SQLite remain for development with a separate deployment-time PostgreSQL path?

> [!IMPORTANT]
> **Content factory.** Phase 5 requires generating and reviewing 2,200 questions (100 per task). Should the initial content generation use DeepSeek with human review, or is there an existing content source / import format (e.g., QTI XML, CSV) to integrate?

---

## Proposed Changes

### Phase 1 — Stop False Functionality

The highest priority. Removes all simulated scoring, hidden transcripts, and broken interactions that currently mislead users.

---

#### 1a. Remove Random Fallback Scoring

> [!CAUTION]
> Random scores must be removed before any other work. A failing provider must leave the submission in `pending`, not produce an invented score.

##### [MODIFY] [aiService.ts](file:///home/heidi/Desktop/pte-ui/src/server/aiService.ts)
- Remove `getLocalFallbackGrading()` entirely — delete the function and all call sites.
- When `DEEPSEEK_API_KEY` is absent **or** the API call fails, return a structured `{ status: 'provider_unavailable', score: null, feedback: null }` sentinel instead of a score.
- Add a `ScoringResult` discriminated union:
  ```ts
  type ScoringResult =
    | { status: 'scored'; score: number; feedback: string; ... }
    | { status: 'provider_unavailable' }
    | { status: 'empty_response' }
    | { status: 'pending_deterministic' }   // objective tasks
  ```

##### [MODIFY] [worker.ts](file:///home/heidi/Desktop/pte-ui/src/server/jobs/worker.ts)
- When scoring returns `provider_unavailable`, update submission status to `'scoring_failed'` and schedule an exponential-backoff retry job rather than writing a score.
- Add idempotency check: if submission already has `status = 'graded'`, skip re-scoring.

##### [MODIFY] [student.ts](file:///home/heidi/Desktop/pte-ui/src/server/student.ts)
- `POST /practice/:id/score` — if a submission is already graded, return the existing result (idempotent); do not call the AI engine again.
- Remove the synchronous score call that duplicates the background job.

---

#### 1b. Block Invalid and Incomplete Submissions

##### [MODIFY] [student.ts](file:///home/heidi/Desktop/pte-ui/src/server/student.ts)
- Add a server-side `validateSubmissionPayload(taskCode, body)` guard before creating a `PracticeSubmission`. Rules:
  - Speaking tasks (RA, RS, DI, RL, ASQ, SGD, RTS): reject if `audioMetadataId` is null (no audio upload).
  - Objective tasks (MCS, MCM, ROP, FIBR, FIBRW, FIBL, HCS, MCSSL, MCMSL, SMW, HIW, WFD): reject if `answerJson` is null or malformed.
  - Writing tasks (SWT, WE): reject if `answerText` is fewer than 5 words.
  - Never accept `answerText = "[Speaking audio recorded for practice]"`.

---

#### 1c. Fix Double-Grading

##### [MODIFY] [student.ts](file:///home/heidi/Desktop/pte-ui/src/server/student.ts) + [worker.ts](file:///home/heidi/Desktop/pte-ui/src/server/jobs/worker.ts)
- Add `idempotencyKey` to `PracticeSubmission` (migration required): `grade_practice:<submissionId>`.
- Background worker checks `idempotencyKey` before scoring; if already graded, marks job completed and exits.
- Remove the separate synchronous `POST /practice/:id/score` endpoint — scoring only happens via the background job queue.

---

#### 1d. Fix Listening Transcript Exposure

##### [MODIFY] [PracticeEngine.tsx](file:///home/heidi/Desktop/pte-ui/src/components/PracticeEngine.tsx)
- `promptText` must not be rendered for tasks: RL, ASQ, SGD, RTS, SST, MCMSL, FIBL, HCS, MCSSL, SMW, HIW, WFD.
- Add a `PROMPT_HIDDEN_TASKS` constant set and gate the prompt display behind it.

---

#### 1e. Fix Audio Replay (One-Play Enforcement)

##### [MODIFY] [PracticeEngine.tsx](file:///home/heidi/Desktop/pte-ui/src/components/PracticeEngine.tsx)
- Add per-question `audioPlayed: boolean` state.
- Disable the play button after first play for tasks that require one-play only: RS, RL, ASQ, SGD, RTS, SST, MCMSL, FIBL, HCS, MCSSL, SMW, HIW, WFD.
- Replace the fake progress timer with a real `<audio>` element whose `onplay`/`onended` events drive the UI state.

---

#### 1f. Fix Question Switching Not Resetting State

##### [MODIFY] [PracticeEngine.tsx](file:///home/heidi/Desktop/pte-ui/src/components/PracticeEngine.tsx)
- The `useEffect` that resets inputs on `activeItem.id` change must also reset:
  - Preparation timer
  - Answer timer
  - `audioPlayed` flag
  - Recorder lifecycle (stop and destroy `MediaRecorder` instance)
  - Recording status

---

#### 1g. Fix Search Disconnect

##### [MODIFY] [PracticeEngine.tsx](file:///home/heidi/Desktop/pte-ui/src/components/PracticeEngine.tsx)
- Replace the `codeItems` mapping with `filteredCodeItems` so the search input actually filters visible question buttons.

---

#### 1h. Fix SGD and RTS Timing

##### [MODIFY] [PracticeEngine.tsx](file:///home/heidi/Desktop/pte-ui/src/components/PracticeEngine.tsx)
- SGD: change prep time to 10 s, response time to 120 s (official: 2 min after 10 s prep).
- RTS: change prep time to 10 s (not 20 s).

---

#### 1i. Fix WFD Prompt Exposure

##### [MODIFY] [PracticeEngine.tsx](file:///home/heidi/Desktop/pte-ui/src/components/PracticeEngine.tsx) + [questionSeed.ts](file:///home/heidi/Desktop/pte-ui/src/server/questionSeed.ts)
- WFD: the full dictation sentence must never appear in `promptText`. The prompt field should contain only the instruction.
- Update seed data: move the sentence to `answerKeyJson` only.

---

#### 1j. Fix Schema–Code Mismatch (Emergency Schema Migration)

This is a prerequisite for Phase 1 fixes and all subsequent phases. The worker references models that do not exist.

##### [MODIFY] [schema.prisma](file:///home/heidi/Desktop/pte-ui/prisma/schema.prisma)
Add all missing models and fields that `worker.ts`, `student.ts`, and `admin.ts` already reference:

**Extended `BackgroundJob` fields:**
- `attempts Int @default(0)`
- `maxAttempts Int @default(3)`
- `workerId String?`
- `claimToken String?`
- `startedAt DateTime?`
- `heartbeatAt DateTime?`
- `leaseExpiresAt DateTime?`
- `idempotencyKey String? @unique`
- `deadLetterReason String?`

**New models:**
```prisma
model MockQuestionResult {
  id                  String   @id @default(cuid())
  attemptId           String
  attempt             TestAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionId          String
  questionVersion     Int      @default(1)
  questionIndex       Int
  taskType            String
  normalizedResponse  Json     @default("{}")
  scoringPolicyVersion String?
  status              String   @default("Pending")
  score               Float?
  feedback            String?
  audioMetadataId     String?
  audioPlaybackUrl    String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  @@unique([attemptId, questionId])
}

model MockQuestionSession {
  id            String   @id @default(cuid())
  attemptId     String
  attempt       TestAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionId    String
  questionIndex Int
  startedAt     DateTime
  deadlineAt    DateTime
  status        String   @default("In_Progress")
  submittedAt   DateTime?
  @@unique([attemptId, questionId])
}

model PlaybackConsumption {
  id            String   @id @default(cuid())
  attemptId     String
  questionId    String
  userId        String
  playedCount   Int      @default(0)
  firstPlayedAt DateTime?
  lastPlayedAt  DateTime?
  version       Int      @default(0)
  @@unique([attemptId, questionId])
}

model AudioMetadata {
  id            String   @id @default(cuid())
  objectKey     String   @unique
  mimeType      String
  fileSizeBytes Int
  durationMs    Int?
  sha256        String?
  transcript    String?
  speakerCount  Int?
  speakerLabels String?  // JSON
  createdAt     DateTime @default(now())
}
```

**Update `TestAttempt`** to add relations to new models:
- `questionResults MockQuestionResult[]`
- `questionSessions MockQuestionSession[]`
- `submittedAt DateTime?`
- `status` — extend allowed values to include `Pending_Grading`, `Grading`, `Graded`, `Grading_Failed`, `In_Progress`

**Migration command:** `npx prisma migrate dev --name add-missing-models`

---

### Phase 2 — Task Contracts

Replaces the monolithic generic component with 22 individual, validated task modules. Each module owns its renderer, timing policy, response validator, and scoring contract.

---

#### 2a. Task Module Interface

##### [NEW] src/practice/tasks/types.ts
```ts
export interface TaskModule {
  code: PTETaskCode;
  section: PTESection;
  timing: { prepSeconds: number; responseSeconds: number; onePlayAudio: boolean };
  validateQuestion(q: unknown): ValidatedQuestion;
  validateResponse(r: unknown): ValidatedResponse | ValidationError;
  scoringStrategy: 'deterministic' | 'speech' | 'open_response';
  requiredAssets: ('audio' | 'image')[];
}
```

##### [NEW] src/practice/tasks/registry.ts
- Barrel file that imports and exports all 22 task modules.
- `getTaskModule(code: PTETaskCode): TaskModule` — throws if code is unknown.

---

#### 2b. Task Renderer Components (22 files)

One renderer per task. Each lives at `src/practice/tasks/<code>/Renderer.tsx`.

| Task | Key rendering changes vs current generic component |
|------|---------------------------------------------------|
| RA | Highlight-as-you-speak word progress bar; no audio player |
| RS | Auto-play audio on load, one-play; no prompt text; recording after beep |
| DI | Show actual chart image from `imageUrl`; remove generic Unsplash placeholder |
| RL | Auto-play audio; note-taking textarea; no transcript exposure |
| ASQ | Auto-play audio; single short-text answer; no question text visible |
| SGD | Auto-play three-speaker audio; recording surface; no transcript |
| RTS | Auto-play audio; show written situation; 10 s prep; recording |
| SWT | Rich text editor; real-time word count enforcer (5–75); single-sentence validator; block submit if invalid |
| WE | Rich text editor; 200–300 word range shown; submit disabled outside range |
| MCS | Radio button selection; stores selected `optionIndex` in `answerJson` |
| MCM | Checkbox selection; stores `selectedIndices[]` in `answerJson` |
| ROP | Drag-and-drop paragraph reorder (using native HTML5 DnD or `@dnd-kit/core`); stores final order array |
| FIBR | Drag words from pool into blank slots (not `<select>`); stores `{ blankIndex, word }[]` |
| FIBRW | Dropdown per blank; stores per-blank selections; validates all blanks filled |
| SST | Auto-play audio; text editor; 50–70 word range enforced |
| MCMSL | Auto-play audio; checkbox selection; negative marking warning displayed |
| FIBL | Auto-play audio; type-in blanks (not dropdowns); stores typed words |
| HCS | Auto-play audio; radio selection of summary option |
| MCSSL | Auto-play audio; radio selection |
| SMW | Auto-play audio ending in beep; radio word selection |
| HIW | Auto-play audio; word-click highlight interface; stores token positions |
| WFD | Auto-play audio; blank text input; no prompt text; disable submit until audio played |

##### [NEW] src/practice/tasks/\*/Renderer.tsx (×22)
##### [MODIFY] [PracticeEngine.tsx](file:///home/heidi/Desktop/pte-ui/src/components/PracticeEngine.tsx)
- Become a thin shell: reads `taskCode`, calls `getTaskModule(taskCode)`, delegates rendering to `<TaskRenderer>`.
- Remove all task-specific `if/else` blocks from the generic component.

---

#### 2c. Task-Specific Question Validation

##### [NEW] src/practice/tasks/\*/schema.ts (×22)
- Zod schema per task validating required fields (e.g., `audioUrl` required for RS, `imageUrl` required for DI, `optionsJson` must be array with ≥2 items for MCM).

##### [MODIFY] [admin.ts](file:///home/heidi/Desktop/pte-ui/src/server/admin.ts)
- Publishing endpoint calls `validateForPublish(taskCode, question)` using the Zod schema before setting `status = 'published'`.
- Return specific validation errors (e.g., "RS requires audioUrl").

##### [MODIFY] [schema.prisma](file:///home/heidi/Desktop/pte-ui/prisma/schema.prisma)
- Add `schemaVersion String @default("1")` to `QuestionBankItem`.
- Add `reviewStatus String @default("pending")` — values: `pending | in_review | approved | rejected`.
- Add `contentHash String?` for duplicate detection.

---

### Phase 3 — Production Media Pipeline

Replaces simulated audio with real recordings, durable upload, and enforced one-play.

---

#### 3a. Audio Upload for Speaking Tasks

##### [MODIFY] [PracticeEngine.tsx](file:///home/heidi/Desktop/pte-ui/src/components/PracticeEngine.tsx) (speaking task renderers)
- After recording, upload the blob to `POST /api/student/practice/audio-upload`.
- Receive an `audioMetadataId` back; include it in the submission payload.
- Never submit with a placeholder text.

##### [MODIFY] [student.ts](file:///home/heidi/Desktop/pte-ui/src/server/student.ts)
- Add `POST /practice/audio-upload` multipart handler:
  - Validate MIME type (`audio/webm`, `audio/ogg`, `audio/mp4`).
  - Stream to configured object storage.
  - Create `AudioMetadata` record (key, MIME, size, checksum).
  - Return `{ audioMetadataId }`.

##### [MODIFY] [schema.prisma](file:///home/heidi/Desktop/pte-ui/prisma/schema.prisma)
- Add standalone `AudioMetadata` model (already partially referenced in worker):
  ```
  model AudioMetadata {
    id          String   @id @default(cuid())
    objectKey   String   @unique
    mimeType    String
    fileSizeBytes Int
    durationMs  Int?
    sha256      String?
    transcript  String?
    createdAt   DateTime @default(now())
  }
  ```
- Add `audioMetadataId String?` to `PracticeSubmission`.

---

#### 3b. Speech-to-Text Transcription

##### [MODIFY] [worker.ts](file:///home/heidi/Desktop/pte-ui/src/server/jobs/worker.ts)
- New job type `transcribe_audio`:
  - Fetch audio object from storage.
  - Send to configured STT provider (Whisper / Google / AssemblyAI).
  - Save transcript to `AudioMetadata.transcript`.
  - Queue `grade_practice` job with `audioMetadataId`.

##### [NEW] src/server/stt.ts (or extend existing stub)
- `transcribeAudio(objectKey: string): Promise<string>` — provider-agnostic interface.
- Configurable via `STT_PROVIDER` env var.

---

#### 3c. Playback Control for Listening Tasks

##### [MODIFY] [student.ts](file:///home/heidi/Desktop/pte-ui/src/server/student.ts)
- For practice (not just mock tests): add `POST /practice/play-prompt` with the same atomic playback-consumption logic already implemented for mock tests.
- Return a signed URL (time-limited) to the audio object.
- Do not return a static `audioUrl` from the question; the client must call this endpoint to receive a playable URL.

##### [MODIFY] [schema.prisma](file:///home/heidi/Desktop/pte-ui/prisma/schema.prisma)
- Add `PracticePlaybackConsumption` model mirroring `PlaybackConsumption`.

---

### Phase 4 — Deterministic Scoring

Implements task-specific answer-key scoring engines. No AI for objective tasks.

---

#### 4a. Scoring Registry

##### [NEW] src/utils/taskScorers/index.ts
- `scoreTask(taskCode, response, answerKey): ScoringResult` — dispatches to the correct scorer.

##### [NEW] src/utils/taskScorers/\*.ts — one file per objective task:

| File | Logic |
|------|-------|
| `mcs.ts` | `selectedOptionIndex === correctIndex ? maxScore : 0` |
| `mcm.ts` | `+1 per correct selection, -1 per incorrect selection, min 0` |
| `rop.ts` | Count correct adjacent pairs, partial credit per pair |
| `fibr.ts` | +1 per blank where dragged word matches answer key |
| `fibrw.ts` | +1 per blank where selected option matches answer key |
| `fibl.ts` | +1 per blank where typed word matches (case-insensitive, trimmed) |
| `hcs.ts` | Exact match on selected summary option |
| `mcssl.ts` | Exact option match |
| `mcmsl.ts` | Same as MCM with negative marking |
| `smw.ts` | Exact word match |
| `hiw.ts` | +1 per correct token position selected, -1 per incorrect, min 0 |
| `wfd.ts` | Per-word correct/incorrect comparison against transcript, sequence-weighted |
| `asq.ts` | Normalized exact match + approved alias list |

##### [NEW] src/utils/taskScorers/scoringVersion.ts
- `SCORING_SCHEMA_VERSION = "v1"` — version-stamp every score record.

---

#### 4b. Connect Scorers to the Worker

##### [MODIFY] [worker.ts](file:///home/heidi/Desktop/pte-ui/src/server/jobs/worker.ts)
- `grade_practice` job handler:
  1. Load submission + its `QuestionBankItem`.
  2. If `taskScorers[taskCode]` exists → deterministic score.
  3. Else if speaking task + transcript available → send to AI speech rubric.
  4. Else if open-response task → send to AI writing rubric.
  5. Store result with `scoringPolicyVersion`, `scoredBy` (`deterministic | ai`), `scoredAt`.
  6. Never overwrite an existing graded result.

##### [MODIFY] [schema.prisma](file:///home/heidi/Desktop/pte-ui/prisma/schema.prisma)
- Add to `PracticeSubmission`:
  - `scoringPolicyVersion String?`
  - `scoredBy String?` — `"deterministic" | "ai" | "human"`
  - `scoredAt DateTime?`
  - `scoringProviderResponse String?` — raw JSON from AI

---

#### 4c. Open-Response AI Rubrics (Per Task)

##### [MODIFY] [aiService.ts](file:///home/heidi/Desktop/pte-ui/src/server/aiService.ts)
- Replace the single generic `evaluateSubmission()` with task-specific rubric functions:
  - `evaluateRA(transcript, promptText)` — content, pronunciation, oral fluency
  - `evaluateDI(transcript, imageDescription)` — content coverage, structure
  - `evaluateRL(transcript, lectureTranscript)` — content accuracy, retell coherence
  - `evaluateSWT(text, sourcePassage)` — 5–75 words, single sentence, content
  - `evaluateWE(text, topic)` — form, development, grammar, vocab, spelling
  - `evaluateSST(text, lectureTranscript)` — 50–70 words, content accuracy
  - `evaluateSGD(transcript)` — participation, content, register
  - `evaluateRTS(transcript, situation)` — appropriacy, register, prompt detail
- Each function includes the answer key / source material in the prompt, not just the student answer.

---

### Phase 5 — CMS Validation and Content Factory

Enforces data integrity and builds the 2,200-question bank.

---

#### 5a. Enhanced Question Schema

##### [MODIFY] [schema.prisma](file:///home/heidi/Desktop/pte-ui/prisma/schema.prisma)
Extended `QuestionBankItem`:
- `schemaVersion String @default("1")`
- `questionVersion Int @default(1)`
- `reviewStatus String @default("pending")`
- `topic String?`
- `subtopic String?`
- `contentHash String?`
- `sourceType String @default("original")` — `original | ai_generated | imported`
- `reviewedByUserId String?`
- `approvedByUserId String?`
- `publishedAt DateTime?`
- `retiredAt DateTime?`
- `exposureCount Int @default(0)`
- `attemptCount Int @default(0)`
- `avgScore Float?`

##### [NEW] Media review table:
```prisma
model MediaAsset {
  id                  String   @id @default(cuid())
  questionBankItemId  String
  question            QuestionBankItem @relation(...)
  type                String   // "audio" | "image"
  objectKey           String   @unique
  mimeType            String
  fileSizeBytes       Int
  durationMs          Int?
  sha256              String?
  transcript          String?
  speakerCount        Int?
  speakerLabels       String?  // JSON
  playbackLimit       Int      @default(1)
  imageWidth          Int?
  imageHeight         Int?
  altText             String?
  accessibilityDesc   String?
  reviewedAt          DateTime?
  createdAt           DateTime @default(now())
}
```

---

#### 5b. Publishing Validation Gate

##### [MODIFY] [admin.ts](file:///home/heidi/Desktop/pte-ui/src/server/admin.ts)
- `publishQuestion(id)` calls `validateForPublish(taskCode, question)`:
  - Checks the task-specific Zod schema (from Phase 2c).
  - Verifies required media assets exist and have been reviewed.
  - Rejects with specific field-level errors; never silently publishes an incomplete item.

---

#### 5c. Bulk Content Import

##### [NEW] src/server/routes/import.ts
- `POST /api/admin/questions/import` — accepts JSON array of question payloads.
- Each item is validated against its task's Zod schema before insertion.
- Returns per-item success/failure with validation messages.
- Duplicate detection: hash `(taskCode + promptText)` → reject if `contentHash` matches existing item.

---

#### 5d. AI-Assisted Drafting (Improved)

##### [MODIFY] [aiService.ts](file:///home/heidi/Desktop/pte-ui/src/server/aiService.ts) + [admin.ts](file:///home/heidi/Desktop/pte-ui/src/server/admin.ts)
- `generateQuestionTemplate()` now generates task-specific, schema-complete items including `answerKeyJson` and `scoringRubricPayload`.
- Generated items are created with `status = 'draft'`, `reviewStatus = 'pending'` — never auto-published.

---

#### 5e. Question Browser API

##### [MODIFY] [student.ts](file:///home/heidi/Desktop/pte-ui/src/server/student.ts) — `GET /questions`
Replace current all-fetch + JS sort with server-side cursor pagination:
```
GET /api/student/questions
  ?taskCode=RA
  &cursor=<opaque-id>
  &pageSize=20
  &difficulty=medium
  &topic=science
  &status=unseen  // unseen | attempted | bookmarked
  &sort=recommended
```
Response:
```json
{
  "items": [],
  "nextCursor": "...",
  "total": 137,
  "counts": { "unseen": 104, "attempted": 33, "bookmarked": 8 }
}
```

---

### Phase 6 — Commercial UX

Replaces the Q1…Q100 button row and localStorage-only persistence.

---

#### 6a. Question Browser Component

##### [NEW] src/practice/components/QuestionBrowser.tsx
- Slide-in drawer with:
  - Difficulty filter
  - Topic filter
  - Attempted / unseen / bookmarked toggle
  - Search
  - Infinite scroll or paginated list
  - Random practice button
  - Weak-area practice button (lowest average score tasks)
  - Continue last question shortcut
- Replaces the `Q1 Q2 Q3 …` row.

---

#### 6b. Server-Side Bookmarks and Notes

##### [NEW] models in schema.prisma:
```prisma
model QuestionBookmark {
  id                 String   @id @default(cuid())
  userId             String
  questionBankItemId String
  createdAt          DateTime @default(now())
  @@unique([userId, questionBankItemId])
}

model QuestionNote {
  id                 String   @id @default(cuid())
  userId             String
  questionBankItemId String
  noteText           String
  updatedAt          DateTime @updatedAt
  @@unique([userId, questionBankItemId])
}
```

---

#### 6c. Attempt History per Question

##### [MODIFY] [schema.prisma](file:///home/heidi/Desktop/pte-ui/prisma/schema.prisma)
- Add `questionBankItemId String?` index on `PracticeSubmission` (already exists as field, add proper FK + index).

##### [NEW] src/practice/components/QuestionHistory.tsx
- Shows all prior attempts at the same question with scores, dates, and feedback.

---

### Phase 7 — Full Production Gate

---

#### 7a. Test Suite

##### [NEW] tests/contracts/\*.test.ts — one file per task (×22)
- Valid payload accepted.
- Invalid payload (missing required field) rejected.
- Publishing validation fires correctly.
- Answer key parser round-trips.
- Media requirement validated.

##### [NEW] tests/scoring/\*.test.ts
- Golden-answer fixture for each objective task → expected score.
- Partial-credit fixture.
- Negative-marking fixture.
- Empty response → `empty_response` status, score null.
- Form-rule failure → `form_invalid` status.
- Provider unavailable → submission stays `pending`, no score.
- Re-scoring idempotency: second call returns same result, no extra AI charge.

##### [NEW] tests/e2e/\*.spec.ts — one file per task (×22)
- Full journey: load question → media preparation → task interaction → submit → persist → score → show breakdown → retry → advance.
- Error cases: microphone denied, audio load failure, network interruption, page refresh mid-task, duplicate submit, scoring delay, expired session, mobile layout, keyboard-only.

---

#### 7b. Release Gate Script

##### [NEW] scripts/release-gate.ts
Fails CI pipeline unless:
- Every task code has ≥ 100 approved published questions.
- Every audio task has `audioUrl` or linked `MediaAsset`.
- Every DI question has `imageUrl`.
- Every objective task has parseable `answerKeyJson`.
- Every question passes its task Zod schema.
- No duplicate `contentHash` among published items.
- All media objects return HTTP 200 from object storage.
- All 22 E2E task tests pass.

---

## Verification Plan

### Automated Tests
```bash
# Type check
npx tsc --noEmit

# Contract tests
npx vitest run tests/contracts/

# Scoring tests
npx vitest run tests/scoring/

# E2E (Playwright)
npx playwright test tests/e2e/
```

### Manual Verification
- Admin: attempt to publish a RS question without `audioUrl` → expect rejection.
- Student: play listening audio → button disabled after first play; page refresh → still disabled.
- Student: submit a speaking task without recording → server returns 400.
- Student: score endpoint called twice for same submission → second call returns cached result, no second AI charge.
- Admin: import 100 RA questions via bulk import → release gate passes.

---

## Implementation Order Summary

| Phase | Deliverable | Estimated effort |
|-------|-------------|-----------------|
| 1 | Stop false functionality | ~3–5 days |
| 2 | 22 task contracts + renderers | ~10–15 days |
| 3 | Real audio upload, transcription, one-play | ~5–7 days |
| 4 | Deterministic scoring engines | ~7–10 days |
| 5 | CMS validation + content factory + 2,200 questions | ~20–30 days |
| 6 | Commercial question browser UX | ~5–7 days |
| 7 | Full test suite + release gate | ~10–15 days |

> [!NOTE]
> Phases 1–4 are prerequisites for any content work. Generating 2,200 questions before the task contracts and scoring engines exist will produce an unrenderable, unscorable bank — exactly the outcome the audit warns against.
