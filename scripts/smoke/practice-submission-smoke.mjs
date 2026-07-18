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
  console.log('[1/5] Logging in...');
  const data = await fetchJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!data.token) bail('No token returned from login');
  token = data.token;
  console.log('  Logged in as:', data.user.email, 'role:', data.user.role);
}

async function step2_getPublishedQuestions() {
  console.log('[2/5] Fetching published question bank items...');
  const items = await fetchJson('/api/student/questions?limit=1');
  if (!Array.isArray(items)) bail('Expected array from /api/student/questions');

  if (items.length === 0) {
    console.log('  No published questions found — skipping remaining steps');
    return null;
  }
  console.log('  Published question:', items[0].title, '(' + items[0].taskCode + ')');
  return items[0];
}

async function step3_startAttempt(question) {
  console.log('[3/5] Starting practice attempt...');
  const result = await fetchJson('/api/student/practice/attempts/start', {
    method: 'POST',
    body: JSON.stringify({ questionBankItemId: question.id }),
  });
  if (!result.attemptId) bail('No attemptId returned');
  console.log('  Attempt ID:', result.attemptId, 'taskCode:', result.taskCode);
  return result.attemptId;
}

async function step4_submitAttempt(attemptId) {
  console.log('[4/5] Submitting practice response...');
  const submission = await fetchJson(`/api/student/practice/attempts/${attemptId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answerJson: JSON.stringify({ typedText: 'smoke test answer' }) }),
  });
  if (!submission.id) bail('No submission ID returned');
  console.log('  Submission ID:', submission.id, 'status:', submission.status);
}

async function step5_verifyHealth() {
  console.log('[5/5] Verifying health...');
  const data = await fetchJson('/api/health');
  if (data.status !== 'ok') bail('Health check returned non-ok status');
  console.log('  Health:', data.status);
}

(async () => {
  try {
    await step1_login();
    const question = await step2_getPublishedQuestions();
    if (question) {
      const attemptId = await step3_startAttempt(question);
      await step4_submitAttempt(attemptId);
    } else {
      console.log('  Skipping attempt/submit — no questions available');
    }
    await step5_verifyHealth();
    console.log('\nPASS: All submission smoke tests passed.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
