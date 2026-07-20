# Question Bank CMS + AI Generation Audit

## 1. Executive Verdict

The Question Bank CMS and AI generation pipeline are **structurally sound** but have **three P1 defects** that block commercial readiness. The AI provider architecture has a duplicate abstraction where the generation pipeline uses a legacy provider without retry, timeout, or production-safe defaults. The system defaults to `fake` AI provider with no production guard — any misconfigured deployment would silently serve fake mock data. The generation pipeline has zero unit test coverage. **Current readiness: 72/100.**

## 2. Score: 72/100

| Category | Score | Notes |
|----------|-------|-------|
| 22-task coverage | 100% | All 22 tasks supported in UI, schema, and generation |
| CMS UI | 85% | Good UX, missing loading state on batch init, silent failures |
| AI provider architecture | 40% | Dual abstraction, generation uses legacy provider, fake defaults in production |
| Generation pipeline | 60% | All stages exist but zero test coverage, hardcoded token counts |
| Database schema | 80% | Missing DB-level enum constraints, nullable generationSlot |
| Security | 65% | No rate limiting, no URL validation, no publishedAt trigger |
| Student/mock consumption | 90% | Published questions flow to practice/mock correctly |
| Test coverage | 30% | Generation pipeline has zero tests |
| CI/CD | 0% | No GitHub Actions workflows found |

## 3. P0 Blockers: 0

None identified. The system can generate, validate, and publish questions for all 22 task types. No data-loss or security-breach risks at P0 level.

## 4. P1 Blockers: 3

### P1-1: Fake AI Provider Can Run in Production
- **Files:** `src/server/ai/provider.ts:13`, `src/server/config.ts:25`, `src/server/aiService.ts:232`
- **Issue:** `AI_PROVIDER` defaults to `'fake'`. No `if (isProduction && provider === 'fake')` guard exists. Production without proper env var silently serves fake mock data.
- **Fix:** Add production guard that throws at startup if `AI_PROVIDER` is `'fake'`, or defaults to `'deepseek'` and requires the API key.

### P1-2: Dual AI Provider Abstractions — Generator Uses Legacy Without Retry
- **Files:** `src/server/aiService.ts` (legacy), `src/server/ai/provider.ts` (new), `src/server/questionGeneration/generator.ts` (uses legacy)
- **Issue:** `generator.ts` imports `getAiProvider()` from `aiService.ts` (legacy). The newer `DeepSeekProvider` class with 3-attempt retry, proper timeout (30s configurable), and Zod validation is unused by generation. The legacy provider has no retry, hardcoded 120s timeout, and `callDeepSeek()` has NO timeout at all (raw fetch with no AbortController).
- **Fix:** Migrate `generator.ts` and `reviewer.ts` to use `src/server/ai/provider.ts` factory. Deprecate `aiService.ts` provider interface.

### P1-3: No Rate Limiting on Question Generation
- **File:** `src/server/admin.ts:252`
- **Issue:** Any authenticated admin can call `POST /api/admin/question-bank/generate` without throttle. Each call creates 10 candidate slots, queues a background job, and calls DeepSeek API. No daily quota, no cost control, no rate limiting.
- **Fix:** Implement rate limiting (e.g., max 10 batches per hour per admin) and/or cost budget tracking.

## 5. P2 Backlog: 7 items

### P2-1: callDeepSeek() Has No Timeout
- **File:** `src/server/aiService.ts:44-74`
- `callDeepSeek` uses raw `fetch()` without `AbortController`. A hanging DeepSeek API call never resolves.

### P2-2: No Loading State for Batch Initiation
- **File:** `src/components/admin/question-bank/QuestionBankPanel.tsx`
- User sees nothing during the API call. Add loading overlay or disable button during submission.

### P2-3: Silent Failures in Admin Telemetry
- **File:** `src/components/AdminUI.tsx:167-168, 171-172`
- Question bank load failures are silently caught with no user feedback.

