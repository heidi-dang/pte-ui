import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('P1 Subscription Production Guard', () => {
  async function loginAndGetCookie(page: any) {
    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(loginRes.status()).toBe(200);
    const setCookie = loginRes.headers()['set-cookie'] || '';
    const match = setCookie.match(/pte_token=[^;]+/);
    return match ? match[0] : '';
  }

  test('Subscribe endpoint is reachable in dev mode', async ({ page }) => {
    const cookie = await loginAndGetCookie(page);
    expect(cookie).toBeTruthy();

    const subRes = await page.request.post(`${BASE}/api/student/subscribe`, {
      data: {
        planType: 'monthly',
        price: '29.99',
        cardNumber: '4242 4242 4242 4242',
        cardExpiry: '12/28',
        cardCvc: '123',
      },
      headers: { Cookie: cookie },
    });

    expect(subRes.status()).not.toBe(501);
  });

  test('Upgrade-premium endpoint allows upgrade', async ({ page }) => {
    const cookie = await loginAndGetCookie(page);
    expect(cookie).toBeTruthy();

    const upgradeRes = await page.request.post(`${BASE}/api/student/upgrade-premium`, {
      headers: { Cookie: cookie },
    });
    expect(upgradeRes.status()).toBe(200);
  });
});
