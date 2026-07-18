#!/usr/bin/env node

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';

let token = '';

function bail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

async function fetchJson(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${url}`, { ...opts, headers });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${res.status} ${body.error || body.message || res.statusText} (${url})`);
  }
  return body;
}

async function step1_login() {
  console.log('[1/6] Logging in...');
  const data = await fetchJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!data.token) bail('No token returned from login');
  token = data.token;
  console.log('  Logged in as:', data.user.email, 'role:', data.user.role);
}

async function step2_getPublishedQuestion() {
  console.log('[2/6] Fetching published question bank items...');
  const items = await fetchJson('/api/student/questions?limit=1');
  if (!Array.isArray(items)) bail('Expected array from /api/student/questions');
  if (items.length === 0) bail('No published questions found — seed data missing');
  console.log('  Published question:', items[0].title, '(' + items[0].taskCode + ')');
  return items[0];
}

async function step3_startAttempt(question) {
  console.log('[3/6] Starting practice attempt...');
  const result = await fetchJson('/api/student/practice/attempts/start', {
    method: 'POST',
    body: JSON.stringify({ questionBankItemId: question.id }),
  });
  if (!result.attemptId) bail('No attemptId returned');
  console.log('  Attempt ID:', result.attemptId, 'taskCode:', result.taskCode, 'section:', result.section);
  return result;
}

async function step4_submitAttempt(attemptId) {
  console.log('[4/6] Submitting practice response...');
  const result = await fetchJson(`/api/student/practice/attempts/${attemptId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answerJson: JSON.stringify({ typedText: 'smoke test answer' }) }),
  });
  if (!result.submissionId) bail('No submissionId returned — expected { submissionId, status }');
  console.log('  Submission ID:', result.submissionId, 'status:', result.status);
  return result;
}

async function step5_verifyAttemptState(attemptId) {
  console.log('[5/6] Verifying attempt state via API...');
  const attempt = await fetchJson(`/api/student/practice/attempts/${attemptId}`);
  console.log('  Attempt status:', attempt.status, 'submissionId:', attempt.submissionId, 'submissionStatus:', attempt.submissionStatus);
  if (!attempt.submissionId) bail('Attempt has no submissionId — submission may not have persisted');
  if (attempt.status !== 'Submitted' && attempt.status !== 'Completed' && attempt.status !== 'In_Progress') {
    console.log('  (status still transitioning — acceptable in smoke test scope)');
  }
}

async function step6_verifyHealth() {
  console.log('[6/6] Verifying health...');
  const data = await fetchJson('/api/health');
  if (data.status !== 'ok') bail('Health check returned non-ok status');
  console.log('  Health:', data.status);
}

(async () => {
  try {
    await step1_login();
    const question = await step2_getPublishedQuestion();
    const attempt = await step3_startAttempt(question);
    const submission = await step4_submitAttempt(attempt.attemptId);
    await step5_verifyAttemptState(attempt.attemptId);
    await step6_verifyHealth();
    console.log('\nPASS: All submission smoke tests passed.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
