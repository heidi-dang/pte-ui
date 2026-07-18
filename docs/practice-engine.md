# Practice Engine

## Overview

The PracticeEngine provides a production-grade practice flow for all 22 PTE task codes. It loads published questions from the Question Bank CMS first, falling back to local static content when no CMS questions are available.

---

## Content Loading Strategy

### CMS-first loading

1. On task code change, fetches `GET /api/student/questions?taskCode=<code>&limit=10`
2. If published CMS questions exist, they are used as the primary content source
3. A "CMS Content" badge appears in the header when CMS questions are active
4. If no CMS questions exist for the selected task code, falls back to existing local sample content

### Fallback

- If the API call fails or returns an empty array, the engine falls back to `PRACTICE_ITEMS_LIST` from `src/data/mockData.ts`
- No blank screen or fake success is presented
- Fallback content is clearly marked (no "CMS Content" badge)

---

## Task Renderer Foundation

All 22 PTE task codes from `src/types.ts` are handled:

### Speaking (vocal recorder)
- RA, RS, DI, RL, ASQ, SGD, RTS — microphone wave simulator with real MediaRecorder + fallback voice level visualizer

### Writing (textarea)
- SWT, WE — rich text textarea with word/character count
- SST — textarea for summarization

### Reading
- MCS, MCM — single/multi select option buttons
- ROP — draggable/reorderable list with Up/Down buttons
- FIBR, FIBRW — text split at blank markers with select dropdowns
- HIW — clickable word tokens with highlight toggle

### Listening
- MCMSL, MCSSL, HCS, SMW — single/multi select option buttons
- FIBL — dropdown blanks
- WFD — single-line input

### Reusable patterns
- Text prompt display (from `promptText` or CMS field)
- Passage display (from CMS `passageText`, currently unused by frontend but available)
- Image display (from CMS `imageUrl`)
- Audio URL placeholder (HTML `<audio>` when CMS `audioUrl` exists)
- Options display (from CMS `optionsJson`, parsed to array)

---

## Answer State & Submit Payload

### Submission flow

1. Answer is captured from the active task-type renderer
2. Backend submission is attempted via `submitPracticeResponse()` (uses `ROUTES.STUDENT_PRACTICE_SUBMIT`)
3. **On success:** local attempt is saved, draft is cleared, success screen is shown
4. **On failure:** a visible retryable error is shown, draft is NOT cleared, user can retry

### Captured answer shape

```json
{
  "questionBankItemId": "clx...",
  "taskCode": "WE",
  "title": "Task title",
  "section": "Writing",
  "answerText": "User typed text...",
  "audioUrl": null,
  "answerJson": {
    "typedText": "User typed text...",
    "selectedOption": "A",
    "selectedMultiple": ["A", "C"],
    "reorderedList": ["B", "A", "C"],
    "blanks": { "1": "word1", "2": "word2" },
    "highlightedIncorrect": ["was", "been"]
  }
}
```

### Backend validation

- `questionBankItemId` (if provided) must reference an existing `published` question
- Draft and archived question IDs are rejected with `400`
- All fields are optional except `taskCode`, `title`, `section`
- `audioUrl` submits `null` unless a real uploaded audio URL exists — fake hardcoded audio URLs are never submitted

---

## Audio Recording

Microphone recording is captured locally using `navigator.mediaDevices.getUserMedia` and `MediaRecorder`. The resulting blob URL is available for local playback but is **not** uploaded to the server in this phase. Audio upload and server-side scoring integration will be completed in the scoring phase.

The submit payload sends `audioUrl: null` for speaking tasks unless a real uploaded URL exists. No fake hardcoded URLs (e.g., `/uploads/mock-student-recording.wav`) are submitted.

---

## What is NOT Scored Yet

This phase does **not** include AI scoring. After submission:
- Response is saved to the backend
- A simple "Practice response recorded" confirmation is shown
- The sample answer from the question (if available) is displayed for self-review
- Tags and topics from the question are shown

---

## What Phase 7 Will Add

- Real DeepSeek API scoring
- Subskill analytics display
- Detailed feedback and improvement suggestions
- Score tracking across attempts

---

## Production Safety

- CMS draft or archived questions are never loaded for practice
- `answerKeyJson` is never returned to student endpoints
- Sample answer is shown only after submission, as learning feedback
- No fake AI scoring claims ("AI scored", "official PTE score", etc.)
- Existing auth, billing, teacher, admin, CMS, and deployment flows are unchanged

---

## Renderer Map

| Task Code | Renderer Type | Prompt | Options | Audio | Image | Answer |
|-----------|--------------|--------|---------|-------|-------|--------|
| RA | Microphone | Text | — | — | — | Audio |
| RS | Microphone | Text | — | Audio | — | Audio |
| DI | Microphone | Text | — | — | Yes | Audio |
| RL | Microphone | Text | — | Audio | — | Audio |
| ASQ | Microphone | Text | — | Audio | — | Audio |
| SGD | Microphone | Text | — | — | — | Audio |
| RTS | Microphone | Text | — | — | — | Audio |
| SWT | Textarea | Text | — | — | — | Text |
| WE | Textarea | Text | — | — | — | Text |
| SST | Textarea | Text | — | Audio | — | Text |
| MCS(R) | Buttons | Text | Yes | — | — | Selection |
| MCM(R) | Buttons | Text | Yes | — | — | Selections |
| ROP | Reorder | Text | Yes | — | — | Order |
| FIBR | Dropdowns | Text | Blanks | — | — | Blanks |
| FIBRW | Dropdowns | Text | Blanks | — | — | Blanks |
| MCMSL | Buttons | Text | Yes | Audio | — | Selection |
| MCSSL | Buttons | Text | Yes | Audio | — | Selection |
| HCS | Buttons | Text | Yes | Audio | — | Selection |
| SMW | Buttons | Text | Yes | Audio | — | Selection |
| FIBL | Dropdowns | Text | Blanks | Audio | — | Blanks |
| HIW | Click | Text | Words | Audio | — | Tags |
| WFD | Input | Text | — | Audio | — | Text |
