# Phase 7 Start

## Baseline
- Branch: feat/phase-7
- Starting SHA: cd58a20
- Source: docs/practice-engine.md lines 114-119 + src/server/aiService.ts

## Phase 7 Scope
Per docs/practice-engine.md:
- Real DeepSeek API scoring
- Subskill analytics display
- Detailed feedback and improvement suggestions
- Score tracking across attempts

## First Implementation Slice
1. Add POST /api/student/practice/:id/score endpoint calling evaluateSubmission()
2. Wire scoring call into PracticeEngine after successful submission
3. Replace placeholder result screen with real score + feedback display
4. Save real score to attempt history

## Files expected to change
- src/server/student.ts (new scoring endpoint)
- src/server/aiService.ts (may add promptText to evaluateSubmission)
- src/components/PracticeEngine.tsx (wire scoring, display results)
- src/shared/routes.ts (new route constant)
- src/api/student.api.ts (new API helper)
- docs/practice-engine.md (update Phase 7 status)

## Risks
- DeepSeek API may not have key configured (local fallback exists)
- Scoring adds latency to submit flow (handle with loading state)
- Non-JSON DeepSeek responses (existing error handling in aiService.ts)

## Regression guards
- bun run smoke:practice-submission
- bun run smoke:upload-auth-boundary
- bun run lint
- bun run build
- npx prisma validate
