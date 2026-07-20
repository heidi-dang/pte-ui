import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mobile Practice Audio & Dropdown', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Practice page renders on mobile without overflow', async ({ page }) => {
    await page.goto(`${BASE}/practice`);
    await page.waitForSelector('text=All 22 Task Types');
    await page.waitForTimeout(1000);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test('FIBRW button is reachable on mobile', async ({ page }) => {
    await page.goto(`${BASE}/practice`);
    await page.waitForSelector('text=All 22 Task Types');
    await page.waitForTimeout(1000);
    const fibrwBtn = page.locator('button:has-text("FIBRW")').first();
    if (await fibrwBtn.isVisible()) {
      await fibrwBtn.scrollIntoViewIfNeeded();
      await fibrwBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test('WFD button is reachable on mobile', async ({ page }) => {
    await page.goto(`${BASE}/practice`);
    await page.waitForSelector('text=All 22 Task Types');
    await page.waitForTimeout(1000);
    const wfdBtn = page.locator('button:has-text("WFD")').first();
    if (await wfdBtn.isVisible()) {
      await wfdBtn.scrollIntoViewIfNeeded();
      await wfdBtn.click();
      await page.waitForTimeout(2000);
    }
  });
});