### P2-4: No Generation Pipeline Tests
- **Files:** `src/server/questionGeneration/*.ts`
- `generator.ts`, `normalizer.ts`, `validators.ts`, `dedupe.ts`, `reviewer.ts` — zero test coverage.

### P2-5: Content Hash Defeats Deduplication
- **File:** `src/server/jobs/handlers/generateQuestionBatch.ts:158`
- `contentHash` includes `slotNumber` in input, so same question in different slots = different hashes.

### P2-6: No DB-Level Enum Constraints
- **File:** `prisma/schema.prisma`
- `status`, `reviewStatus`, `assetStatus`, `difficulty` are free strings with no DB constraint.

### P2-7: No PublishedAt Auto-Set
- **File:** `prisma/schema.prisma`
- `publishedAt` relies on application code rather than a DB trigger.

## 6. File-by-File Findings

| File | Finding |
|------|---------|
| `src/shared/pteTaskRegistry.ts` | ✅ 22 tasks, complete metadata |
| `src/shared/questionTaskRegistry.ts` | ✅ 22 Zod schemas per task |
| `src/shared/mockExamTypes.ts` | ✅ 22 code enum |
| `src/components/admin/question-bank/GenerationDialog.tsx` | ✅ All 22 tasks selectable |
| `src/components/admin/question-bank/QuestionBankPanel.tsx` | ⚠️ No loading state on batch init |
| `src/components/admin/question-bank/BatchStatusView.tsx` | ✅ Polls every 3s, progress bars |
| `src/components/admin/question-bank/ManualQuestionModal.tsx` | ✅ All 22 tasks, edit supported |
| `src/components/admin/question-bank/QuestionTable.tsx` | ✅ Publish/Draft/Archive buttons |
| `src/components/AdminUI.tsx` | ⚠️ Silent failure on load |
| `src/server/admin.ts` | ⚠️ No rate limiting; ✅ Auth-guarded |
| `src/server/ai/provider.ts` | ❌ Fake defaults in production |
| `src/server/ai/deepseek.ts` | ✅ Retry, timeout, configurable |
| `src/server/ai/fake.ts` | ❌ No production guard |
| `src/server/aiService.ts` | ❌ Legacy duplicate, no timeout, no retry |
| `src/server/questionGeneration/generator.ts` | ❌ Uses legacy provider |
| `src/server/questionGeneration/reviewer.ts` | ❌ Uses legacy provider |
| `src/server/questionGeneration/normalizer.ts` | ✅ Exists, no tests |
| `src/server/questionGeneration/validators.ts` | ✅ Exists, no tests |
| `src/server/questionGeneration/dedupe.ts` | ⚠️ Hash includes slotNumber |
| `src/server/questionGeneration/prompts.ts` | ✅ 22 prompts, ✅ hidden prompt guard |
| `src/server/jobs/handlers/generateQuestionBatch.ts` | ✅ Full pipeline, no tests |
| `src/practice/contracts/publishValidation.ts` | ✅ 18 issue codes, ✅ pre-publish validation |
| `src/practice/contracts/studentSafeQuestion.ts` | ✅ Answer key sanitizer |
| `prisma/schema.prisma` | ⚠️ No enum constraints |
| `tests/contracts/publish-validation.test.ts` | ✅ 40+ assertions |
| `tests/contracts/student-safe-question.test.ts` | ✅ 50+ assertions |
| `tests/api/question-bank-navigation.test.ts` | ✅ ~20 assertions |
| `tests/api/question-instruction.test.ts` | ✅ ~30 assertions |
| `scripts/smoke/ai-provider-gate.mjs` | ⚠️ Whitelists legacy provider |
| `.github/workflows/` | ❌ Missing entirely |

## 7. 22-Task Coverage Table

