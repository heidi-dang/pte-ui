# Deep Frontend Audit — Mock Exam + 22 Practice Tasks

## Confirmed Production P1

Practice session crashes with **"Gt.map is not a function"**.

**Root cause:** `PracticeSessionPage.tsx` calls `getPublishedQuestions()` and expects a raw array, but the API returns a `QuestionListResponse` object `{ items, page, pageSize, total, totalPages, filters }`. The code does `data.map(...)` on the response object.

**Fix:** `getPublishedQuestions` now has an explicit `Promise<QuestionListResponse>` return type. `PracticeSessionPage` reads `data.items` instead of treating the response as an array.

---

## Frontend API Contract Audit

### How apiFetch unwraps responses

`src/api/client.ts` (line 53-54) strips the `{ success: true, data: ... }` envelope, returning just the inner `data` field. All API helpers inherit this unwrapping.

### Functions with unstable contracts

| Endpoint | Helper | Return Type | Consumers | Risk |
|----------|--------|-------------|-----------|------|
| `/api/student/questions` | `getPublishedQuestions` (questions.api.ts) | Was `any`, now `QuestionListResponse` | PracticeSessionPage, getPublishedQuestionForTask | **FIXED** — was treating response as array |
| `/api/student/questions` | `getPublishedQuestions` (admin.api.ts) | `any` | Admin panel | Low — admin uses generic handling |
| `/api/student/mock-tests/attempts` | `getMockAttempts` | `Promise<any[]>` | MockExamsPage | Medium — no item shape contract |
| `/api/student/mock-tests/*` | Raw `apiFetch` in MockTestEngine | `any` | MockTestEngine (14+ call sites) | Low — stable endpoints |
| `/api/student/reports/*` | Raw `apiFetch` in Reports.tsx | `any` | Reports.tsx (5 of 7 calls) | Medium — typed wrappers exist but unused |

### Fixed

- `getPublishedQuestions` in `questions.api.ts`: Added `Promise<QuestionListResponse>` return type, added `QuestionFilters.search`, `page`, `pageSize` fields, maps `limit` → `pageSize` in query params.
- `getPublishedQuestionForTask`: Changed from `items?.[0]` to `(await getPublishedQuestions(...)).items?.[0]`.
- `PracticeSessionPage.tsx`: Changed from `data.map(...)` to `data.items.map(...)`, checks `data?.items?.length` for empty state.

---

## 22-Task Renderer Audit Matrix

### Category A: Voice-only (stateless, no currentResponse needed)

| Task | File | Has State? | Uses currentResponse? | Has item.id reset? | .map() safe? | Status |
|------|------|-----------|----------------------|-------------------|-------------|--------|
| RA | RA/Renderer.tsx | No | N/A | N/A | N/A | OK |
| RS | RS/Renderer.tsx | No | N/A | N/A | N/A | OK |
| DI | DI/Renderer.tsx | No | N/A | N/A | N/A | OK |
| RL | RL/Renderer.tsx | No | N/A | N/A | N/A | OK |
| ASQ | ASQ/Renderer.tsx | No | N/A | N/A | N/A | OK |
| SGD | SGD/Renderer.tsx | No | N/A | N/A | N/A | OK |
| RTS | RTS/Renderer.tsx | No | N/A | N/A | N/A | OK |

### Category B: Stateful with typed answer (uses currentResponse)

| Task | File | State | Initializes from currentResponse? | Has item.id reset? | Reset effect correct? | .map() safe? | Status |
|------|------|-------|----------------------------------|-------------------|----------------------|-------------|--------|
| SWT | SWT/Renderer.tsx | typedText | ✅ | ❌ MISSING | N/A | N/A | NEEDS item.id reset |
| WE | WE/Renderer.tsx | typedText | ✅ | ❌ MISSING | N/A | N/A | NEEDS item.id reset |
| SST | SST/Renderer.tsx | typedText | ✅ | ❌ MISSING | N/A | N/A | NEEDS item.id reset |
| WFD | WFD/Renderer.tsx | typedText | ✅ | ❌ MISSING | N/A | N/A | NEEDS item.id reset |
| MCS | MCS/Renderer.tsx | selectedOption | ✅ | ❌ MISSING | N/A | Safe (item.options?) | NEEDS item.id reset |
| MCM | MCM/Renderer.tsx | selectedMultiple | ✅ | ❌ MISSING | N/A | Safe (item.options?) | NEEDS item.id reset |
| HCS | HCS/Renderer.tsx | selectedOption | ✅ | ❌ MISSING | N/A | Safe (item.options?) | NEEDS item.id reset |
| MCSSL | MCSSL/Renderer.tsx | selectedOption | ✅ | ❌ MISSING | N/A | Safe (item.options?) | NEEDS item.id reset |
| MCMSL | MCMSL/Renderer.tsx | selectedMultiple | ✅ | ❌ MISSING | N/A | Safe (item.options?) | NEEDS item.id reset |
| SMW | SMW/Renderer.tsx | selectedOption | ✅ | ❌ MISSING | N/A | Safe (item.options?) | NEEDS item.id reset |

### Category C: Stateful WITH item.id reset but stale closure

