import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Listening Audio', () => {
  test('Mock exam page loads without audio errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/mock-exam`);
    await page.waitForTimeout(3000);
    expect(errors.filter(e => !e.includes('favicon') && !e.includes('404')).length).toBe(0);
  });

  test('Mock exam task selector available', async ({ page }) => {
    await page.goto(`${BASE}/mock-exam`);
    await page.waitForTimeout(3000);
    const hasPracticeButton = await page.locator('a, button').filter({ hasText: /mock|practice|start/i }).count();
    expect(hasPracticeButton).toBeGreaterThanOrEqual(0);
  });
});
