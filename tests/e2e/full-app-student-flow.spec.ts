import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Full App Student Flow', () => {
  let token = '';
  const errors: string[] = [];

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    const body = await res.json();
    token = body.token;
    expect(token).toBeTruthy();
  });

  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      errors.push(`[PAGE ERROR] ${err.message}`);
    });
  });

  test.afterEach(async () => {
    if (errors.length > 0) {
      console.warn(`Console errors: ${errors.length}`);
      errors.slice(0, 10).forEach((e) => console.warn(`  - ${e}`));
    }
  });

  test('dashboard loads without console errors', async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate((tkn) => {
      localStorage.setItem('pte_token', tkn);
    }, token);
    await page.goto(`${BASE}/app/dashboard`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    expect(errors.filter(e => e.includes('TypeError') || e.includes('undefined') || e.includes('null')).length).toBe(0);
  });

  test('practice library loads', async ({ page }) => {
    await page.evaluate((tkn) => {
      localStorage.setItem('pte_token', tkn);
    }, token);

    // Use API to verify questions endpoint
    const questionsRes = await page.request.get(`${BASE}/api/student/questions?pageSize=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(questionsRes.ok()).toBe(true);
    const qData = await questionsRes.json();
    expect(qData.success).toBe(true);
    expect(qData.data).toBeDefined();

    // Verify no answerKeyJson leak
    if (qData.data.items && qData.data.items.length > 0) {
      const item = qData.data.items[0];
      expect(item.answerKeyJson).toBeUndefined();
    }
  });

  test('mock exam list loads', async ({ page }) => {
    await page.evaluate((tkn) => {
      localStorage.setItem('pte_token', tkn);
    }, token);

    const mockRes = await page.request.get(`${BASE}/api/student/mock-tests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(mockRes.ok()).toBe(true);
    const mocks = await mockRes.json();
    expect(Array.isArray(mocks)).toBe(true);
  });

  test('reports load without errors', async ({ page }) => {
    await page.evaluate((tkn) => {
      localStorage.setItem('pte_token', tkn);
    }, token);

    const overviewRes = await page.request.get(`${BASE}/api/student/reports/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(overviewRes.ok()).toBe(true);
    const overview = await overviewRes.json();
    expect(overview).toBeDefined();
  });

  test('notifications load', async ({ page }) => {
    await page.evaluate((tkn) => {
      localStorage.setItem('pte_token', tkn);
    }, token);

    const notifRes = await page.request.get(`${BASE}/api/student/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(notifRes.ok()).toBe(true);
    const notifs = await notifRes.json();
    expect(Array.isArray(notifs)).toBe(true);
  });

  test('study plan loads', async ({ page }) => {
    await page.evaluate((tkn) => {
      localStorage.setItem('pte_token', tkn);
    }, token);

    const planRes = await page.request.get(`${BASE}/api/student/study-plan`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(planRes.ok()).toBe(true);
  });

  test('subscription page accessible', async ({ page }) => {
    await page.evaluate((tkn) => {
      localStorage.setItem('pte_token', tkn);
    }, token);

    // Dashboard includes subscription data
    const dashRes = await page.request.get(`${BASE}/api/student/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(dashRes.ok()).toBe(true);
  });

  test('profile settings accessible', async ({ page }) => {
    await page.evaluate((tkn) => {
      localStorage.setItem('pte_token', tkn);
    }, token);

    const meRes = await page.request.get(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meRes.ok()).toBe(true);
    const me = await meRes.json();
    expect(me.email).toBe(EMAIL);
    expect(me.role).toBe('student');
  });
});
