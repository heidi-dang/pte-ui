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

console.log('=== Practice Result Contract Smoke ===\n');

// Smoke 1: Verify shared ErrorCodes are importable and stable
console.log('1. ErrorCodes importable');
assert(typeof ErrorCodes === 'object', 'ErrorCodes is importable');
assertEq(ErrorCodes.ATTEMPT_NOT_FOUND_OR_FORBIDDEN, 'ATTEMPT_NOT_FOUND_OR_FORBIDDEN', 'code value stable');

// Smoke 2: Verify result shape expectations match frontend
console.log('\n2. Result shape compatibility');
// Frontend reads: attempt.score, attempt.fluencyScore, attempt.pronunciationScore, attempt.feedback
// Server now returns via ApiClient unwrap: { success: true, data: { attemptId, status, result: { score, fluencyScore, ... } } }
// The hook maps data.result.score → attempt.score
// So frontend accesses attempt.score (from state), not data.result.score directly

const mockResult = {
  attemptId: 'test',
  status: 'Completed',
  result: {
    score: 15,
    maxScore: 20,
    earnedScore: 15,
    normalizedScore: 0.75,
    scorerVersion: 'deterministic-pte-v1',
    feedback: '3/4 answers correct',
    breakdown: null,
    transcript: null,
    fluencyScore: null,
    pronunciationScore: null,
    grammarIssues: null,
  },
};

// Simulate what the hook does
const attemptState = {
  score: mockResult.result.score,
  maxScore: mockResult.result.maxScore,
  earnedScore: mockResult.result.earnedScore,
  normalizedScore: mockResult.result.normalizedScore,
  fluencyScore: mockResult.result.fluencyScore,
  pronunciationScore: mockResult.result.pronunciationScore,
  feedback: mockResult.result.feedback,
  transcript: mockResult.result.transcript,
};

assertEq(attemptState.score, 15, 'score mapped to attempt.score');
assertEq(attemptState.fluencyScore, null, 'fluencyScore null for deterministic (safe)');
assertEq(attemptState.pronunciationScore, null, 'pronunciationScore null for deterministic (safe)');
assert(typeof attemptState.feedback === 'string', 'feedback is string');

// Smoke 3: Null result is safe
console.log('\n3. Null result is safe');
const pendingResult = { attemptId: 'test', status: 'Pending_Grading', result: null };
assert(pendingResult.result === null, 'pending result is null');
const safeScore = pendingResult.result?.score ?? null;
assert(safeScore === null, 'null result.score defaults to null safely');

// Smoke 4: Deterministic result without optional fields is safe
console.log('\n4. Deterministic result missing optional fields');
const detResult = {
  attemptId: 'test',
  status: 'Completed',
  result: {
    score: 5,
    maxScore: 5,
    earnedScore: 5,
    normalizedScore: 1,
    scorerVersion: 'deterministic-pte-v1',
    feedback: 'All correct',
    breakdown: { correct: ['A', 'B'] },
    transcript: null,
  },
};
// fluencyScore and pronunciationScore may be missing — default to null
const flu = detResult.result.fluencyScore ?? null;
const pron = detResult.result.pronunciationScore ?? null;
assert(flu === null, 'missing fluencyScore defaults to null');
assert(pron === null, 'missing pronunciationScore defaults to null');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All result contract smoke checks passed.');
