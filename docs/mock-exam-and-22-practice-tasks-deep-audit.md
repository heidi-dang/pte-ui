# Deep Audit: Mock Exam + 22 Practice Tasks

## 1. Executive Verdict

The mock exam and practice task systems have **critical logic defects** that make them **not production-ready**. The most severe issues are: MockTestEngine does not accept start/resume data via props (P0), final answers can be lost on submit (P1), mock grading stores raw responses instead of normalized ones (P1), fallback questions without answer keys can enter production mock exams (P1), and 15 of 22 practice task renderers lose state on navigation (P1). **Current readiness: 58/100.**

## 2. Current Score: 58/100

| Category | Score | Notes |
|----------|-------|-------|
| Mock exam entry/resume | 20% | Data not passed into engine, local fallback no server attempt |
| Mock exam grading | 40% | Raw vs normalized mismatch, fallback questions ungradeable |
| Mock exam generator | 50% | No randomization, fallback questions in production |
| Practice engine | 40% | Search broken, timer recording dead code, ID heuristic |
| Task renderers (22) | 60% | 15/22 lose state on navigation, speaking auto-record broken |
| Task contracts (22) | 95% | All 22 have schemas, response shapes, scoring modes |
| Mobile | 70% | Some overflow checks, not fully tested |
| Tests | 40% | Gaps in renderer, search, timer, grading coverage |
| CI | 80% | Runs but doesn't catch these logic defects |

## 3. P0 Blockers: 1

### P0-1: MockExamsPage data not passed into MockTestEngine
- **Files:** `src/components/student/pages/MockExamsPage.tsx`, `src/components/MockTestEngine.tsx:47-49`
- **Issue:** `MockExamsPage` fetches/generates test data into `resumeData` and opens `<MockTestEngine />`, but `MockTestEngine` only accepts `onNavigateReport`. There is no `initialTest`, `resumeAttempt`, `initialAttemptId`, `initialQuestions`, `initialAnswers`, `initialQuestionIndex`, or `initialSecondsRemaining` prop. The engine starts with its own internal fetch flow, ignoring the parent's prepared data.

## 4. P1 Blockers: 9

### P1-1: Resume attempt data fetched but not passed into engine
- **Files:** `src/components/student/pages/MockExamsPage.tsx`, `src/components/MockTestEngine.tsx:47-49`
- **Issue:** `handleResume()` in `MockExamsPage` fetches `/api/student/mock-tests/attempt/:id`, stores in `resumeData`, then opens the engine. The engine ignores this — no matching prop exists.

### P1-2: Mock exam can fall back to local-only running state
- **Files:** `src/components/MockTestEngine.tsx:907-911`
- **Issue:** If `/save-progress` fails, `handleStartTest` still calls `setTestState('running')`. The user enters an exam without a valid server attempt ID, breaking audio upload, progress save, resume, and grading.

### P1-3: Final answer can be lost on submit
- **Files:** `src/components/MockTestEngine.tsx:947-978`
- **Issue:** `handleSubmitMockTest()` calls `saveCurrentInputsToAnswers()` (async `setAnswers`) then immediately reads the closure-bound `answers` for the API payload. React state updates are async, so the latest current question answer can be missing.

### P1-4: Mock grading stores raw answers, not normalized
- **Files:** `src/server/student.ts:1754-1774`
- **Issue:** The `/mock-tests/complete` handler builds `normalizedAnswers` correctly (line 1711), but then stores `answers[i]` (raw) into `mockQuestionResult.normalizedResponse` instead of `normalizedAnswers[i]`.

### P1-5: Mock grading worker reads raw data from normalizedResponse
- **Files:** `src/server/jobs/worker.ts:375-379`
- **Issue:** Worker reads `resItem.normalizedResponse` which is actually raw data. Feeds it to deterministic scorers expecting normalized shapes (`answer.selected`, `answer.ordered`, `answer.blanks`, etc.).

