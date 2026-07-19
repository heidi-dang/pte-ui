# Baseline Test Results — Student Portal Audit (Phase 0)

## Environment

- OS: Linux
- Node: v22.14.0
- npm: 10.9.2
- Database: SQLite (`file:./prisma/dev.db`)
- Date: 2026-07-19

## Commands Executed

### `npm install`
```
added 11 packages, removed 39 packages, changed 7 packages, and audited 276 packages
0 vulnerabilities
```

### `npm run lint` (tsc --noEmit)
```
PASSED — no output (zero errors)
```

### `npm run typecheck` (tsc --noEmit)
```
PASSED — no output (zero errors)
```

### `npm run format:check` (prisma format)
```
PASSED — Prisma schema formatted successfully
```

### `npm run build` (vite build + esbuild server)
```
✓ built in 16.25s
dist/index.html                   0.52 kB │ gzip:   0.33 kB
dist/assets/index-B0YDLNKe.css  77.78 kB │ gzip:  12.21 kB
dist/assets/index-C8jSV3ut.js  841.21 kB │ gzip: 223.69 kB
PASSED — Bundle produced successfully
```
Note: Bundle size warning for chunk > 500 kB.

### `npm test` (smoke + integration tests)

The test script uses `bun run` which is not available in this environment. Selected tests ran with `tsx`:

| Test | Result |
|------|--------|
| scripts/smoke/mock-exam-hardening-tests.mjs | FAIL — concurrency race condition in non-bun env |
| scripts/smoke/task-registry-gate.js | PASS — all 22 task types verified |
| scripts/smoke/stt-storage-tests.mjs | PASS — storage lifecycle audit |
| scripts/smoke/verify-migration.js | PASS — migration compatibility |
| scripts/smoke/populated-migration-test.mjs | PASS |
| scripts/smoke/ai-provider-gate.mjs | PASS |
| scripts/smoke/deepseek-smoke.mjs | PASS |
| scripts/smoke/practice-task-contract-gate.mjs | PASS |
| scripts/smoke/practice-job-chain-tests.mjs | PASS |
| scripts/smoke/practice-playback-concurrency-tests.mjs | PASS |
| scripts/smoke/practice-media-pipeline-tests.mjs | PASS |
| scripts/smoke/practice-populated-migration-test.mjs | PASS |
| scripts/integration/practice-behavioural-tests.mjs | PASS |

**Summary:** 12/13 tests pass. 1 test fails due to bun-specific concurrency timing.

### `npm run test:e2e` (Playwright)

The `package.json` has no `test:e2e` script. Tests run via `npx playwright test`.

| Test File | Result |
|-----------|--------|
| tests/e2e/live-server.spec.ts | FAIL — Chromium unable to launch (missing libnspr4.so) |
| tests/e2e/mock-journey.spec.ts | FAIL — same browser dependency issue |
| tests/e2e/practice-real-workflows.spec.ts | FAIL — same |
| tests/e2e/responsive-navigator.spec.ts | FAIL — same |
| tests/e2e/speaking-practice.spec.ts | FAIL — same |
| tests/e2e/responsive-navigator.spec.ts | 1 test passed (empty state check) |

**Summary:** 1/26 tests pass. 25 fail due to missing system library `libnspr4.so` required by Chromium headless shell. The server and API are functional (confirmed via curl).

## Baseline Assessment

### Server
- ✅ Dev server runs and responds at `localhost:3000`
- ✅ Auth endpoints work (login/register/me)
- ✅ Student API endpoints functional
- ✅ Database seeded with test data
- ✅ Background job processor running

### Frontend Build
- ✅ TypeScript compiles with zero errors
- ✅ Vite build produces production bundle
- ✅ Bundle size: 841 KB JS, 78 KB CSS

### Test Infrastructure
- ⚠️ Smoke tests require `bun` runtime (partial workaround with `tsx`)
- ⚠️ E2E tests require system libraries (`libnspr4.so`) for headless Chromium
- ⚠️ No dedicated `test:e2e` script in `package.json`
- ❌ No mobile viewport Playwright tests configured
- ❌ No keyboard navigation tests
- ❌ No accessibility tests

## Key Findings

1. **No URL router** — All navigation is state-based in `App.tsx`
2. **Monolithic components** — `MockTestEngine.tsx` (2248 lines), `LearningCentre.tsx` (875 lines)
3. **Duplicate task registries** — `PTE_TASK_TYPES` in `mockData.ts` duplicates `TASK_REGISTRY`
4. **Mock data in production** — `mockData.ts` contains fallback data used when API fails
5. **No design system** — All colours and spacing hardcoded
6. **Limited accessibility** — No explicit focus management, aria attributes, or screen reader support
7. **Missing component states** — Many components lack loading/empty/error states
8. **No student-specific navigation** — Single nav bar shared across all roles
9. **No mobile-first layout** — No bottom navigation or responsive sidebar
10. **E2E test infrastructure incomplete** — Missing system dependencies, missing mobile viewport config
