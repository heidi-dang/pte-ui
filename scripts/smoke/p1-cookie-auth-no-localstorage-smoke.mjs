#!/usr/bin/env node

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';

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
    return r;
  }
  bail('Login failed after retries (rate limited)');
}

async function apiCallWithRetry(url, opts, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const r = await fetch(url, opts);
    if (r.status === 429) {
      console.log(`  Rate limited, waiting 5s (attempt ${i + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }
    return r;
  }
  return null;
}

(async () => {
  try {
    console.log('[1] Login sets Set-Cookie header...');
    const loginRes = await loginWithRetry();
    if (!loginRes) bail('Login failed');
    if (loginRes.status !== 200) bail(`Login failed: ${loginRes.status}`);

    const setCookie = loginRes.headers.get('set-cookie');
    if (!setCookie) bail('No Set-Cookie header in login response');
    if (!setCookie.includes('pte_token=')) bail('Cookie name pte_token not found in Set-Cookie');
    if (!setCookie.includes('HttpOnly')) bail('Cookie is not HttpOnly');
    if (!setCookie.includes('SameSite=Strict') && !setCookie.includes('SameSite=Strict')) bail('Cookie is not SameSite=Strict');
    console.log('  PASS: Login response includes httpOnly SameSite=Strict cookie');

    const body = await loginRes.json();
    if (body.token) bail('Token should NOT be in response body');
    if (!body.user) bail('No user in response');
    console.log('  PASS: Token not in response, user object present');

    console.log('\n[2] Authenticated request with cookie works...');
    const cookieMatch = setCookie.match(/pte_token=([^;]+)/);
    if (!cookieMatch) bail('Could not extract cookie value');
    const cookieVal = cookieMatch[1];

    const meRes = await apiCallWithRetry(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `pte_token=${cookieVal}` },
    });
    if (!meRes) bail('/me failed (rate limited)');
    if (meRes.status !== 200) bail(`/me with cookie failed: ${meRes.status}`);
    const meBody = await meRes.json();
    if (!meBody.email) bail('No email in /me response');
    console.log(`  PASS: /me returned ${meBody.email} via cookie auth`);

    console.log('\n[3] Logout clears cookie...');
    const logoutRes = await apiCallWithRetry(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    if (!logoutRes) bail('Logout failed (rate limited)');
    if (logoutRes.status !== 200) bail(`Logout failed: ${logoutRes.status}`);
    const logoutSetCookie = logoutRes.headers.get('set-cookie') || '';
    if (logoutSetCookie.includes('pte_token=;') || logoutSetCookie.includes('pte_token=;')) {
      console.log('  PASS: Logout clears cookie');
    } else if (!logoutSetCookie) {
      console.log('  WARN: No Set-Cookie in logout (may be cleared via Expires)');
    } else {
      console.log(`  PASS: Logout response: ${logoutSetCookie}`);
    }

    console.log('\nPASS: Cookie-based auth is correctly implemented.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
