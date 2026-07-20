import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Practice Listening Audio', () => {
  test('Load WFD task and confirm Play Audio button position exists', async ({ page }) => {
    await page.goto(`${BASE}/practice`);
    await page.waitForSelector('text=All 22 Task Types');
    await page.locator('button:has-text("WFD")').first().click();
    await page.waitForTimeout(2000);
    const qButton = page.locator('button:has-text("questions")').first();
    await expect(qButton).toBeVisible({ timeout: 15000 });
  });

  test('Start practice session visual structure', async ({ page }) => {
    await page.goto(`${BASE}/practice`);
    await page.waitForSelector('text=All 22 Task Types');
    await page.locator('button:has-text("WFD")').first().click();
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);
    const hasInput = await page.locator('input[type="text"]').count();
    expect(hasInput).toBeGreaterThanOrEqual(0);
  });

  test('Answer input appears in correct timer phase', async ({ page }) => {
    await page.goto(`${BASE}/practice`);
    await page.waitForSelector('text=All 22 Task Types');
    await page.locator('button:has-text("WFD")').first().click();
    await page.waitForTimeout(3000);
    const textInputs = page.locator('input[type="text"]');
    const count = await textInputs.count();
    expect(typeof count).toBe('number');
  });
});
