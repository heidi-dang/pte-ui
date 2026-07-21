import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('P1 Auth Cookie Security', () => {
  test('Login response sets httpOnly cookie', async ({ page }) => {
    const response = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(response.status()).toBe(200);
    const headers = response.headers();
    const setCookie = headers['set-cookie'] || '';
    expect(setCookie).toContain('pte_token=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
  });

  test('Authenticated /me works with cookie', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    const meResponse = await page.request.get(`${BASE}/api/auth/me`);
    expect(meResponse.status()).toBe(200);
    const body = await meResponse.json();
    expect(body.email).toBe(EMAIL);
  });

  test('No token in localStorage after login', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    const token = await page.evaluate(() => localStorage.getItem('pte_token'));
    expect(token).toBeNull();
  });
});
