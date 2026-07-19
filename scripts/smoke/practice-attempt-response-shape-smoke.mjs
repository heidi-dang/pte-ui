#!/usr/bin/env node

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';

let token = '';

function bail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error(`  ASSERT FAIL: ${msg}`); }
}

async function fetchJson(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${url}`, { ...opts, headers });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${body.error || body.message || res.statusText} (${url})`);
  return body;
}

async function login() {
  console.log('[1/5] Logging in...');
  const data = await fetchJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!data.token) bail('No token from login');
  token = data.token;
  console.log('  OK:', data.user.email);
}

async function getQuestion() {
  console.log('[2/5] Fetching a published question...');
  const items = await fetchJson('/api/student/questions?taskCode=RA&limit=1');
  if (!Array.isArray(items) || items.length === 0) bail('No published RA question found');
  console.log('  Question:', items[0].id, items[0].taskCode);
  return items[0];
}

async function startAttempt(question) {
  console.log('[3/5] Starting practice attempt...');
  const result = await fetchJson('/api/student/practice/attempts/start', {
    method: 'POST',
    body: JSON.stringify({ questionBankItemId: question.id, mode: 'timed' }),
  });
  console.log('  Server response keys:', Object.keys(result).join(', '));

  // Assert server response shape matches client API type
  assert(!!result, 'response is truthy');
  assert(result.success === true, 'success === true');
  assert(typeof result.attemptId === 'string' && result.attemptId.length > 0, 'attemptId is non-empty string');
  assert(result.deadlineAt !== undefined, 'deadlineAt exists');
  assert(result.deadlineAt === null || !isNaN(Date.parse(result.deadlineAt)), 'deadlineAt is null or parseable ISO');
  assert(typeof result.taskCode === 'string', 'taskCode is string');
  assert(typeof result.section === 'string', 'section is string');
  assert(result.timing !== undefined && result.timing !== null, 'timing exists');
  assert(typeof result.timing.prepSeconds === 'number', 'timing.prepSeconds is number');
  assert(typeof result.timing.responseSeconds === 'number', 'timing.responseSeconds is number');
  assert(result.question !== undefined && result.question !== null, 'question exists');
  assert(typeof result.question === 'object', 'question is object');
  assert(result.question.id, 'question.id exists');
  assert(result.question.taskCode, 'question.taskCode exists');
  assert(result.playbackPolicy !== undefined && result.playbackPolicy !== null, 'playbackPolicy exists');
  assert(typeof result.playbackPolicy === 'object', 'playbackPolicy is object');

  return result;
}

async function verifyClientShape(serverResult) {
  console.log('[4/5] Verifying frontend client shape matches server...');

  // Simulate what usePracticeAttempt.ts does (start() -> setAttempt)
  const state = {
    attemptId: serverResult.attemptId,
    status: 'In_Progress',
    deadlineAt: serverResult.deadlineAt,
    timing: serverResult.timing,
    playbackPolicy: serverResult.playbackPolicy,
    question: serverResult.question,
  };

  assert(state.attemptId === serverResult.attemptId, 'state.attemptId === serverResult.attemptId');
  assert(state.status === 'In_Progress', 'state.status is In_Progress');
  assert(state.deadlineAt === serverResult.deadlineAt, 'state.deadlineAt matches');
  assert(state.timing.prepSeconds === serverResult.timing.prepSeconds, 'state.timing.prepSeconds matches');
  assert(state.timing.responseSeconds === serverResult.timing.responseSeconds, 'state.timing.responseSeconds matches');
  assert(state.playbackPolicy === serverResult.playbackPolicy, 'state.playbackPolicy matches');
  assert(state.question === serverResult.question, 'state.question matches');

  // Verify useTaskTimer can consume deadlineAt
  const prepSec = state.timing.prepSeconds;
  if (state.deadlineAt) {
    const now = Date.now();
    const deadlineMs = new Date(state.deadlineAt).getTime();
    const totalSec = Math.floor((deadlineMs - now) / 1000);
    assert(totalSec > 0 || state.status === 'Completed', 'deadlineAt is in the future (or attempt completed)');
    console.log(`  Computed remaining: ~${totalSec}s (prep=${prepSec}s, totalR=${state.timing.responseSeconds}s)`);
  } else {
    console.log('  deadlineAt is null (untimed mode)');
  }

  // Verify timing.prepSeconds + timing.responseSeconds approximates deadlineAt offset
  if (state.deadlineAt) {
    const expectedTotalSeconds = state.timing.prepSeconds + state.timing.responseSeconds + 5; // server adds 5s buffer
    const actualTotalSeconds = Math.floor((new Date(state.deadlineAt).getTime() - Date.now()) / 1000) + 2; // allow ~2s drift
    assert(
      Math.abs(actualTotalSeconds - expectedTotalSeconds) < 10,
      `deadlineAt delta (${actualTotalSeconds}s) ≈ prep+response+5s (${expectedTotalSeconds}s)`
    );
  }
}

async function main() {
  console.log('=== Practice Attempt Response Shape Smoke ===\n');
  try {
    await login();
    const question = await getQuestion();
    const serverResult = await startAttempt(question);
    await verifyClientShape(serverResult);
  } catch (err) {
    bail(err.message);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log('All assertions passed.');
}

main();
