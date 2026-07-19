# Mock Exam Engine Post-PR45 Repair Baseline
- Main SHA: 2b6caac
- Existing local test results: (pending)
- Known broken behaviours reproduced:
  1. Status contract: save-progress writes `In_Progress` (underscore), active searches `In Progress` (space) — resume detection broken
  2. 22-task registry: mockExamTypes.ts has 20 codes, missing SGD and RTS
  3. Scoring answer keys: reads optionsJson instead of answerKeyJson
  4. STT: FakeTranscriber can fallback in production
  5. No per-task answer normalization
  6. Audio upload not idempotent
  7. Exam/Practice modes not separated
  8. MockTestEngine monolithic (not split into renderers)
  9. Results breakdown incomplete
- Active-session resume result: BROKEN — space vs underscore mismatch
- 22-task registry result: INCOMPLETE — 2 missing task codes
- Deterministic scoring result: reads wrong answer key field
- Audio upload/idempotency result: untested
- STT production fallback result: FakeTranscriber can be used in production
- Browser E2E current coverage: limited
