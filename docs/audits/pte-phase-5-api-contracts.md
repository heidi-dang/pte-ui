# PTE Phase 5 — API Contract Cleanup

## Final response shapes

### Success wrapper
```json
{
  "success": true,
  "data": { ... }
}
```

### Error wrapper
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": null | object | array
  }
}
```

## Endpoint shapes

### POST /practice/attempts/start
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "status": "In_Progress",
    "deadlineAt": "ISO8601|null",
    "taskCode": "RA",
    "section": "Speaking",
    "timing": { "prepSeconds": 10, "responseSeconds": 40 },
    "playbackPolicy": { ... },
    "question": { /* StudentSafeQuestion */ }
  }
}
```

### POST /practice/attempts/:id/play-prompt
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "playbackId": "uuid-play-N",
    "audioUrl": "url|null",
    "expiresAt": "ISO8601|null",
    "remainingPlays": 0,
    "playedCount": 1,
    "maxPlays": 1
  }
}
```

### POST /practice/attempts/:id/audio-upload
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "responseAudioId": "uuid",
    "status": "In_Progress"
  }
}
```

### POST /practice/attempts/:id/submit
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "submissionId": "uuid",
    "status": "Pending_Grading",
    "nextAction": "wait_for_grading|wait_for_transcription|poll_result|completed|failed"
  }
}
```

### GET /practice/attempts/:id/result
```json
{
  "success": true,
  "data": {
    "attemptId": "uuid",
    "status": "Completed",
    "result": {
      "score": 15,
      "maxScore": 20,
      "earnedScore": 15,
      "normalizedScore": 0.75,
      "scorerVersion": "deterministic-pte-v1",
      "feedback": "3/4 correct",
      "breakdown": null,
      "transcript": null,
      "fluencyScore": null,
      "pronunciationScore": null,
      "grammarIssues": null
    } | null
  }
}
```

## Error codes

| Code | HTTP | Meaning |
|---|---|---|
| VALIDATION_ERROR | 400 | Request validation failure |
| ATTEMPT_EXPIRED | 400 | Attempt deadline passed |
| ATTEMPT_NOT_IN_PROGRESS | 400 | Wrong state for action |
| RESPONSE_AUDIO_REQUIRED | 400 | Audio task missing recording |
| RESPONSE_AUDIO_MISSING | 400 | No audio file in request |
| RESPONSE_TEXT_MISSING | 400 | Text task missing text |
| INVALID_RESPONSE | 400 | Response schema invalid |
| QUESTION_NOT_PUBLISHED | 400 | Question not published |
| PROMPT_AUDIO_NOT_AVAILABLE | 400 | Task has no prompt audio |
| PROMPT_PLAYBACK_LIMIT_REACHED | 403 | One-play limit hit |
| ATTEMPT_NOT_FOUND_OR_FORBIDDEN | 404 | Not found or wrong owner |
| QUESTION_NOT_FOUND | 404 | Question not found |
| INTERNAL_ERROR | 500 | Server-side failure |

## Status mapping

### Worker → Frontend
| Worker status | API status | Frontend UI state |
|---|---|---|
| queued → running (grade) | Pending_Deterministic → Grading → Completed/Grading_Failed | Polling result |
| queued → running (transcribe) | Pending_Transcription → Transcribing → Pending_Grading → Grading → Completed | Polling transcription |

### nextAction mapping
| Attempt status | nextAction |
|---|---|
| Pending_Transcription | wait_for_transcription |
| Pending_Deterministic / Pending_Grading | wait_for_grading |
| Completed | poll_result |
| Grading_Failed | failed |
| idempotent re-submit | poll_result |

## Frontend parsing rules

- `apiFetch` unwraps `data` from `{ success: true, data: ... }` automatically.
- `apiFetch` throws `ApiClientError` for `{ success: false, error: ... }` responses.
- Hook stores `result.score` from `data.result.score`, not from top-level.
- Deterministic results may have null fluencyScore/pronunciationScore — default safely.
- Null result is handled by `data.result?.score ?? null`.

## Remaining limitations

- The `play-prompt` endpoint returns the raw stored `audioUrl`. For production, this should be a short-lived signed URL.
- The `remainingPlays` frontend tracking is client-side optimistic; server always enforces the limit atomically.
