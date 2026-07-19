import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Exam Results', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.click('text=Log In');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 15000 });
  });

  test('history attempt shows basic info', async ({ page }) => {
    await page.goto(`${BASE}/student/mock-exams`);
    await page.waitForTimeout(2000);

    // Check for history tab or attempt history
    const historyTab = page.locator('text=History, text=Attempts, text=Past').first();
    if (await historyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(1000);
    }

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Failed to load');
    expect(bodyText).not.toContain('401');
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('results page loads without error', async ({ page }) => {
    await page.goto(`${BASE}/student/mock-exams`);
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Failed to load');
    expect(bodyText).not.toContain('401');
  });
});
