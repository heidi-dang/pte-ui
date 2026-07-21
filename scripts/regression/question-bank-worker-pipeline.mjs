/**
 * Question Bank Worker Pipeline Regression Test
 *
 * Two modes:
 *   OFFLINE (default) — uses local server, proves failure visibility and terminal state.
 *   LIVE — requires DEEPSEEK_API_KEY, proves at least 1 generated draft passes validation.
 *
 * Usage (offline):
 *   bun run regression:question-bank-worker:offline
 *
 * Usage (live):
 *   DEEPSEEK_API_KEY=sk-... bun run regression:question-bank-worker:live
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const MAX_WAIT = 150;
const MODE = process.env.REGRESSION_MODE === 'live' ? 'live' : 'offline';

let passed = 0;
let failed = 0;
let cookieString = '';

async function api(path, opts = {}) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (cookieString) {
    headers['Cookie'] = cookieString;
  }
  const res = await fetch(url, {
    ...opts,
    headers,
  });
  const body = await res.json();
  return { status: res.status, body, headers: res.headers };
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
  });
  const body = await res.json();
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    cookieString = setCookie.split(';')[0];
  }
  let token = '';
  if (body.token) {
    token = body.token;
  } else if (cookieString) {
    const m = cookieString.match(/token=([^;]+)/);
    if (m) token = m[1];
  }
  if (!token) throw new Error('Login failed: no token or cookie returned');
  return token;
}

function assert(condition, msg) {
  if (!condition) {
    console.error(`  FAIL: ${msg}`);
    failed++;
    throw new Error(msg);
  }
  console.log(`  PASS: ${msg}`);
  passed++;
}

async function pollBatch(token, batchId, timeoutSec) {
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    const { body } = await api(`/api/admin/question-bank/batches/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (body.status === 'completed' || body.status === 'failed' || body.status === 'partial_failed') {
      return body;
    }
    await new Promise(r => setTimeout(r, 5000));
  }
  return null;
}

async function main() {
  console.log(`=== Question Bank Worker Pipeline Regression Test [${MODE.toUpperCase()}] ===`);
  const token = await login();
  assert(!!token, 'Admin login returns token');

  // ── Phase 1: Generate batch ──
  const requestKey = crypto.randomUUID();
  const { status: genStatus, body: genBody } = await api('/api/admin/question-bank/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ taskCode: 'RA', section: 'Speaking', difficulty: 'medium', requestKey }),
  });
  assert(genStatus === 202, 'POST /generate returns 202');
  assert(genBody.success === true, 'Generate success true');
  const batchId = genBody.batch?.id;
  assert(!!batchId, 'Batch ID present');
  assert(genBody.batch.totalCount === 10, 'totalCount is 10');

  // ── Phase 2: Wait for worker ──
  console.log(`  Waiting for worker (mode=${MODE}, timeout=${MAX_WAIT}s)...`);
  const finalBatch = await pollBatch(token, batchId, MAX_WAIT);
  assert(finalBatch !== null, 'Batch reached terminal state within timeout');
  assert(finalBatch.readyCount + finalBatch.failedCount === 10,
    `All 10 candidates processed (ready=${finalBatch.readyCount}, failed=${finalBatch.failedCount})`);

  // ── Phase 3: Verify terminal state ──
  assert(['completed', 'partial_failed', 'failed'].includes(finalBatch.status),
    `Batch terminal status is ${finalBatch.status}`);

  if (MODE === 'offline') {
    // Offline: expect all fail (fake provider), but no crash
    assert(finalBatch.failedCount === 10, 'Offline: all 10 candidates failed (expected, no DeepSeek)');
    assert(finalBatch.readyCount === 0, 'Offline: readyCount is 0');
    assert(finalBatch.status === 'failed', 'Offline: batch status is failed');
  }

  // ── Phase 4: Verify batch detail ──
  const { body: detail } = await api(`/api/admin/question-bank/batches/${batchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(Array.isArray(detail.candidates), 'Batch detail includes candidates array');
  assert(detail.candidates.length === 10, 'Batch detail has 10 candidates');
  assert(detail.totalCount === 10, 'Batch detail totalCount is 10');

  // ── Phase 5: Background jobs exist ──
  const { body: jobs } = await api('/api/admin/jobs', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const genJobs = (jobs.jobs || []).filter(j => j.name === 'generate_question_batch');
  assert(genJobs.length > 0, 'generate_question_batch jobs exist');
  const deadLetter = genJobs.filter(j => j.status === 'failed' && j.attempts >= (j.maxAttempts || 3));
  assert(deadLetter.length === 0, `No dead-letter jobs (found ${deadLetter.length})`);

  // ── Phase 6: Route ordering ──
  const { body: notFound } = await api('/api/admin/question-bank/not-a-real-id', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(notFound.error === 'Question bank item not found', 'Route ordering: /question-bank/not-real-id');

  // ── Phase 7: Duplicate idempotency ──
  const { status: dupStatus, body: dupBody } = await api('/api/admin/question-bank/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ taskCode: 'RA', section: 'Speaking', difficulty: 'medium', requestKey }),
  });
  assert(dupStatus === 202, 'Duplicate requestKey returns 202');
  assert(dupBody.idempotent === true, 'Duplicate requestKey returns idempotent: true');

  // ── Phase 8: Generated draft questions (Live only) ──
  if (MODE === 'live') {
    assert(finalBatch.readyCount > 0, 'Live: at least 1 candidate ready');
    const { body: items } = await api(`/api/admin/question-bank?taskCode=RA`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const batchItems = (Array.isArray(items) ? items : []).filter(i => i.generationBatchId === batchId);
    assert(batchItems.length === finalBatch.readyCount,
      `Generated draft count matches readyCount (${batchItems.length} === ${finalBatch.readyCount})`);
    for (const item of batchItems) {
      assert(item.status === 'draft', `Item ${item.id} is draft (not auto-published)`);
      assert(
        item.reviewStatus === 'pending_review' || item.reviewStatus === 'pending_review_warning',
        `Item ${item.id} reviewStatus is pending_review`,
      );
      assert(!!item.title, `Item ${item.id} has title`);
      assert(item.source === 'ai_original_deepseek', `Item ${item.id} source is ai_original_deepseek`);
    }
  }

  // ── Phase 9: Student API safety (seeded fixture, independent of DeepSeek) ──
  const { body: allItems } = await api(`/api/admin/question-bank?status=published`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const publishedItem = (Array.isArray(allItems) ? allItems : []).find(i => i.status === 'published');
  if (publishedItem) {
    const { body: attempt } = await api('/api/student/practice/attempts/start', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        questionBankItemId: publishedItem.id,
        taskCode: publishedItem.taskCode,
        mode: 'timed',
      }),
    });
    const question = attempt.question || {};
    assert(question.answerKeyJson === undefined, 'Student question excludes answerKeyJson');
    assert(question.explanation === undefined, 'Student question excludes explanation');
    assert(question.reviewStatus === undefined, 'Student question excludes reviewStatus');
    assert(question.generationBatchId === undefined, 'Student question excludes generationBatchId');
    assert(question.qualityScore === undefined, 'Student question excludes qualityScore');
    assert(question.aiProvider === undefined, 'Student question excludes aiProvider');
    assert(question.aiModel === undefined, 'Student question excludes aiModel');
    assert(question.rawOutputJson === undefined, 'Student question excludes raw AI output');
    assert(question.validationJson === undefined, 'Student question excludes validation metadata');
    assert(question.normalizedPayload === undefined, 'Student question excludes normalized AI payload');
  } else {
    console.log('  SKIP (no published question fixture available)');
  }

  // ── Results ──
  console.log(`\n=== ${MODE.toUpperCase()} Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`\nFATAL: ${err.message}`);
  process.exit(1);
});
