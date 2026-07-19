# PTE Phase 7 — Question Bank Navigation and 100+ Questions Readiness

## Backend pagination design

The student question list API (`GET /api/student/questions`) now supports:

| Parameter | Type | Default | Max |
|---|---|---|---|
| taskCode | string | — | — |
| section | string | — | — |
| difficulty | string | — | — |
| search | string | — | — |
| page | int | 1 | — |
| pageSize | int | 20 | 100 |
| random | string | — | — |

Response:

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "page": 1,
    "pageSize": 20,
    "total": 105,
    "totalPages": 6,
    "filters": { "taskCode": "RA", "difficulty": "medium" }
  }
}
```

Pagination uses Prisma `skip`/`take` for efficient DB queries. Random mode loads IDs only, shuffles, then fetches by ID.

## Question counts

`GET /api/student/questions/counts` returns published question counts per task type:

```json
{ "success": true, "data": [ { "taskCode": "RA", "publishedCount": 124 }, ... ] }
```

Counts are displayed in the task sidebar. Zero-count tasks show `0` in gray.

## Frontend question navigation

PracticeEngine now separates:

- **Task selection** — sidebar buttons select task type
- **Question selection** — numbered buttons in navigation bar select specific questions
- **Pagination** — prev/next page when >20 questions exist
- **Search** — text search filters questions within the current task
- **Difficulty filter** — dropdown filters by easy/medium/hard

Navigation bar shows:
- Total question count
- Page number / total pages
- Question number buttons (up to 20 per page)
- Prev/Next question buttons
- Prev/Next task buttons

## Progress-state handling

Each question item can optionally include `progress`:

```json
{
  "status": "not_started | in_progress | submitted | completed | failed",
  "latestAttemptId": "uuid",
  "latestScore": 15,
  "latestCompletedAt": "ISO8601"
}
```

Currently progress is a per-question field available in the response type. Full implementation requires joining attempt data per question per user.

## Empty/demo boundary

- If `total === 0` for a task, the UI shows: "No published questions available for this task yet."
- If total is 0 AND demo mock data exists, it falls back to demo content with a clear warning banner.
- Demo questions cannot be submitted as real CMS questions.
- Demo content is labelled: "No published questions — showing demo content, scoring disabled."

## 100+ question readiness

- Pagination supports any number of questions per task.
- Page size defaults to 20, max 100.
- Filtering and search work within paginated results.
- Counts are dynamic (from API, not hardcoded).
- No limit-10 hardcoding in question fetching.

## Remaining limitations

- Progress status per question requires querying attempt/submission data per user — not yet implemented.
- Random mode uses JS `Math.random()` shuffle (no stable seed).
- Search uses `contains` which may be slow on very large datasets without proper indexes.
- E2E test exists as a spec file but requires running server + seeded DB.
