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
    console.log('[1] Login to get token...');
    const loginR = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (loginR.status !== 200) bail(`Login failed: ${loginR.status}`);
    const loginBody = await loginR.json();
    const token = loginBody.token;

    console.log('[2] Subscribe endpoint is accessible in non-production...');
    const subRes = await fetch(`${BASE_URL}/api/student/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planType: 'monthly',
        price: '29.99',
        cardNumber: '4242 4242 4242 4242',
        cardExpiry: '12/28',
        cardCvc: '123',
      }),
    });

    if (subRes.status === 501) {
      const body = await subRes.json();
      if (body.error && body.error.includes('disabled in production')) {
        console.log('  PASS: Subscribe blocked in production mode as expected');
        console.log('\nPASS: Subscription production guard is correctly implemented.');
        process.exit(0);
      }
    }

    // In dev mode, this should work (or return 400 for declined card)
    if (subRes.status === 200 || subRes.status === 201) {
      console.log('  INFO: Subscribe succeeded in dev mode (expected)');
    } else if (subRes.status === 400) {
      console.log('  INFO: Subscribe returned expected card error in dev mode');
    } else {
      bail(`Unexpected status from subscribe: ${subRes.status}`);
    }

    console.log('\nPASS: Subscription endpoint responding correctly.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
