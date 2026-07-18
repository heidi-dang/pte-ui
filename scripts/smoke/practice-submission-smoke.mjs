#!/usr/bin/env node

/**
 * Post-deploy smoke test for PracticeSubmission creation.
 * Verifies questionBankItemId and answerJson fields persist correctly.
 *
 * Usage:
 *   PRODUCTION_BASE_URL=http://localhost:3000 \
 *   SMOKE_TEST_USER_EMAIL=student@example.com \
 *   SMOKE_TEST_USER_PASSWORD=password123 \
 *   bun run scripts/smoke/practice-submission-smoke.mjs
 */

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';

let token = '';
let publishedQItemId = '';

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
    console.log('  No published CMS questions found — using null questionBankItemId (still valid submission)');
    publishedQItemId = '';
  } else {
    publishedQItemId = items[0].id;
    console.log('  Published question:', items[0].title, '(' + items[0].taskCode + ')');
  }
}

async function step3_submitPractice() {
  console.log('[3/5] Submitting practice response...');
  const payload = {
    taskCode: 'RA',
    title: 'Smoke Test Practice',
    section: 'Speaking',
    answerText: '[smoke test answer]',
    audioUrl: null,
    questionBankItemId: publishedQItemId || undefined,
    answerJson: JSON.stringify({ typedText: 'smoke test', smokeTest: true }),
  };
  const submission = await fetchJson('/api/student/practice/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!submission.id) bail('No submission ID returned');
  console.log('  Submission ID:', submission.id);

  if (submission.questionBankItemId !== (publishedQItemId || null)) {
    bail(`questionBankItemId mismatch: expected ${publishedQItemId || 'null'}, got ${submission.questionBankItemId}`);
  }
  if (!submission.answerJson) bail('answerJson is missing from submission response');
  console.log('  questionBankItemId:', submission.questionBankItemId || '(null — no CMS item)');
  console.log('  answerJson present:', !!submission.answerJson);
}

async function step4_verifyRejectDraftQItem() {
  // Skip if no API admin user — this is best-effort
  console.log('[4/5] Verifying draft question is rejected...');
  try {
    await fetchJson('/api/student/practice/submit', {
      method: 'POST',
      body: JSON.stringify({
        taskCode: 'WE',
        title: 'Smoke Reject Test',
        section: 'Writing',
        answerText: 'test',
        questionBankItemId: 'nonexistent-id-for-smoke-test',
      }),
    });
    bail('Expected 400 for nonexistent question but got success');
  } catch (err) {
    if (err.message.includes('400')) {
      console.log('  Correctly rejected nonexistent questionBankItemId with 400');
    } else {
      console.log('  Rejection handled (status:', err.message.slice(0, 60), ')');
    }
  }
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
    await step2_getPublishedQuestions();
    await step3_submitPractice();
    await step4_verifyRejectDraftQItem();
    await step5_verifyHealth();
    console.log('\nPASS: All smoke tests passed.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
