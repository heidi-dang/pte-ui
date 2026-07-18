# Developer Handover: PTE UI Production Overhaul

**Date:** July 18, 2026
**Branch:** `feat/pte-task-upgrade`
**Status:** Phase 1 (Stop False Functionality) Complete. Phases 2–7 Pending.

Welcome to the PTE UI project! We are in the middle of a massive 7-phase overhaul to take this application from a 28/100 prototype to a commercial-grade production application. 

This document will get you up to speed on exactly what has been completed, what the new architectural direction is, and what your responsibilities are for the remaining phases.

---

## 1. What We Already Did (Phase 1 Completed)

The initial version of this app had several critical defects that misled users (e.g., inventing scores using `Math.random()`, exposing hidden audio transcripts before playback, and double-grading submissions). **Phase 1 fixed these foundational issues.**

Here is what is already complete and working in the `feat/pte-task-upgrade` branch:

* **Removed Random Scoring:** Deleted all `Math.random()` fallbacks. We introduced a strict `ScoringResult` discriminated union in `src/server/aiService.ts`. If an AI provider fails, the app now honestly reports `provider_unavailable` rather than faking a score.
* **Deterministic Objective Scoring Prep:** All 13 objective tasks currently return a `pending_deterministic` status. They are explicitly gated *away* from the AI prompt (AI is too slow and inaccurate for exact-match objective tasks).
* **Idempotent Background Grading:** The worker job (`src/server/jobs/worker.ts`) now checks if a submission is already `graded`. We removed the synchronous grading endpoint to prevent double-grading.
* **Strict Submission Validation:** `validateSubmissionPayload()` in `src/server/student.ts` now drops invalid payloads (e.g., placeholder audio text, missing MCQ selections, or essays under 5 words) before they hit the DB.
* **Audio & Transcript Fixes:** 
  * Replaced the fake `setInterval` audio progress bar with a real HTML5 `<audio>` element. 
  * Implemented one-play enforcement for listening tasks (button locks after first play).
  * Hid the `promptText` for all tasks where the prompt *is* the audio transcript (e.g., WFD, SST).
* **CMS Publishing Gate:** Added `validateForPublish()` in `src/server/admin.ts`. You can no longer publish a QuestionBankItem if it is missing required assets (like an audio file for Dictation, or an answer key for MCQs).
* **Type Safety:** The branch currently has zero TypeScript errors (`npx tsc --noEmit` passes cleanly).

---

## 2. What You Need To Do (Phases 2–7 Roadmap)

Your job is to execute the remaining 6 phases of the `implementation-plan.md`. Please read `docs/implementation-plan.md` and `docs/pte-task-upgrade.md` for deep technical context. 

Here is the high-level summary of your upcoming work:

### Phase 2: Task Contracts (Dismantle the Monolith)
Currently, `PracticeEngine.tsx` is a 1,200+ line monolith full of `if/else` statements attempting to render 22 different task types. 
* **Your task:** Break this into 22 individual task modules (`src/practice/tasks/<TaskCode>/Renderer.tsx`). 
* Create strict Zod schemas for each task's expected `answerJson` and CMS payload requirements. 
* Turn `PracticeEngine.tsx` into a thin shell that simply routes to the correct task module.

### Phase 3: Production Media Pipeline
Currently, student microphone recordings are kept in memory as local blob URLs and never uploaded, making STT (Speech-to-Text) impossible.
* **Your task:** Build a multipart upload endpoint (`POST /practice/audio-upload`).
* Wire it up to durable object storage (S3/R2/GCS).
* Integrate an STT provider (e.g., Whisper, Google) in the worker so the AI actually has transcripts to grade.
* Implement a secure, signed-URL playback system for CMS audio files to prevent users from bypassing the one-play rule by downloading the MP3s.

### Phase 4: Deterministic Scoring Engines
Objective tasks (like Multiple Choice, Reorder Paragraphs, Highlight Incorrect Words) must be scored deterministically using exact math, not AI.
* **Your task:** Build 13 localized TS scoring functions (`src/utils/taskScorers/`).
* E.g., for Reorder Paragraphs (ROP), implement an algorithm that gives partial credit for adjacent pairs according to official PTE marking guides.
* Connect these to the `grade_practice` worker job.

### Phase 5: CMS Validation + Content Factory
We need 2,200 valid questions (100 per task) to launch.
* **Your task:** Build a bulk-import JSON API endpoint. 
* Implement duplicate detection via `contentHash`.
* Enforce that any imported question perfectly matches the Zod schemas you built in Phase 2.

### Phase 6: Commercial UX
The current UI just has a row of buttons (Q1, Q2, Q3). 
* **Your task:** Build a proper `QuestionBrowser` sliding drawer with infinite scroll, difficulty filters, and topic filters.
* Add server-side bookmarks and notes tracking.
* Build a per-question attempt history view so students can see their past scores on specific items.

### Phase 7: Full Production Gate (Testing)
* **Your task:** Write contract tests (Vitest) for all 22 task Zod schemas.
* Write unit tests verifying that all 13 objective scoring algorithms correctly handle perfect, partial, and negative marking scenarios.
* Write Playwright E2E tests for the 22 user journeys.

---

## 3. Important Gotchas & Guardrails

1. **Do not break the Schema:** `schema.prisma` is currently perfectly synchronized with the DB and code. Use `npx prisma migrate dev` for any new models (you will need to add some for bookmarks/notes in Phase 6). Do not use `db push` moving forward.
2. **Never use `Math.random()` for scoring:** If an AI fails, throw an error and let the background job system retry it.
3. **No generic AI prompts for objective tasks:** Stick to the plan—objective tasks go through the Phase 4 deterministic scorers. Do not send "Multiple Choice" JSON payloads to DeepSeek. 
4. **Keep TypeScript Strict:** The project is currently at zero TS errors. Do not use `any` unless absolutely necessary. Validate your payloads at the boundary using Zod.

Good luck! You have a solid, honest, and type-safe foundation to build on.
