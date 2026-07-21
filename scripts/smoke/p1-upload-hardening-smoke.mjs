#!/usr/bin/env node

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';

let cookieHeader = '';

function bail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

async function loginWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    const r = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
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
    const loginRes = await loginWithRetry();
    if (loginRes.status !== 200) bail(`Login failed: ${loginRes.status}`);

    console.log('[1] Upload with oversized file is rejected...');
    const bigBuf = new Uint8Array(11 * 1024 * 1024);
    const bigBlob = new Blob([bigBuf], { type: 'audio/mpeg' });
    const bigForm = new FormData();
    bigForm.append('file', bigBlob, 'huge.mp3');
    const bigRes = await authFetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: bigForm,
    });
    console.log(`  Upload oversized returned ${bigRes.status}`);
    if (bigRes.status !== 413) bail(`Expected 413 for oversized file, got ${bigRes.status}`);
    console.log('  PASS: Oversized file rejected with 413');

    console.log('\n[2] Upload with disallowed extension (.exe) is rejected...');
    const badExtForm = new FormData();
    badExtForm.append('file', new Blob(['malicious'], { type: 'application/octet-stream' }), 'evil.exe');
    const badExtRes = await authFetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: badExtForm,
    });
    console.log(`  Upload .exe returned ${badExtRes.status}`);
    if (badExtRes.status !== 415) bail(`Expected 415 for .exe file, got ${badExtRes.status}`);
    console.log('  PASS: .exe rejected with 415');

    console.log('\n[3] Upload with disallowed extension (.html) is rejected...');
    const htmlForm = new FormData();
    htmlForm.append('file', new Blob(['<script>alert(1)</script>'], { type: 'text/html' }), 'bad.html');
    const htmlRes = await authFetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: htmlForm,
    });
    console.log(`  Upload .html returned ${htmlRes.status}`);
    if (htmlRes.status !== 415) bail(`Expected 415 for .html file, got ${htmlRes.status}`);
    console.log('  PASS: .html rejected with 415');

    console.log('\n[4] Upload with valid PNG succeeds...');
    const validForm = new FormData();
    validForm.append('file', new Blob(['fake-png-data'], { type: 'image/png' }), 'test.png');
    const validRes = await authFetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      body: validForm,
    });
    if (validRes.status !== 200) bail(`Valid upload failed: ${validRes.status}`);
    const validBody = await validRes.json();
    if (!validBody.url) bail('No url in upload response');
    console.log(`  PASS: Valid upload returned url=${validBody.url}`);

    console.log('\n[5] Upload without auth returns 401...');
    const noAuthRes = await fetch(`${BASE_URL}/api/upload`, { method: 'POST' });
    if (noAuthRes.status !== 401) bail(`Expected 401, got ${noAuthRes.status}`);
    console.log('  PASS: Unauthenticated upload rejected with 401');

    console.log('\nPASS: Upload hardening is correctly implemented.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
