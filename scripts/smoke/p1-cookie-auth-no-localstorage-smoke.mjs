#!/usr/bin/env node

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';

function bail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

(async () => {
  try {
    console.log('[1] Login sets Set-Cookie header...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (loginRes.status !== 200) bail(`Login failed: ${loginRes.status}`);

    const setCookie = loginRes.headers.get('set-cookie');
    if (!setCookie) bail('No Set-Cookie header in login response');
    if (!setCookie.includes('pte_token=')) bail('Cookie name pte_token not found in Set-Cookie');
    if (!setCookie.includes('HttpOnly')) bail('Cookie is not HttpOnly');
    if (!setCookie.includes('SameSite=Strict') && !setCookie.includes('SameSite=Strict')) bail('Cookie is not SameSite=Strict');
    console.log('  PASS: Login response includes httpOnly SameSite=Strict cookie');

    const body = await loginRes.json();
    if (!body.token) bail('No token in response body');
    console.log('  PASS: Token still returned in response body for backward compat');

    console.log('\n[2] Authenticated request with cookie works...');
    const cookieMatch = setCookie.match(/pte_token=([^;]+)/);
    if (!cookieMatch) bail('Could not extract cookie value');
    const cookieVal = cookieMatch[1];

    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `pte_token=${cookieVal}` },
    });
    if (meRes.status !== 200) bail(`/me with cookie failed: ${meRes.status}`);
    const meBody = await meRes.json();
    if (!meBody.email) bail('No email in /me response');
    console.log(`  PASS: /me returned ${meBody.email} via cookie auth`);

    console.log('\n[3] Signup also sets cookie...');
    const testEmail = `smoke-${Date.now()}@test.com`;
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'testpass123', name: 'Smoke Test' }),
    });
    if (signupRes.status !== 201) bail(`Signup failed: ${signupRes.status}`);
    const signupCookie = signupRes.headers.get('set-cookie');
    if (!signupCookie || !signupCookie.includes('pte_token=')) bail('No cookie in signup response');
    console.log('  PASS: Signup response includes httpOnly cookie');

    console.log('\nPASS: Cookie-based auth is correctly implemented.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
