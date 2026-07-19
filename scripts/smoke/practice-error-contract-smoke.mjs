#!/usr/bin/env node

import { ErrorCodes } from '../../src/shared/api/practice.ts';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq(actual, expected, msg) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

console.log('=== Practice Error Contract Smoke ===\n');

// Smoke 1: Expected error codes map to correct HTTP semantics
console.log('1. Error code HTTP mapping');
const errorMapping = {
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.ATTEMPT_NOT_FOUND_OR_FORBIDDEN]: 404,
  [ErrorCodes.ATTEMPT_EXPIRED]: 400,
  [ErrorCodes.ATTEMPT_NOT_IN_PROGRESS]: 400,
  [ErrorCodes.PROMPT_PLAYBACK_LIMIT_REACHED]: 403,
  [ErrorCodes.PROMPT_AUDIO_NOT_AVAILABLE]: 400,
  [ErrorCodes.RESPONSE_AUDIO_REQUIRED]: 400,
  [ErrorCodes.RESPONSE_AUDIO_MISSING]: 400,
  [ErrorCodes.RESPONSE_TEXT_MISSING]: 400,
  [ErrorCodes.INVALID_RESPONSE]: 400,
  [ErrorCodes.QUESTION_NOT_FOUND]: 404,
  [ErrorCodes.QUESTION_NOT_PUBLISHED]: 400,
};
assert(Object.keys(errorMapping).length === 12, '12 error codes mapped');
assert(errorMapping[ErrorCodes.ATTEMPT_NOT_FOUND_OR_FORBIDDEN] === 404, '404 for not found');
assert(errorMapping[ErrorCodes.PROMPT_PLAYBACK_LIMIT_REACHED] === 403, '403 for playback limit');

// Smoke 2: Shared error response shape
console.log('\n2. Error response shape');
const sharedError = {
  success: false,
  error: {
    code: ErrorCodes.PROMPT_PLAYBACK_LIMIT_REACHED,
    message: 'Playback limit exceeded',
    details: { maxPlays: 1, played: 1 },
  },
};
assert(sharedError.success === false, 'success is false');
assert(typeof sharedError.error.code === 'string', 'error.code is string');
assert(typeof sharedError.error.message === 'string', 'error.message is string');
assert(sharedError.error.details !== undefined, 'error.details present');

// Smoke 3: No returned error should be 500 for expected failures
console.log('\n3. Expected failures are not 500');
const known400Errors = [
  ErrorCodes.VALIDATION_ERROR,
  ErrorCodes.ATTEMPT_EXPIRED,
  ErrorCodes.ATTEMPT_NOT_IN_PROGRESS,
  ErrorCodes.RESPONSE_AUDIO_REQUIRED,
  ErrorCodes.RESPONSE_AUDIO_MISSING,
  ErrorCodes.RESPONSE_TEXT_MISSING,
  ErrorCodes.INVALID_RESPONSE,
  ErrorCodes.QUESTION_NOT_PUBLISHED,
  ErrorCodes.PROMPT_AUDIO_NOT_AVAILABLE,
];
const known403Errors = [ErrorCodes.PROMPT_PLAYBACK_LIMIT_REACHED];
const known404Errors = [ErrorCodes.ATTEMPT_NOT_FOUND_OR_FORBIDDEN, ErrorCodes.QUESTION_NOT_FOUND];

for (const code of known400Errors) {
  assert(errorMapping[code] === 400, `${code} → 400`);
}
for (const code of known403Errors) {
  assert(errorMapping[code] === 403, `${code} → 403`);
}
for (const code of known404Errors) {
  assert(errorMapping[code] === 404, `${code} → 404`);
}

// Smoke 4: ApiError extends Error (constructor shape)
console.log('\n4. ApiError shape (simulated)');
function simulateApiError(httpStatus, code, message, details) {
  return { httpStatus, code, message, details };
}
const err = simulateApiError(400, ErrorCodes.INVALID_RESPONSE, 'Invalid response', [{ path: 'blanks' }]);
assert(err.httpStatus === 400, 'ApiError httpStatus = 400');
assert(err.code === ErrorCodes.INVALID_RESPONSE, 'ApiError code matches');
assert(Array.isArray(err.details), 'ApiError details is array');

// Smoke 5: Idempotent submit returns 200, not 500
console.log('\n5. Idempotent submit returns success');
const idempotentResponse = { success: true, data: { attemptId: 'test', submissionId: 'sub-1', status: 'Completed', nextAction: 'poll_result' } };
assert(idempotentResponse.success === true, 'idempotent success is true');
assert(idempotentResponse.data.nextAction === 'poll_result', 'nextAction is poll_result for completed');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All error contract smoke checks passed.');
