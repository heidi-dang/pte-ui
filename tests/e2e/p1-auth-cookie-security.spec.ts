import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

async function loginAndGetCookie(page: any) {
  for (let i = 0; i < 3; i++) {
    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    if (loginRes.status() === 429) {
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }
    expect(loginRes.status()).toBe(200);
    const setCookie = loginRes.headers()['set-cookie'] || '';
    const match = setCookie.match(/pte_token=[^;]+/);
    return match ? match[0] : '';
  }
  return '';
}

test.describe('P1 Auth Cookie Security', () => {
  test('Login response sets httpOnly cookie, no token in body', async ({ page }) => {
    const response = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    if (response.status() === 429) {
      test.skip();
      return;
    }
    expect(response.status()).toBe(200);
    const headers = response.headers();
    const setCookie = headers['set-cookie'] || '';
    expect(setCookie).toContain('pte_token=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');

    const body = await response.json();
    expect(body.token).toBeUndefined();
    expect(body.user).toBeDefined();
  });

  test('Authenticated /me works with cookie after login', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /log in/i }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(3000);

    const meResponse = await page.request.get(`${BASE}/api/auth/me`);
    expect(meResponse.status()).toBe(200);
    const body = await meResponse.json();
    expect(body.email).toBe(EMAIL);
  });

  test('No pte_token in localStorage after login', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /log in/i }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(3000);

    const token = await page.evaluate(() => localStorage.getItem('pte_token'));
    expect(token).toBeNull();
  });

  test('Logout clears the auth cookie', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /log in/i }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(3000);

    const logoutRes = await page.request.post(`${BASE}/api/auth/logout`);
    expect(logoutRes.status()).toBe(200);

    const meAfter = await page.request.get(`${BASE}/api/auth/me`);
    expect(meAfter.status()).toBe(401);
  });
});