| Task | Code | Generation | Schema | Answer Key | Practice | Mock |
|------|------|-----------|--------|------------|----------|------|
| Read Aloud | RA | ✅ | ✅ | ✅ transcript | ✅ | ✅ |
| Repeat Sentence | RS | ✅ | ✅ | ✅ transcript | ✅ | ✅ |
| Describe Image | DI | ✅ | ✅ | ✅ transcript | ✅ | ✅ |
| Retell Lecture | RL | ✅ | ✅ | ✅ transcript | ✅ | ✅ |
| Answer Short Question | ASQ | ✅ | ✅ | ✅ keywords | ✅ | ✅ |
| Summarize Group Discussion | SGD | ✅ | ✅ | ✅ transcript | ✅ | ✅ |
| Respond to a Situation | RTS | ✅ | ✅ | ✅ transcript | ✅ | ✅ |
| Summarize Written Text | SWT | ✅ | ✅ | ✅ sampleAnswer | ✅ | ✅ |
| Write Essay | WE | ✅ | ✅ | ✅ rubric | ✅ | ✅ |
| Multiple-choice, Choose Single Answer | MCS | ✅ | ✅ | ✅ correctOptionId | ✅ | ✅ |
| Multiple-choice, Choose Multiple Answers | MCM | ✅ | ✅ | ✅ correctOptionIds | ✅ | ✅ |
| Re-order Paragraphs | ROP | ✅ | ✅ | ✅ correctOrder | ✅ | ✅ |
| Fill in the Blanks (Reading) | FIBR | ✅ | ✅ | ✅ blankAnswers | ✅ | ✅ |
| Fill in the Blanks (Reading & Writing) | FIBRW | ✅ | ✅ | ✅ blankAnswers | ✅ | ✅ |
| Summarize Spoken Text | SST | ✅ | ✅ | ✅ sampleAnswer | ✅ | ✅ |
| Multiple-choice, Choose Multiple Answers (Listening) | MCMSL | ✅ | ✅ | ✅ correctOptionIds | ✅ | ✅ |
| Fill in the Blanks (Listening) | FIBL | ✅ | ✅ | ✅ blankAnswers | ✅ | ✅ |
| Highlight Correct Summary | HCS | ✅ | ✅ | ✅ correctOptionId | ✅ | ✅ |
| Multiple-choice, Choose Single Answer (Listening) | MCSSL | ✅ | ✅ | ✅ correctOptionId | ✅ | ✅ |
| Select Missing Word | SMW | ✅ | ✅ | ✅ correctOptionId | ✅ | ✅ |
| Highlight Incorrect Words | HIW | ✅ | ✅ | ✅ incorrectWords | ✅ | ✅ |
| Write from Dictation | WFD | ✅ | ✅ | ✅ segments | ✅ | ✅ |

## 8. AI Provider / Security Findings

- **Dual provider abstraction**: `aiService.ts` (legacy) and `ai/provider.ts` (new). Generation pipeline uses legacy.
- **DeepSeek config**: URL `api.deepseek.com/v1/chat/completions`, model `deepseek-chat`. Configurable timeout/retry in new provider only.
- **Server-only calls**: ✅ All AI calls are server-side. No frontend component calls AI directly.
- **Fake provider in production**: ❌ No production guard. `AI_PROVIDER` defaults to `'fake'`.
- **Timeout**: Legacy `callDeepSeek()` has NO timeout. New provider has 30s configurable.
- **Retry**: Legacy has none. New provider has 3 attempts with exponential backoff.
- **Schema validation**: ✅ Generated output validated via Zod schemas before persisting.
- **Prompt injection**: No sanitization of user-provided topic/difficulty before injection into AI prompts. Low risk since only authenticated admins can trigger generation.
- **Rate limiting**: ❌ None on generation endpoint.
- **API key exposure**: ✅ API keys are server-side only, never exposed to browser.

## 9. Database / Migration Findings