### P1-6: Mock generator silently creates ungradeable fallback questions in production
- **Files:** `src/utils/mockTestGenerator.ts:114-202`
- **Issue:** Three fallback paths create questions with no `answerKeyJson`, no `optionsJson`, and placeholder `promptText`. These are ungradeable but not prevented from entering mock exams.

### P1-7: Practice search does not reload questions
- **Files:** `src/components/PracticeEngine.tsx:76-103`
- **Issue:** The `useEffect` dependency array is `[activeCode, page, difficultyFilter]` — `search` is missing. Changing search text on page 1 has no effect.

### P1-8: Speaking auto-record timer never reaches recording phase
- **Files:** `src/practice/hooks/useTaskTimer.ts:40-41`
- **Issue:** Timer transitions `preparing → answering → completed`. It never calls `setPhase('recording')`. The auto-recording `useEffect` in PracticeEngine (lines 139-144) that checks `phase === 'recording'` is dead code.

### P1-9: All 15 non-speaking task renderers lose state on navigation/resume
- **Files:** All 15 non-speaking renderers (SWT, WE, MCS, MCM, ROP, FIBR, FIBRW, SST, MCMSL, FIBL, HCS, MCSSL, SMW, HIW, WFD)
- **Issue:** Renderers use local `useState` but `PracticeTaskForm.tsx:119-124` never passes `taskResponse` to `<TaskRenderer>`. The `RendererProps` type has no `response` field. Navigating away and back loses all user input.

## 5. P2 Backlog: 5

### P2-1: Published CMS detection uses ID length heuristic
- **Files:** `src/components/PracticeEngine.tsx:38`
- `isPublishedCms = selectedQuestion?.id ? selectedQuestion.id.length > 20 : false` — fragile.

### P2-2: Mock generator is deterministic, not random
- **Files:** `src/utils/mockTestGenerator.ts:134-138`
- Uses `findFirst` + `orderBy: updatedAt desc` + linear `skip`. Every student gets the same questions.

### P2-3: Speaking tasks with 0 prep time skip recording entirely
- **Files:** `src/components/MockTestEngine.tsx:444`
- When `info.prepTime === 0`, status starts at `'answering'` directly, even for speaking tasks.

### P2-4: PracticeEngine `normalizeResponse` is identity for all 22 tasks
- **Files:** All 22 task `index.ts` files
- `normalizeResponse: (data) => data` — no transformation applied.

### P2-5: Wrong "Resume" button shown during exam mode running state
- **Files:** `src/components/MockTestEngine.tsx:1062-1080`
- When `examMode=true` and `testState='running'`, the Resume button is shown instead of Pause. Clicking it calls `handleResumeTest` which redundantly sets status to running.

## 6. Mock Exam Architecture Map

```
User clicks "Start" in MockExamsPage
  → MockExamsPage.handleStartMock(type)
  → POST /api/student/mock-tests/generate { testType }
  → stores result in resumeData
  → sets showEngine=true
  → renders <MockTestEngine onNavigateReport={handleBack} />
  → BUT: MockTestEngine ignores resumeData (P0-1)

MockTestEngine internal flow:
  fetchInitialData() on mount
  → GET /api/student/mock-tests (available tests)
  → GET /api/student/mock-tests/attempts (history)
  → GET /api/student/mock-tests/active (resume)
  → User clicks "Start Exam" in MockTestEngine UI
  → handleStartTest()
    → generate questions if missing
    → requestFullscreen()
    → save-progress to server
    → if save-progress fails → still sets running (P1-2)
    → setTestState('running')

  Timer runs → prep → recording/answering → completed
  → saveProgress periodically
  → handleSubmitMockTest()
    → saveCurrentInputsToAnswers() (async)
    → sends closure-bound answers (stale) (P1-3)
  → POST /api/student/mock-tests/complete
    → normalizes answers correctly
    → BUT stores raw in questionResults (P1-4)
  → Worker grades from raw data (P1-5)
```

## 7. Practice Engine Architecture Map

