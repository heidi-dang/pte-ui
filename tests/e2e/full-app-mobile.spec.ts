import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Full App Mobile Responsiveness', () => {
  let token = '';
  const errors: string[] = [];

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    token = (await res.json()).token;
    expect(token).toBeTruthy();
  });

  test.beforeEach(async ({ page }) => {
    errors.length = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => errors.push(`[PAGE ERROR] ${err.message}`));
  });

  test('health endpoint responds at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const res = await page.request.get(`${BASE}/api/health`);
    expect(res.ok()).toBe(true);
  });

  test('login endpoint works at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const res = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(res.ok()).toBe(true);
  });

  test('student API endpoints work at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const endpoints = [
      '/api/student/dashboard',
      '/api/student/questions?pageSize=3',
      '/api/student/mock-tests',
      '/api/student/reports/overview',
      '/api/student/notifications',
    ];

    for (const ep of endpoints) {
      const res = await page.request.get(`${BASE}${ep}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.ok(), `${ep} should return success`).toBe(true);
    }
  });

  test('student questions response is student-safe at mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const res = await page.request.get(`${BASE}/api/student/questions?pageSize=3`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    if (data.data?.items?.length > 0) {
      const item = data.data.items[0];
      expect(item.answerKeyJson).toBeUndefined();
      expect(item.acceptedAnswers).toBeUndefined();
    }
  });

  test('no mobile-specific API errors', async () => {
    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('undefined') || e.includes('null')
      || e.includes('map is not') || e.includes('Cannot read'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('admin endpoints reject student at mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const res = await page.request.get(`${BASE}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });
});