- **QuestionBankItem schema**: 37 fields covering all required metadata. Missing DB-level enum constraints.
- **Generation batch tracking**: ✅ `QuestionGenerationBatch` with requestKey idempotency.
- **Versoning**: ✅ `contentVersion` field exists with auto-increment.
- **Migrations**: `prisma/migrations/` directory exists with migration history.
- **Existing data compatibility**: ✅ All new fields are optional/nulled. No destructive migrations.
- **Published/draft/rejected**: ✅ `status` field + `reviewStatus` field.
- **Immutable snapshots**: ✅ Questions used in mock exams are frozen via `MockExamQuestionSchema`.

## 10. Student/Mock Exam Consumption Findings

- **Practice**: ✅ Published questions appear via `GET /api/student/questions` with `status: 'published'` filter.
- **Mock exam**: ✅ `mockTestGenerator.ts` queries `QuestionBankItem` with `status: 'published'`.
- **Snapshot freezing**: ✅ Mock exam generator freezes question data into `questionsJson` at generation time.
- **Scoring**: ✅ Deterministic scoring reads `answerKeyJson` from frozen snapshot (PR #68 fix).
- **Student-safe**: ✅ `buildStudentSafeQuestion()` strips answer keys from student-facing payloads.
- **22-task alignment**: ✅ Practice and mock use the same canonical registry.

## 11. Test Coverage Findings

| Area | Coverage | Status |
|------|----------|--------|
| Publish validation | ✅ Unit + smoke | 40+ assertions |
| Student-safe filtering | ✅ Unit + smoke | 50+ assertions |
| Question bank navigation | ✅ Unit smoke | ~20 assertions |
| Question instruction | ✅ Unit smoke | ~30 assertions |
| Hidden content boundary | ✅ Smoke | 205 assertions |
| AI provider gate | ✅ Smoke | Ensures centralized calls |
| DeepSeek connectivity | ✅ Smoke | Live provider check |
| **Generation pipeline** | ❌ **None** | Zero tests |
| **Batch handler** | ❌ **None** | Zero tests |
| **Asset generation** | ❌ **None** | Zero tests |
| **Admin API CRUD** | ❌ **None** | Zero tests |
| **Browser E2E** | ❌ **None** | Zero tests |

## 12. Required PR Plan

### PR 1: Fix AI Provider Architecture
- Add production guard to `ai/provider.ts` (throw if `NODE_ENV=production` and `AI_PROVIDER=fake`)
- Migrate `generator.ts` and `reviewer.ts` to use `server/ai/provider.ts`
- Add timeout to `callDeepSeek()` in `aiService.ts`
- Add generation pipeline unit tests

### PR 2: Add Rate Limiting + Security
- Add rate limiting to `POST /api/admin/question-bank/generate`
- Add loading state to QuestionBankPanel
- Surface errors in AdminUI telemetry

### PR 3: Fix Content Hash + DB Constraints
- Fix `contentHash` to not include slotNumber
- Add DB-level enum constraints for status fields
- Add `publishedAt` auto-set

### PR 4: Add Generation Pipeline Tests
- Test `generator.ts` with mock AI provider
- Test `normalizer.ts`, `validators.ts`, `dedupe.ts`, `reviewer.ts`
- Test full batch lifecycle

### PR 5: Add CI/CD
- Create `.github/workflows/ci-cd.yml` (if not already present — note: CI already exists from prior work)

## 13. Acceptance Criteria for 98/100

- [ ] AI_PROVIDER cannot be `fake` in production
- [ ] Generator/reviewer uses provider with retry + timeout
- [ ] Rate limiting on generation endpoint
- [ ] Generation pipeline has unit tests
- [ ] Content hash deduplication works correctly
- [ ] DB-level enum constraints added
- [ ] Loading state on batch initiation
- [ ] Admin telemetry errors surfaced
- [ ] callDeepSeek has timeout
- [ ] All existing tests pass
- [ ] CI passes
