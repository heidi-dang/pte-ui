import { ErrorCodes } from '../../src/shared/api/practice';
import type { StartAttemptData, PlayPromptData, UploadAudioData, SubmitAttemptData, GetAttemptResultData, ApiErrorPayload } from '../../src/shared/api/practice';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq<T>(actual: T, expected: T, msg: string) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

function assertNonNull<T>(val: T, msg: string): asserts val is NonNullable<T> {
  if (val == null) { failed++; console.error(`  FAIL: ${msg} — expected non-null`); }
  else { passed++; }
}

console.log('=== Practice API Contract Tests ===\n');

// ── ErrorCodes stability ──
console.log('ErrorCodes');
assertEq(ErrorCodes.ATTEMPT_NOT_FOUND_OR_FORBIDDEN, 'ATTEMPT_NOT_FOUND_OR_FORBIDDEN', 'ATTEMPT_NOT_FOUND_OR_FORBIDDEN code');
assertEq(ErrorCodes.PROMPT_PLAYBACK_LIMIT_REACHED, 'PROMPT_PLAYBACK_LIMIT_REACHED', 'PROMPT_PLAYBACK_LIMIT_REACHED code');
assertEq(ErrorCodes.PROMPT_AUDIO_NOT_AVAILABLE, 'PROMPT_AUDIO_NOT_AVAILABLE', 'PROMPT_AUDIO_NOT_AVAILABLE code');
assertEq(ErrorCodes.RESPONSE_AUDIO_MISSING, 'RESPONSE_AUDIO_MISSING', 'RESPONSE_AUDIO_MISSING code');
assertEq(ErrorCodes.ATTEMPT_EXPIRED, 'ATTEMPT_EXPIRED', 'ATTEMPT_EXPIRED code');

// ── StartAttemptData contract ──
console.log('\nStartAttemptData shape');
const startData: StartAttemptData = {
  attemptId: 'test-attempt-id',
  status: 'In_Progress',
  deadlineAt: new Date().toISOString(),
  taskCode: 'RA',
  section: 'Speaking',
  timing: { prepSeconds: 10, responseSeconds: 40 },
  playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
  question: {
    id: 'q-1',
    taskCode: 'RA',
    section: 'Speaking',
    title: 'Test',
    instruction: 'Read aloud',
    difficulty: 'medium',
    hasPromptAudio: false,
    hasImage: false,
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    responseMode: 'audio',
    timing: { prepSeconds: 10, responseSeconds: 40 },
  },
};
assert(typeof startData.attemptId === 'string', 'attemptId is string');
assert(typeof startData.status === 'string', 'status is string');
assert(typeof startData.deadlineAt === 'string' || startData.deadlineAt === null, 'deadlineAt is string|null');
assert(typeof startData.timing.prepSeconds === 'number', 'timing.prepSeconds is number');
assert(typeof startData.timing.responseSeconds === 'number', 'timing.responseSeconds is number');
assert(typeof startData.question.id === 'string', 'question.id is string');
assert(typeof startData.question.hasPromptAudio === 'boolean', 'question.hasPromptAudio is boolean');

// ── PlayPromptData contract ──
console.log('PlayPromptData shape');
const playData: PlayPromptData = {
  attemptId: 'test-id',
  playbackId: 'test-playback-id',
  audioUrl: 'https://example.com/audio.mp3',
  expiresAt: null,
  remainingPlays: 0,
  playedCount: 1,
  maxPlays: 1,
};
assert(typeof playData.attemptId === 'string', 'play.attemptId is string');
assert(typeof playData.remainingPlays === 'number', 'play.remainingPlays is number');
assert(typeof playData.playedCount === 'number', 'play.playedCount is number');

// ── UploadAudioData contract ──
console.log('UploadAudioData shape');
const uploadData: UploadAudioData = {
  attemptId: 'test-id',
  responseAudioId: 'audio-meta-id',
  status: 'In_Progress',
};
assert(typeof uploadData.responseAudioId === 'string', 'upload.responseAudioId is string');
assert(typeof uploadData.status === 'string', 'upload.status is string');

// ── SubmitAttemptData contract ──
console.log('SubmitAttemptData shape');
const submitData: SubmitAttemptData = {
  attemptId: 'test-id',
  submissionId: 'sub-id',
  status: 'Pending_Grading',
  nextAction: 'wait_for_grading',
};
assert(typeof submitData.submissionId === 'string', 'submit.submissionId is string');
assert(typeof submitData.nextAction === 'string', 'submit.nextAction is string');
const validNextActions = ['poll_result', 'wait_for_transcription', 'wait_for_grading', 'completed', 'failed'] as const;
assert(validNextActions.includes(submitData.nextAction as any), 'nextAction is valid value');

// ── GetAttemptResultData with result null ──
console.log('GetAttemptResultData — result null (pending)');
const pendingResult: GetAttemptResultData = {
  attemptId: 'test-id',
  status: 'In_Progress',
  result: null,
};
assert(pendingResult.result === null, 'pending result is null');

// ── GetAttemptResultData with result ──
console.log('GetAttemptResultData — with result');
const scoredResult: GetAttemptResultData = {
  attemptId: 'test-id',
  status: 'Completed',
  result: {
    score: 15,
    maxScore: 20,
    earnedScore: 15,
    normalizedScore: 0.75,
    scorerVersion: 'deterministic-pte-v1',
    feedback: 'Good job',
    breakdown: { details: '3/4 correct' },
    transcript: null,
    fluencyScore: null,
    pronunciationScore: null,
    grammarIssues: null,
  },
};
assert(scoredResult.result !== null, 'scored result is not null');
assert(scoredResult.result.score !== null, 'result.score is present');
assert(scoredResult.result.fluencyScore === null, 'deterministic fluencyScore is null (safe)');
assert(scoredResult.result.pronunciationScore === null, 'deterministic pronunciationScore is null (safe)');
assert(typeof scoredResult.result.maxScore === 'number', 'maxScore is number');
assert(typeof scoredResult.result.breakdown === 'object', 'breakdown is object');

// ── ApiErrorPayload contract ──
console.log('ApiErrorPayload shape');
const errorPayload: ApiErrorPayload = {
  code: ErrorCodes.PROMPT_PLAYBACK_LIMIT_REACHED,
  message: 'Playback limit exceeded (max 1)',
};
assert(typeof errorPayload.code === 'string', 'error.code is string');
assert(typeof errorPayload.message === 'string', 'error.message is string');

const errorWithDetails: ApiErrorPayload = {
  code: ErrorCodes.INVALID_RESPONSE,
  message: 'Invalid response',
  details: [{ path: 'selectedOption', message: 'Option not found' }],
};
assert(Array.isArray(errorWithDetails.details), 'error.details can be array');

// ── Speaking result with fluency/pronunciation ──
console.log('Speaking result — optional scores present');
const speakingResult: GetAttemptResultData = {
  attemptId: 'test-id',
  status: 'Completed',
  result: {
    score: 75,
    maxScore: 90,
    earnedScore: 75,
    normalizedScore: null,
    scorerVersion: 'pte-v1',
    feedback: 'Good fluency',
    breakdown: null,
    transcript: 'student spoke clearly',
    fluencyScore: 70,
    pronunciationScore: 65,
    grammarIssues: 2,
  },
};
assert(speakingResult.result !== null, 'speaking result is not null');
assert(speakingResult.result.fluencyScore === 70, 'speaking fluencyScore present');
assert(speakingResult.result.transcript !== null, 'speaking transcript present');

console.log(`\nTotal: ${passed + failed} assertions, ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All API contract tests passed.');
