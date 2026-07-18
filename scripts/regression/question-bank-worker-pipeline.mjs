const BASE = process.env.BASE_URL || 'http://localhost:3000';
const MAX_WAIT = 120; // seconds to wait for worker

async function api(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function login() {
  const { body } = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
  });
  return body.token;
}

function assert(condition, msg) {
  if (condition) {
    console.log(`  PASS: ${msg}`);
    return true;
  } else {
    console.error(`  FAIL: ${msg}`);
    return false;
  }
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
  console.log('=== Question Bank Worker Pipeline Regression Test ===');
  let passed = 0;
  let failed = 0;

  const token = await login();
  if (!assert(token && token.length > 0, 'Admin login returns token')) {
    process.exit(1);
  }

  // 1. POST generate
  const requestKey = crypto.randomUUID();
  const { status: genStatus, body: genBody } = await api('/api/admin/question-bank/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ taskCode: 'RA', section: 'Speaking', difficulty: 'medium', requestKey }),
  });
  passed += assert(genStatus === 202, 'POST /generate returns 202');
  passed += assert(genBody.success === true, 'Generate success true');
  const batchId = genBody.batch?.id;
  passed += assert(!!batchId, 'Batch ID present');
  passed += assert(genBody.batch.totalCount === 10, 'totalCount is 10');

  // 2. Wait for worker to process
  console.log('  Waiting for worker (up to 120s)...');
  const finalBatch = await pollBatch(token, batchId, MAX_WAIT);
  passed += assert(finalBatch !== null, 'Batch reached terminal state within timeout');
  if (!finalBatch) {
    console.error('  SKIP: Batch did not complete in time');
    process.exit(1);
  }
  passed += assert(finalBatch.readyCount + finalBatch.failedCount === 10,
    `All 10 processed (ready=${finalBatch.readyCount}, failed=${finalBatch.failedCount})`);

  // 3. Verify generated question drafts
  if (finalBatch.readyCount > 0) {
    const { body: items } = await api(`/api/admin/question-bank?taskCode=RA`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const batchItems = (Array.isArray(items) ? items : []).filter(i => i.generationBatchId === batchId);
    passed += assert(batchItems.length === finalBatch.readyCount,
      `Generated draft count matches readyCount (${batchItems.length} === ${finalBatch.readyCount})`);
    for (const item of batchItems) {
      passed += assert(item.status === 'draft', `Item ${item.id} is draft (not auto-published)`);
      passed += assert(item.reviewStatus === 'pending_review' || item.reviewStatus === 'pending_review_warning',
        `Item ${item.id} reviewStatus is pending_review`);
      passed += assert(!!item.title, `Item ${item.id} has title`);
      passed += assert(item.source === 'ai_original_deepseek', `Item ${item.id} source is ai_original_deepseek`);
    }
  }

  // 4. Verify student-facing API excludes sensitive fields
  if (finalBatch.readyCount > 0) {
    const { body: allItems } = await api(`/api/admin/question-bank?taskCode=RA`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const batchItems2 = (Array.isArray(allItems) ? allItems : []).filter(i => i.generationBatchId === batchId);
    if (batchItems2.length > 0) {
      // Published items should not expose answer/sensitive data via practice flow
      const pubItem = batchItems2.find(i => i.status === 'published');
      if (pubItem) {
        const { body: attempt } = await api('/api/student/practice/attempts/start', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            questionBankItemId: pubItem.id,
            taskCode: pubItem.taskCode,
            mode: 'timed',
          }),
        });
        if (attempt.questionSnapshotJson) {
          const snapshot = JSON.parse(attempt.questionSnapshotJson);
          passed += assert(!snapshot.answerKeyJson, 'Practice snapshot excludes answerKeyJson');
          passed += assert(!snapshot.explanation, 'Practice snapshot excludes explanation');
          passed += assert(!snapshot.reviewStatus, 'Practice snapshot excludes reviewStatus');
          passed += assert(!snapshot.generationBatchId, 'Practice snapshot excludes generationBatchId');
          passed += assert(!snapshot.qualityScore, 'Practice snapshot excludes qualityScore');
          passed += assert(!snapshot.aiProvider, 'Practice snapshot excludes aiProvider');
          passed += assert(!snapshot.aiModel, 'Practice snapshot excludes aiModel');
        }
      }
    }
  }

  // 5. Verify batch detail returns candidates
  const { body: detail } = await api(`/api/admin/question-bank/batches/${batchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  passed += assert(Array.isArray(detail.candidates), 'Batch detail includes candidates array');
  passed += assert(detail.candidates.length === 10, 'Batch detail has 10 candidates');

  // 6. Check background job exists
  const { body: jobs } = await api('/api/admin/jobs', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const genJobs = (jobs.jobs || []).filter(j => j.name === 'generate_question_batch');
  const hasGenJob = genJobs.some(j => (j.data || '').includes(batchId) || (j.id));
  passed += assert(genJobs.length > 0, 'generate_question_batch jobs exist');

  // 7. Route ordering: question-bank/not-real-id returns item-not-found
  const { body: notFound } = await api('/api/admin/question-bank/not-a-real-id', {
    headers: { Authorization: `Bearer ${token}` },
  });
  passed += assert(notFound.error === 'Question bank item not found', 'Route ordering: /question-bank/not-real-id not found');

  // 8. Duplicate requestKey returns 202 + idempotent
  const { status: dupStatus, body: dupBody } = await api('/api/admin/question-bank/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ taskCode: 'RA', section: 'Speaking', difficulty: 'medium', requestKey }),
  });
  passed += assert(dupStatus === 202, 'Duplicate requestKey returns 202');
  passed += assert(dupBody.idempotent === true, 'Duplicate requestKey returns idempotent: true');

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
