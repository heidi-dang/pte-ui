# PTE Production Readiness — Phase Index

| Phase | Branch | Commit | PR | Score | Status |
|---|---|---|---|---|---|
| Phase 1–2 | `fix/pte-production-phase-1-2-contracts-fsm` | `1c5b48a` | — | 9/10 | Accepted |
| Phase 3 | `fix/pte-production-phase-3-deterministic-scoring` | `734ce4f` | #26 | 9/10 | Accepted |
| Phase 4 | `fix/pte-production-phase-4-hidden-content-boundary` | `04b8206` | #28 | 9/10 | Accepted |
| Phase 5 | `fix/pte-production-phase-5-api-contracts` | `5d602fb` | #29 | 9/10 | Accepted |
| Phase 6 | `fix/pte-production-phase-6-cms-publish-validation` | `1aa3aee` | #30 | 9/10 | Accepted |
| Phase 7 | `fix/pte-production-phase-7-question-bank-navigation` | `e275437` | #31 | 9/10 | Accepted |
| Phase 8 | `fix/pte-production-phase-8-real-workflow-tests` | `bd4671d` | #32 | 10/10 | Accepted |
| Phase 9 | `fix/pte-production-phase-9-docs-readiness` | current | new | pending | Documentation |
| Phase 10 | pending | pending | pending | pending | Final main-branch gate |

## Phase descriptions

- **Phase 1–2:** Canonical task contracts, renderer-only frontend modules, server-authoritative attempts, practice FSM. Base contracts and attempt lifecycle.
- **Phase 3:** Deterministic scoring engine for 13 objective task types. Worker wiring, no `Pending_Deterministic` terminal state.
- **Phase 4:** Hidden content and prompt audio boundary. Student-safe question builder, controlled playback endpoint, one-play enforcement.
- **Phase 5:** API contract cleanup. Standardized response shapes, ApiError class, frontend/backend alignment.
- **Phase 6:** CMS publish validation. Task-specific answer-key schemas, asset enforcement, hidden prompt leakage block.
- **Phase 7:** Question bank navigation. Pagination, filters, counts, task/question separation, empty/demo boundary.
- **Phase 8:** Real production workflow tests. 10 proven workflows, fake STT/AI providers, no-skipped/no-false gates, readiness gate 12/12.
- **Phase 9:** Documentation rewrite. This document and `docs/pte-task-upgrade.md`.
- **Phase 10:** Final main-branch release gate. Flatten/merge stacked branches, CI against main, deployment checks.
