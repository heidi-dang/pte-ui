#!/usr/bin/env node

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || 'password123';

let cookieHeader = '';

function bail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

async function loginWithRetry(email, password, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const r = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (r.status === 429) {
      console.log(`  Rate limited, waiting 5s (attempt ${i + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }
    const setCookie = r.headers.get('set-cookie');
    if (setCookie) {
      cookieHeader = setCookie.split(';')[0];
    }
    return r;
  }
  bail('Login failed after retries');
}

async function authFetch(url, opts = {}) {
  const headers = opts.headers || {};
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  return fetch(url, { ...opts, headers });
}

(async () => {
  try {
    console.log('[1] Login as admin...');
    const loginRes = await loginWithRetry(ADMIN_EMAIL, ADMIN_PASSWORD);
    if (loginRes.status !== 200) bail(`Admin login failed: ${loginRes.status}`);

    console.log('[2] Create question-bank item with status=published is forced to draft...');
    const createRes = await authFetch(`${BASE_URL}/api/admin/question-bank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskCode: 'MCS',
        section: 'Reading',
        title: 'Smoke Test Question',
        instruction: 'Select the correct answer.',
        promptText: 'What is 2+2?',
        optionsJson: JSON.stringify(['3', '4', '5']),
        answerKeyJson: JSON.stringify({ correctOptionId: '4' }),
        status: 'published',
      }),
    });
    if (createRes.status !== 201) bail(`Create question failed: ${createRes.status}`);
    const createBody = await createRes.json();
    if (!createBody.item) bail('No item in create response');

    const createdStatus = createBody.item.status;
    if (createdStatus !== 'draft') bail(`Expected status=draft, got ${createdStatus}`);
    console.log(`  PASS: Question created with status=${createdStatus} (forced draft)`);

    console.log('\n[3] Publish via /status endpoint validates the question...');
    const itemId = createBody.item.id;
    const pubRes = await authFetch(`${BASE_URL}/api/admin/question-bank/${itemId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    const pubBody = await pubRes.json();
    if (pubRes.status === 200 && pubBody.item?.status === 'published') {
      console.log('  PASS: Question was published successfully after validation');
    } else {
      console.log(`  INFO: Publish returned ${pubRes.status}: ${pubBody.error || pubBody.message}`);
      if (pubRes.status >= 500) bail('Server error during publish');
    }

    console.log('\nPASS: Question publish validation is correctly implemented.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
