# PTE Phase 4 — Hidden Content and Prompt Audio Boundary

## What was leaking before

- `/api/student/questions` returned raw `audioUrl` for prompt audio tasks, allowing students to access audio directly without going through the controlled playback endpoint.
- `/api/student/questions` returned `promptText` and `promptHtml` for hidden-transcript tasks (RS, RL, ASQ, SGD, SST, FIBL, HCS, MCSSL, MCMSL, SMW, HIW, WFD), leaking the transcript students should not see before/while answering.
- Attempt-start response included raw `audioUrl` in the question snapshot, bypassing playback control.
- `answerKeyJson`, `acceptedAnswers`, and `aliases` were included in the raw question data passed to the student-safe builder.
- Frontend used `activeQuestion.audioUrl` directly for controlled playback tasks.

## What is blocked now

- `audioUrl` is never included in student-safe question payloads (list or attempt-start).
- `answerKeyJson` is never included in student-safe question payloads.
- `acceptedAnswers` and `aliases` are never included in student-safe question payloads.
- Hidden-transcript tasks do not expose `promptText` or `promptHtml` in student-safe payloads.
- Prompt audio is only accessible through `/practice/attempts/:attemptId/play-prompt` endpoint.
- One-play enforcement is server-side: second play returns 403.
- Playback consumption is tracked atomically via `PracticePlaybackConsumption` table.

## Student-safe endpoints

| Endpoint | Returns | Leaks blocked |
|---|---|---|
| `GET /api/student/questions` | `StudentSafeQuestion[]` — id, taskCode, section, title, instruction, difficulty, hasPromptAudio, hasImage, responseMode, timing, optional promptText/imageUrl/options | audioUrl, answerKeyJson, acceptedAnswers, aliases, hidden transcript |
| `POST /practice/attempts/start` | `{ attemptId, deadlineAt, timing, playbackPolicy, question: StudentSafeQuestion }` | audioUrl in question, answerKey |
| `POST /practice/attempts/:id/play-prompt` | `{ audioUrl, playedCount, remainingPlays, maxPlays }` | Raw audio URL only returned after authorization and play consumption |

## Which endpoint is allowed to return prompt audio URL

Only `POST /practice/attempts/:attemptId/play-prompt` may return the prompt audio URL, and only after:

1. The attempt exists and belongs to the authenticated user.
2. The attempt is in `In_Progress` status.
3. The playback count is within `maxPlays` limit.
4. The playback consumption is atomically incremented.

## Remaining limitations

- Demo/local mode (no server attempt) still accesses `activeQuestion.audioUrl` directly, as there is no server boundary to enforce. This is acceptable for offline demo use.
- The play-prompt endpoint returns the stored `audioUrl` directly for local/dev. For production, this should return a short-lived signed S3 URL. The storage layer supports signed URLs but the play-prompt endpoint currently returns the raw URL.
- `tagsJson` and `source` are still returned in the question list endpoint for admin-facing use. They are not sensitive.
- Image URLs for DI are returned directly — they are visible prompt content that does not need access control.
