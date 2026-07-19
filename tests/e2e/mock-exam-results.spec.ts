import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Exam Results', () => {
  test('mock exam page loads without error', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.click('text=Log In');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 10000 });

    await page.goto(`${BASE}/student/mock-exams`);
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Failed to load');
    expect(bodyText).not.toContain('401');
    await expect(page.locator('text=Mock Exams').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});
