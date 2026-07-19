# Student Portal UI — P2 Backlog

These items are not production blockers. They should be handled in separate small PRs.

## P2-1 — Bundle size code splitting

Current note:
- Main frontend chunk is large.

Goal:
- Lazy-load heavier student portal modules.
- Keep dashboard, practice library, and session routes fast.
- Avoid loading analytics/chart/session/media modules on unrelated routes.

Acceptance:
- Bundle report documents before/after.
- No route regression.
- Build passes.
- Student dashboard remains fast.

## P2-2 — Accessibility polish

Current note:
- Focus trapping and aria-live need deeper polish.

Goal:
- Improve modal/drawer focus trapping.
- Improve autosave/submission screen-reader announcements.
- Verify keyboard-only flows.

Acceptance:
- Keyboard navigation works through portal shell and session flow.
- Autosave and submission status have appropriate announcements.
- No critical accessibility regressions.

## P2-3 — Large dataset smoke test

Current note:
- Need stronger smoke test for large question datasets.

Goal:
- Add smoke coverage for 100+ and 250+ questions.
- Verify filtering, pagination, and mobile layout.

Acceptance:
- Large dataset test passes.
- Question browser remains responsive.
- No page-level mobile overflow.

## P2-4 — Notifications page

Current note:
- Notifications are deferred.

Goal:
- Add a production-minimum notifications page only when backend support exists.
- Avoid placeholder routes.

Acceptance:
- Real data or clear empty state.
- No fake notification data.
- Mobile responsive.
- Tests pass.

## P2-5 — Registry consolidation

Current note:
- Task registry can be further consolidated.

Goal:
- Reduce duplicate task metadata.
- Keep all 22 task types sourced from one typed registry.

Acceptance:
- Exactly 22 task types.
- No duplicate source of truth.
- Renderer mapping remains correct.
- Tests pass.