```
User selects task → PracticeEngine loads questions
  → GET /api/student/questions?taskCode=X&search=...
  → search doesn't trigger reload (P1-7)
  
User clicks question → startPracticeAttempt()
  → Timer starts: preparing → answering → completed
  → Never goes to 'recording' (P1-8)
  
User answers → onAnswerChange → setTaskResponse
  → Passes through PracticeMainPanel → PracticeTaskForm
  → PracticeTaskForm drops taskResponse (P1-9)
  → Renderer stores in local useState
  → Navigation unmounts renderer → loses state

User submits → POST /api/student/practice/submit
  → Graded via deterministic scorer or AI
```

## 8. 22-Task Matrix

| Task | Practice Renderer | Mock Renderer | Contract | CMS Schema | Response Shape | State Persists | Answer Key | Status |
|------|------------------|---------------|----------|------------|---------------|----------------|------------|--------|
| RA | SpeakingAudio | SharedAudio | ✅ Canonical | ✅ | `{}` → audio | N/A (no input) | transcript | ✅ |
| RS | SpeakingAudio | SharedAudio | ✅ Canonical | ✅ | `{}` → audio | N/A | transcript | ✅ |
| DI | SpeakingAudio | SharedAudio | ✅ Canonical | ✅ | `{}` → audio | N/A | transcript | ✅ |
| RL | SpeakingAudio | SharedAudio | ✅ Canonical | ✅ | `{}` → audio | N/A | transcript | ✅ |
| ASQ | SpeakingAudio | SharedAudio | ✅ Canonical | ✅ | `{}` → audio | N/A | keywords | ✅ |
| SGD | SpeakingAudio | SharedAudio | ✅ Canonical | ✅ | `{}` → audio | N/A | transcript | ✅ |
| RTS | SpeakingAudio | SharedAudio | ✅ Canonical | ✅ | `{}` → audio | N/A | transcript | ✅ |
| SWT | WritingText | WritingText | ✅ Canonical | ✅ | `{typedText}`→text | ❌ Local state | rubric | ❌ State loss |
| WE | WritingText | WritingText | ✅ Canonical | ✅ | `{typedText}`→text | ❌ Local state | rubric | ❌ State loss |
| MCS | SingleChoice | SingleChoice | ✅ Canonical | ✅ | `{selectedOption}`→single | ❌ Local state | correct | ❌ State loss |
| MCM | MultiChoice | MultiChoice | ✅ Canonical | ✅ | `{selectedMultiple}`→multi | ❌ Local state | correct[] | ❌ State loss |
| ROP | Reorder | ReorderParagraph | ✅ Canonical | ✅ | `{reorderedList}`→ordered | ❌ Local state | order | ❌ State loss |
| FIBR | FillBlank | FillBlank | ✅ Canonical | ✅ | `{blanks}`→blanks | ❌ Local state | answers | ❌ State loss |
| FIBRW | FillBlank | FillBlank | ✅ Canonical | ✅ | `{blanks}`→blanks | ❌ Local state | answers | ❌ State loss |
| SST | WritingText | WritingText | ✅ Canonical | ✅ | `{typedText}`→text | ❌ Local state | sample | ❌ State loss |
| MCMSL | MultiChoice | MultiChoice | ✅ Canonical | ✅ | `{selectedMultiple}`→multi | ❌ Local state | correct[] | ❌ State loss |
| FIBL | FillBlank | FillBlank | ✅ Canonical | ✅ | `{blanks}`→blanks | ❌ Local state | answers | ❌ State loss |
| HCS | SingleChoice | SingleChoice | ✅ Canonical | ✅ | `{selectedOption}`→single | ❌ Local state | correct | ❌ State loss |
| MCSSL | SingleChoice | SingleChoice | ✅ Canonical | ✅ | `{selectedOption}`→single | ❌ Local state | correct | ❌ State loss |
| SMW | SingleChoice | SingleChoice | ✅ Canonical | ✅ | `{selectedOption}`→single | ❌ Local state | correct | ❌ State loss |
| HIW | HighlightWords | HighlightWords | ✅ Canonical | ✅ | `{highlighted}`→words | ❌ Local state | incorrect[] | ❌ State loss |
| WFD | WriteFromDict | WritingText | ✅ Canonical | ✅ | `{typedText}`→text | ❌ Local state | segments | ❌ State loss |

