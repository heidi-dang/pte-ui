/**
 * Live Targeted RS/RL/DI Verification
 *
 * Submits bulk-generate with RS count 2, RL count 2, DI count 2.
 * Polls until terminal state. Fails if any batch has readyCount === 0
 * or if any batch is stuck in queued/generating/validating after timeout.
 *
 * Usage:
 *   REGRESSION_MODE=live DEEPSEEK_API_KEY=sk-... bun run scripts/regression/question-bank-worker-live-targeted.mjs
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const MAX_WAIT = 240;
const POLL_INTERVAL = 5000;

let passed = 0;
let failed = 0;
let cookieString = '';

async function api(path, opts = {}) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (cookieString) {
    headers['Cookie'] = cookieString;
  }
  const res = await fetch(url, { ...opts, headers });
  let body;
  try { body = await res.json(); } catch { body = null; }
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
  if (!token) throw new Error('Login failed: no token or cookie');
  return token;
}

function assert(condition, msg) {
  if (!condition) {
    console.error(`  FAIL: ${msg}`);
    failed++;
  } else {
    console.log(`  PASS: ${msg}`);
    passed++;
  }
}

async function pollBatch(token, batchId, timeoutSec) {
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    const { body } = await api(`/api/admin/question-bank/batches/${batchId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!body) {
      console.log('  Waiting (no response)...');
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
      continue;
    }
    if (body.status === 'completed' || body.status === 'failed' || body.status === 'partial_failed') {
      return body;
    }
    console.log(`  Waiting (${body.status})...`);
    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
  return null;
}

async function main() {
  console.log('=== Live Targeted RS/RL/DI Verification ===\n');

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY is required for live mode');
    process.exit(1);
  }

  const token = await login();
  assert(!!token, 'Admin login returns token');

  // Submit bulk-generate for RS, RL, DI
  const requestKey = crypto.randomUUID();
  console.log(`  Request key: ${requestKey}`);
  console.log('  Submitting bulk-generate (RS:2, RL:2, DI:2)...');

  const { status: genStatus, body: genBody } = await api('/api/admin/question-bank/bulk-generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      requestKey,
      difficulty: 'medium',
      topic: 'academic campus life',
      tasks: [
        { taskCode: 'RS', section: 'Speaking', count: 2 },
        { taskCode: 'RL', section: 'Speaking', count: 2 },
        { taskCode: 'DI', section: 'Speaking', count: 2 },
      ],
    }),
  });

  assert(genStatus === 200 || genStatus === 202, `bulk-generate returns 2xx (got ${genStatus})`);
  assert(genBody && genBody.success === true, 'bulk-generate success true');

  // Find the batch IDs (poll until all 3 appear)
  console.log('  Polling for batches...');
  let ourBatches = [];
  const findDeadline = Date.now() + 30000;
  while (Date.now() < findDeadline && ourBatches.length < 3) {
    await new Promise(r => setTimeout(r, 3000));
    const { body: batches } = await api('/api/admin/question-bank/batches', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (Array.isArray(batches)) {
      ourBatches = batches.filter(b => b.requestKey && b.requestKey.startsWith(requestKey));
    }
  }
  assert(ourBatches.length === 3, `Found 3 batches for requestKey (found ${ourBatches.length})`);

  console.log(`  Found ${ourBatches.length} batches: ${ourBatches.map(b => b.taskCode).join(', ')}`);

  // Poll each batch
  for (const b of ourBatches) {
    console.log(`\n  Polling ${b.taskCode} (${b.id})...`);
    const final = await pollBatch(token, b.id, MAX_WAIT);
    assert(final !== null, `${b.taskCode}: batch reached terminal state within timeout`);

    const terminalStates = ['completed', 'partial_failed', 'failed'];
    assert(terminalStates.includes(final.status), `${b.taskCode}: terminal status is ${final.status}`);

    assert(final.readyCount + final.failedCount === (b.requestedCount || 2),
      `${b.taskCode}: all candidates processed (ready=${final.readyCount}, fail=${final.failedCount})`);

    assert(final.readyCount > 0, `${b.taskCode}: readyCount > 0 (got ${final.readyCount})`);

    // Print grouped failure reasons
    const { body: detail } = await api(`/api/admin/question-bank/batches/${b.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (detail && detail.candidates) {
      const grouped = {};
      for (const c of detail.candidates) {
        const reason = c.failureReason || c.status;
        if (!grouped[reason]) grouped[reason] = { count: 0, slots: [] };
        grouped[reason].count++;
        grouped[reason].slots.push(c.slotNumber);
      }
      for (const [reason, info] of Object.entries(grouped)) {
        console.log(`    ${info.count}x ${reason} (slots: ${info.slots.join(',')})`);
      }
    }
  }

  // Check server is still alive
  const { status: healthStatus } = await api('/api/health', {});
  assert(healthStatus === 200, 'Server health check passes (process alive)');

  // Results
  console.log(`\n=== Live Targeted RS/RL/DI Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`\nFATAL: ${err.message}`);
  process.exit(1);
});
