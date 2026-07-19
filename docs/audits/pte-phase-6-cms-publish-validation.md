# PTE Phase 6 — CMS Publish Validation

## Validation architecture

Publish validation is enforced at the API layer in `admin.ts` before any question can transition to `published` status. The validation module `publishValidation.ts` provides:

1. **Answer-key schemas** — Zod schemas for every deterministic task type, ensuring answer keys have the correct structure.
2. **`validatePublishableQuestion()`** — Full validation function that checks question schema, required assets, answer keys, hidden prompt rules, and cross-field consistency.
3. **Structured issues** — Returns `PublishValidationResult` with `canPublish` boolean and `issues[]` array.

## Required fields by task

| Task | Schema | Required assets | Answer key |
|---|---|---|---|
| RA | textQuestion | — | — |
| RS | audioQuestion | audioUrl | — |
| DI | imageQuestion | imageUrl | — |
| RL | audioQuestion | audioUrl | — |
| ASQ | audioQuestion | audioUrl | acceptedAnswers[] |
| SGD | audioQuestion | audioUrl | — (warning) |
| RTS | textQuestion | — | — |
| SWT | textQuestion | — | — |
| WE | textQuestion | — | — |
| MCS | optionsQuestion | options (≥2) | correctOptionId |
| MCM | optionsQuestion | options (≥2) | correctOptionIds[] |
| ROP | optionsJson | options (≥2) | correctOrder[] |
| FIBR | blanksQuestion | options | blanks[{id, acceptedAnswers[]}] |
| FIBRW | blanksQuestion | options | blanks[{id, acceptedAnswers[]}] |
| SST | audioQuestion | audioUrl | — |
| FIBL | audio+prompt | audioUrl | blanks[{id, acceptedAnswers[]}] |
| HCS | audioOptionsQuestion | audioUrl, options | correctOptionId |
| MCSSL | audioOptionsQuestion | audioUrl, options | correctOptionId |
| MCMSL | audioOptionsQuestion | audioUrl, options | correctOptionIds[] |
| SMW | audioOptionsQuestion | audioUrl, options | correctOptionId |
| HIW | audio+prompt | audioUrl | incorrectTokenPositions[] |
| WFD | audioQuestion | audioUrl | referenceText |

## Asset requirements

- `requiresPromptAudio` → `audioUrl` required
- `requiresImage` → `imageUrl` required

## Hidden prompt validation

For tasks where `playbackPolicy.revealTranscript === false`, the `promptText` field must not contain the actual transcript. These tasks are:

- RS, RL, ASQ, SGD: promptText must be empty (audio-only)
- SST, FIBL, HCS, MCSSL, MCMSL, SMW, HIW, WFD: promptText may contain visible instructions but NOT the answer transcript

Publishing a hidden-prompt task with exposed transcript text returns a `HIDDEN_PROMPT_EXPOSED` error.

## Publish failure behavior

- Draft can be saved with validation warnings.
- Publish (status → `published`) requires `canPublish === true`.
- On failure, API returns `QUESTION_NOT_PUBLISHABLE` error with `issues[]` array.
- Admin UI shows validation errors and warnings.

## Admin UI behavior

The admin publish endpoint returns structured issues. The admin UI displays:

- Publish readiness status
- Errors by field
- Missing assets
- Validation error messages

## Remaining limitations

- AI-generated candidates enter draft state only. They must pass full validation before publish.
- Some AI-scored tasks (SWT, WE, SGD) have optional answer-key validation as warnings, not errors.
- The admin UI currently shows only error messages inline (not a dedicated validation panel).
- Image URL validation checks existence, not accessibility.