## 9. Function Inventory

Total functions audited: ~200 across MockTestEngine, PracticeEngine, server/student.ts, mockTestGenerator, worker.ts, and 22 task modules.

| Category | Count |
|----------|-------|
| OK | ~120 |
| Bug | 14 |
| Needs test | ~40 |
| Dead/legacy | 3 |
| Unsafe fallback | 3 |
| UX/logical issue | 5 |
| Security issue | 0 |

## 10. Test Coverage Findings

| Test File | Coverage | Status |
|-----------|----------|--------|
| `tests/e2e/mock-exam-entry-flow.spec.ts` | Page load, not full flow | ❌ Shallow |
| `tests/e2e/mock-exam-full-flow.spec.ts` | API-based, not browser UI | ❌ Partial |
| `tests/e2e/mock-exam-mobile.spec.ts` | Overflow + page load | ❌ Shallow |
| `tests/e2e/mock-exam-renderers.spec.ts` | Practice page text, not renderers | ❌ Shallow |
| `tests/e2e/mock-exam-results.spec.ts` | Page load only | ❌ Shallow |
| `scripts/smoke/mock-exam-api-full-flow.mjs` | API lifecycle | ✅ Good |
| `scripts/smoke/mock-exam-commercial-readiness-smoke.mjs` | DB-level checks | ✅ Good |
| `scripts/smoke/mock-exam-entry-flow-smoke.mjs` | API entry flow | ✅ Good |

## 11. Required Repair PR Plan

### PR 1: Fix MockTestEngine → MockExamsPage wiring (P0)
- Add props to MockTestEngine: `initialTest`, `resumeAttempt`, `initialAttemptId`, `initialQuestions`, `initialAnswers`, `initialQuestionIndex`, `initialSecondsRemaining`
- Update MockExamsPage to pass actual data
- Remove redundant internal fetch when data is provided

### PR 2: Fix submit answer loss (P1-3)
- Make `handleSubmitMockTest` read inputs synchronously before submit
- Ensure `saveCurrentInputsToAnswers` returns the updated answers
- Fix `handleAutoAdvance` same issue

### PR 3: Fix normalized response in grading (P1-4, P1-5)
- Store `normalizedAnswers[key]` in `mockQuestionResult.normalizedResponse`
- Worker reads properly normalized data

### PR 4: Fix fallback questions + randomization (P1-6, P2-2)
- Block fallback questions in production
- Add proper randomization with `Math.random()` or DB random ordering
- Add duplicate detection

### PR 5: Fix practice search + timer + renderer state (P1-7, P1-8, P1-9)
- Add `search` to useEffect dependency array
- Fix `useTaskTimer` to support `recording` phase
- Add `response` prop to `RendererProps` and pass `taskResponse` from `PracticeTaskForm`

### PR 6: Fix remaining P2 items
- Replace ID-length heuristic with explicit metadata
- Fix speaking 0-prep-time recording skip
- Fix exam mode Resume button mislabel
- Add remaining test coverage

## 12. Acceptance Criteria for 98/100

- [ ] MockExamsPage data is passed into MockTestEngine
- [ ] Resume works with correct attempt data
- [ ] Server save-progress failure shows error, not local fallback
- [ ] Submit always includes latest answer
- [ ] Grading stores and reads normalized responses
- [ ] No fallback questions in production
- [ ] Mock generator is properly randomized
- [ ] Practice search triggers reload
- [ ] Speaking timer has working recording phase
- [ ] All 22 renderers preserve state across navigation
- [ ] CMS detection uses explicit metadata
- [ ] ID-length heuristic removed
- [ ] All existing tests pass
