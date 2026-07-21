import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('P1 Subscription Production Guard', () => {
  test('Subscribe endpoint is reachable in dev mode', async ({ page }) => {
    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();

    const subRes = await page.request.post(`${BASE}/api/student/subscribe`, {
      data: {
        planType: 'monthly',
        price: '29.99',
        cardNumber: '4242 4242 4242 4242',
        cardExpiry: '12/28',
        cardCvc: '123',
      },
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });

    // In dev mode should get 400 (card declined) or 200/201 (success) — not 501
    expect(subRes.status()).not.toBe(501);
  });

  test('Upgrade-premium endpoint allows upgrade', async ({ page }) => {
    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();

    const upgradeRes = await page.request.post(`${BASE}/api/student/upgrade-premium`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    expect(upgradeRes.status()).toBe(200);
  });
});
