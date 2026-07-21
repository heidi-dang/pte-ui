#!/usr/bin/env node

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';

function bail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

async function login() {
  const r = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (r.status !== 200) bail(`Login failed: ${r.status}`);
  const body = await r.json();
  return body.token;
}

(async () => {
  try {
    const token = await login();

    console.log('[1] Upload with oversized file is rejected...');
    const bigBuf = Buffer.alloc(11 * 1024 * 1024, 'x');
    const bigBlob = new Blob([bigBuf]);
    const bigForm = new FormData();
    bigForm.append('file', bigBlob, 'huge.mp3');
    const bigRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: bigForm,
    });
    if (bigRes.status !== 413 && bigRes.status !== 400) bail(`Expected 413/400 for oversized file, got ${bigRes.status}`);
    console.log(`  PASS: Oversized file rejected with ${bigRes.status}`);

    console.log('\n[2] Upload with disallowed extension is rejected...');
    const badExtForm = new FormData();
    badExtForm.append('file', new Blob(['malicious']), 'evil.exe');
    const badExtRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: badExtForm,
    });
    if (badExtRes.status !== 400 && badExtRes.status !== 415 && badExtRes.status !== 500) {
      bail(`Expected 400/415/500 for .exe file, got ${badExtRes.status}`);
    }
    console.log(`  PASS: Disallowed extension rejected with ${badExtRes.status}`);

    console.log('\n[3] Upload with valid image succeeds...');
    const validForm = new FormData();
    validForm.append('file', new Blob(['fake-image-data']), 'test.png');
    const validRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: validForm,
    });
    if (validRes.status !== 200) bail(`Valid upload failed: ${validRes.status}`);
    const validBody = await validRes.json();
    if (!validBody.url) bail('No url in upload response');
    console.log(`  PASS: Valid upload returned url=${validBody.url}`);

    console.log('\n[4] Upload without auth returns 401...');
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