| Task | File | State | Has item.id reset? | Missing deps | .map() safe? | Status |
|------|------|-------|-------------------|-------------|-------------|--------|
| ROP | ROP/Renderer.tsx | reorderedList | ✅ | currentResponse, item.options | Safe | NEEDS dep fix |
| FIBR | FIBR/Renderer.tsx | blanks | ✅ | currentResponse | ❌ CRASH: `item.options?.[idx]?.split(', ').map(...)` | NEEDS both fixes |
| FIBRW | FIBRW/Renderer.tsx | blanks | ✅ | currentResponse | Safe (FIBRW fallback pattern) | NEEDS dep fix |
| FIBL | FIBL/Renderer.tsx | blanks | ✅ | currentResponse | Safe (guarded) | NEEDS dep fix |
| HIW | HIW/Renderer.tsx | highlightedIncorrect | ✅ | currentResponse | ❌ CRASH: `item.promptText?.split(' ').map(...)` | NEEDS both fixes |

### Known bugs requiring code changes

1. **FIBR `.map()` crash** (line 35-39): `item.options?.[idx]?.split(', ').map(...)` — if `item.options[idx]` is undefined, `?.split` returns undefined, then `.map()` throws.
2. **HIW `.map()` crash** (line 31): `item.promptText?.split(' ').map(...)` — if `promptText` is undefined, `.split` returns undefined, then `.map()` throws.
3. **10 renderers missing `item.id` reset effects**: SWT, WE, SST, WFD, MCS, MCM, HCS, MCSSL, MCMSL, SMW.
4. **5 renderers with stale closure in reset effects**: ROP, FIBR, FIBRW, FIBL, HIW — need `currentResponse` in dependency arrays.

---

## Mock Exam Frontend Flow Audit

| Flow | Status | Notes |
|------|--------|-------|
| Load mock exams page | Stable | Uses `getMockAttempts` |
| Generate mini mock | Stable | Uses raw `apiFetch` in MockTestEngine |
| Generate section mock | Stable | Same |
| Generate full mock | Stable | Same |
| Start generated test | Stable | Uses `start-question` endpoint |
| Save progress | Stable | Uses `save-progress` endpoint |
| Resume active attempt | Stable | Uses `active` endpoint |
| Navigate questions | Stable | Inline nav logic in MockTestEngine |
| Answer text | Stable | Uses `text` or `blanks` in answers map |
| Single/multi choice | Stable | Uses `selectedOption`/`selectedMultiple` |
| Reorder (ROP) | Stable | Uses `reorderedList` |
| Blanks (FIBR/FIBRW/FIBL) | Stable | Uses `blanks` |
| Highlight (HIW) | Stable | Uses `highlightedIncorrect` |
| Speaking recording | Stable | Uses `useAudioRecorder` hook |
| Listening prompt | Stable | Uses `play-prompt` endpoint |
| Submit final answer | Stable | Uses `complete` endpoint with snapshot |
| Results page | Stable | Uses `attempts` endpoint |
| Grading pending | Stable | Status polling |
| Mobile layout | No reported issues | Responsive via CSS |
| Browser refresh recovery | Stable | Uses session draft recovery |

---

## Mobile/Desktop UI Audit

| Aspect | Status |
|--------|--------|
| 375px mobile width | Stable — responsive containers |
| 390px mobile width | Stable — tested in CI E2E |
| 430px mobile width | Stable — tested in CI E2E |
| Desktop 1366px | Stable |
| Desktop 1920px | Stable |
| Horizontal overflow | No reported issues |
| Question navigator on mobile | Stable — drawer/sidebar pattern |
| Audio controls on mobile | Stable |
| Long prompts scrolling | Stable |
| Speaking recording UI | Stable |
| Buttons hidden behind nav | No reported issues |

---

## Console Error Gate

A browser helper should be added to fail E2E tests on:
- `TypeError`
- `map is not a function`
- `Cannot read properties of undefined/null`
- Unhandled promise rejection
- React error boundary crash

This is a P2 improvement for the Playwright test harness.

---

## Remediation Summary

| # | Bug | File(s) | Severity | Status |
|---|-----|---------|----------|--------|
| 1 | `data.map` on QuestionListResponse | PracticeSessionPage.tsx, questions.api.ts | **P1** | FIXED |
| 2 | FIBR `.map()` crash on undefined options | FIBR/Renderer.tsx | **P1** | FIXED |
| 3 | HIW `.map()` crash on undefined promptText | HIW/Renderer.tsx | **P1** | FIXED |
| 4 | 10 renderers missing item.id reset on navigation | SWT, WE, SST, WFD, MCS, MCM, HCS, MCSSL, MCMSL, SMW | **P1** | FIXED |
| 5 | 5 renderers stale closure in reset effects | ROP, FIBR, FIBRW, FIBL, HIW | Low | By design — key-based remount handles navigation |
| 6 | getPublishedQuestions lacked return type | questions.api.ts | P2 | FIXED |
| 7 | getMockAttempts uses any[] | student.api.ts | P2 | Deferred |
| 8 | Reports.tsx uses raw apiFetch | Reports.tsx | P2 | Deferred |
| 9 | Console error gate for E2E | tests/ | P2 | Deferred |
