import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';

test.describe('P1 Admin Publish Validation', () => {
  async function loginAndGetCookie(page: any) {
    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(loginRes.status()).toBe(200);
    const setCookie = loginRes.headers()['set-cookie'] || '';
    const match = setCookie.match(/pte_token=[^;]+/);
    return match ? match[0] : '';
  }

  test('Create question always creates as draft', async ({ page }) => {
    const cookie = await loginAndGetCookie(page);
    expect(cookie).toBeTruthy();

    const createRes = await page.request.post(`${BASE}/api/admin/question-bank`, {
      data: {
        taskCode: 'MCS',
        section: 'Reading',
        title: 'E2E Test Question',
        instruction: 'Select correct answer.',
        promptText: 'Test?',
        optionsJson: JSON.stringify(['A', 'B', 'C']),
        answerKeyJson: JSON.stringify({ correctOptionId: 'A' }),
        status: 'published',
      },
      headers: { Cookie: cookie },
    });
    expect(createRes.status()).toBe(201);
    const body = await createRes.json();
    expect(body.item.status).toBe('draft');
  });

  test('Publish via status endpoint validates completeness', async ({ page }) => {
    const cookie = await loginAndGetCookie(page);
    expect(cookie).toBeTruthy();

    const createRes = await page.request.post(`${BASE}/api/admin/question-bank`, {
      data: {
        taskCode: 'MCS',
        section: 'Reading',
        title: 'E2E Publish Test',
        instruction: 'Select.',
        promptText: 'Pick one.',
        optionsJson: JSON.stringify(['X', 'Y', 'Z']),
        answerKeyJson: JSON.stringify({ correctOptionId: 'Y' }),
      },
      headers: { Cookie: cookie },
    });
    expect(createRes.status()).toBe(201);
    const createBody = await createRes.json();
    const itemId = createBody.item.id;

    const pubRes = await page.request.patch(`${BASE}/api/admin/question-bank/${itemId}/status`, {
      data: { status: 'published' },
      headers: { Cookie: cookie },
    });

    expect(pubRes.status()).toBe(200);
    const pubBody = await pubRes.json();
    expect(pubBody.item.status).toBe('published');
  });
});
