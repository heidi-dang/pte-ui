#!/usr/bin/env node

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';

let cookieHeader = '';

function bail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

async function fetchJson(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (cookieHeader) headers['Cookie'] = cookieHeader;
  const res = await fetch(`${BASE_URL}${url}`, { ...opts, headers });
  try { return { status: res.status, body: await res.json() }; }
  catch { bail(`Non-JSON response at ${url}: ${res.status}`); }
}

(async () => {
  try {
    // 1 — Login must NOT require auth
    console.log('[1] Login (public route) should succeed without auth...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (loginRes.status !== 200) bail(`Login failed with ${loginRes.status}`);
    const loginBody = await loginRes.json();
    if (loginBody.token) bail('Token in login response body (must use httpOnly cookie)');
    const setCookie = loginRes.headers.get('set-cookie');
    if (!setCookie) bail('No Set-Cookie header in login response');
    const match = setCookie.match(/pte_token=[^;]+/);
    if (!match) bail('No pte_token cookie set');
    cookieHeader = match[0];
    console.log('  PASS: login set httpOnly cookie (no token in body)');

    // 2 — Forgot-password must NOT require auth
    console.log('[2] Forgot-password (public route) should succeed without auth...');
    let r = await fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@example.com' }),
    });
    if (r.status !== 200) bail(`Forgot-password returned ${r.status} (expected 200 for public route)`);
    console.log('  PASS: forgot-password is public');

    // 3 — /api/upload WITHOUT cookie should fail
    console.log('[3] /api/upload without cookie should 401...');
    r = await fetchJson('/api/upload', { method: 'POST' });
    if (r.status !== 401) bail(`Unauthenticated upload returned ${r.status} (expected 401)`);
    console.log('  PASS: upload requires cookie');

    // 4 — /api/upload WITH cookie should not 401 (even if it errors for other reasons)
    console.log('[4] /api/upload with cookie should pass auth...');
    r = await fetchJson('/api/upload', { method: 'POST' });
    if (r.status === 401) bail('Authenticated upload returned 401');
    console.log(`  PASS: upload with cookie returned ${r.status} (not 401)`);

    // 5 — Other /api/* routes must remain public (not require cookie)
    console.log('[5] Other API routes should not require cookie...');
    cookieHeader = '';
    r = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (r.status === 401) bail('Login requires auth — should be public');
    console.log('  PASS: /api/auth/login is public');

    console.log('\nPASS: Upload auth boundary is correctly enforced.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
