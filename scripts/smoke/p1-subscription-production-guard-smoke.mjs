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
    console.log('[1] Login to establish session...');
    const loginRes = await loginWithRetry();
    if (loginRes.status !== 200) bail(`Login failed: ${loginRes.status}`);

    console.log('[2] Subscribe endpoint is accessible in dev mode...');
    const subRes = await authFetch(`${BASE_URL}/api/student/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planType: 'monthly',
        price: '29.99',
        cardNumber: '4242 4242 4242 4242',
        cardExpiry: '12/28',
        cardCvc: '123',
      }),
    });

    const subBody = await subRes.json();
    if (subRes.status === 501) {
      if (subBody.error && subBody.error.includes('disabled in production')) {
        console.log('  PASS: Subscribe blocked in production mode as expected');
      } else {
        bail(`Unexpected 501 error: ${subBody.error}`);
      }
    } else if (subRes.status === 200 || subRes.status === 201) {
      console.log('  INFO: Subscribe succeeded in dev mode (expected)');
    } else if (subRes.status === 400) {
      console.log(`  INFO: Subscribe returned expected error in dev mode: ${subBody.error}`);
    } else {
      bail(`Unexpected status from subscribe: ${subRes.status}`);
    }

    console.log('\n[3] Logout works...');
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    if (logoutRes.status !== 200) bail(`Logout failed: ${logoutRes.status}`);

    console.log('\nPASS: Subscription endpoint responding correctly.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
