# Mock Exam + 22 Practice Tasks — Post-Merge Closure Verification

## 1. Executive Verdict

The P0/P1 repair sequence for the mock exam and 22-practice-task system is complete. All P0 and P1 findings from the deep audit (PR #86) are closed. Code readiness is at **98/100**. Final production closure is pending a production health verification (requires `PROD_URL` access which was not available during this verification).

## 2. Merge History

| PR | Title | Merge SHA | Status |
|---|---|---|---|
| #86 | docs(audit): deep audit mock exam and practice tasks | aa12bb2 | Merged — established findings |
| #87 | fix(mock-exam): wire start/resume data into MockTestEngine (P0) | 274f25f | Merged |
| #88 | fix(mock-exam): repair PR87 CI regression | dfd48f9 | Merged |
| #89 | fix(mock-exam): repair submit answer loss and normalized grading (P1-3, P1-4, P1-5) | 0184c75 | Merged |
| #90 | fix(mock-exam): normalize grading responses (P1-4, P1-5) | 0a57eb0 | Merged |
| **#91** | **fix(mock-practice): close remaining P1 audit findings** | **d82057d** | **Merged — closes P1-6, P1-7, P1-8, P1-9** |

## 3. P0/P1 Closure Table

| ID | Finding | Closed By | Status |
|---|---|---|---|
| P0 | MockExamsPage → MockTestEngine wiring | #87 | CLOSED |
| P1-2 | Silent local fallback on save-progress failure | #87 | CLOSED |
| P1-3 | Final answer loss on submit | #89 | CLOSED |
| P1-4/P1-5 | Normalized grading consistency | #89 / follow-up | CLOSED |
| P1-6 | Production fallback questions | #91 | CLOSED |
| P1-7 | Practice search/dead route | #91 | CLOSED |
| P1-8 | Speaking timer recording | #91 | CLOSED |
| P1-9 | Renderer state loss | #91 | CLOSED |

## 4. P2 Backlog

Items deferred to P2 (not part of this closure):

- PracticeEngine.tsx component — file retained but import removed from App
- test-results/* directories — left in repo for reference
- vite chunk size warning (>500 kB) — cosmetic only
- Deployment of VPS (requires separate PR after prod health check)

## 5. Main CI Status

- **Main HEAD:** `d82057dd49e69cefe1a7d2ca908837ad8b487854`
- **Merge SHA:** `d82057dd49e69cefe1a7d2ca908837ad8b487854`
- **Main CI run:** [29717984323](https://github.com/heidi-dang/pte-ui/actions/runs/29717984323)
- **Main CI result:** `success` (all 3 jobs: Quality checks, Server smoke tests, Live server Playwright E2E)

## 6. Local Gate Results

| Gate | Result |
|---|---|
| `git checkout main && git pull --ff-only` | Passed — on `d82057d` |
| `prisma validate` | ✅ Passed |
| `prisma generate` | ✅ Passed |
| `tsc --noEmit` (lint) | ✅ Passed (0 errors) |
| `vite build` | ✅ Passed |
| `esbuild server.ts --bundle --platform=node --format=cjs` | ✅ Passed |
| `test` (package.json) | ⚠️ Requires `bun` (not available locally) — offline subset verified: `ai-provider-gate` ✅, `practice-task-contract-gate` ✅ |

## 7. Smoke Results

Minimum expected set — all require a running server and `bun`, which were not available locally. All passed in CI.

| Script | Local | CI (PR #91) | CI (main) |
|---|---|---|---|
| `mock-exam-commercial-readiness-smoke.mjs` | Not run (needs server+bun) | ✅ Passed | ✅ Passed |
| `mock-exam-api-full-flow.mjs` | Not run (needs server+bun) | ✅ Passed | ✅ Passed |
| `mock-exam-response-normalization-smoke.mjs` | Not run (needs bun) | ✅ Passed | ✅ Passed |
| `mock-practice-deep-audit-smoke.mjs` | Not run (needs server+bun) | ✅ Passed | ✅ Passed |
| `practice-submission-smoke.mjs` | Not run (needs server+bun) | ✅ Passed | ✅ Passed |
| `upload-auth-boundary.mjs` | Not run (needs server+bun) | ✅ Passed | ✅ Passed |

**Note:** `mock-exam-normalized-grading-smoke.mjs` does not exist. The renamed equivalent `mock-exam-response-normalization-smoke.mjs` exists and covers normalized grading.

Additional offline gates passed:
- `ai-provider-gate.mjs` — ✅ Passed
- `practice-task-contract-gate.mjs` — ✅ Passed (99 assertions, 99 passed)

## 8. E2E Results

Local Playwright Chromium cannot launch: `libnspr4.so` shared library missing from the verification environment (pre-existing issue). CI covers all E2E tests.

| Test | Local | CI (Live server Playwright E2E) |
|---|---|---|
| `mock-exam-entry-flow.spec.ts` | ❌ `libnspr4.so` missing | ✅ |
| `mock-exam-full-flow.spec.ts` | ❌ `libnspr4.so` missing | ✅ |
| `mock-exam-mobile.spec.ts` | ❌ `libnspr4.so` missing | ✅ |
| `mock-exam-renderers.spec.ts` | ❌ `libnspr4.so` missing | ✅ |
| `mock-exam-results.spec.ts` | ❌ `libnspr4.so` missing | ✅ |
| `live-server.spec.ts` | ❌ `libnspr4.so` missing | ✅ |

## 9. Production Health Status

**Skipped** — `PROD_URL` environment variable not set. Production verification requires a separate step with access to the deployed instance.

## 10. Remaining Risks

1. **Production health not verified.** No deployment or service-level actions taken. Requires explicit approval from Heidi.
2. **`bun` not available locally.** The verification environment uses `node` v22.22.1. Scripts that depend on `bun`'s TypeScript/ESM resolution (importing `.ts` as `.js`) cannot be run offline.
3. **Playwright system dependency missing.** `libnspr4.so` not installed — E2E browser tests rely entirely on CI.
4. **`test-results/` directory remains in repo.** These are stale Playwright artifacts from earlier failed runs. P2 clean-up item.

## 11. Final Score

**98/100** — Code readiness complete. Final 2 points require production health verification.

## 12. Next Recommended PRs

1. **Production health check & deploy** — after Heidi approval, verify `/api/health`, student route, and mock-exam route on VPS.
2. **(P2) Clean up `test-results/` artifacts** — add to `.gitignore` and remove from repo.
3. **(P2) Address vite chunk size warning** — code-split large bundles.
4. **(P2) Consider removing PracticeEngine.tsx** — file retained but no longer imported from App.
