import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('P1 Admin Publish Validation', () => {
  test('Create question always creates as draft', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    const createRes = await page.request.post(`${BASE}/api/admin/question-bank`, {
      data: {
        taskCode: 'MCS',
        section: 'Reading',
        title: 'E2E Test Question',
        instruction: 'Select correct answer.',
        promptText: 'Test?',
        optionsJson: ['A', 'B', 'C'],
        answerKeyJson: JSON.stringify({ correctOptionId: 'A' }),
        status: 'published',
      },
    });
    expect(createRes.status()).toBe(201);
    const body = await createRes.json();
    expect(body.item.status).toBe('draft');
  });

  test('Publish via status endpoint validates completeness', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    const createRes = await page.request.post(`${BASE}/api/admin/question-bank`, {
      data: {
        taskCode: 'MCS',
        section: 'Reading',
        title: 'E2E Publish Test',
        instruction: 'Select.',
        promptText: 'Pick one.',
        optionsJson: ['X', 'Y', 'Z'],
      },
    });
    expect(createRes.status()).toBe(201);
    const createBody = await createRes.json();
    const itemId = createBody.item.id;

    const pubRes = await page.request.patch(`${BASE}/api/admin/question-bank/${itemId}/status`, {
      data: { status: 'published' },
    });

    expect(pubRes.status()).toBe(200);
    const pubBody = await pubRes.json();
    expect(pubBody.item.status).toBe('published');
  });
});
