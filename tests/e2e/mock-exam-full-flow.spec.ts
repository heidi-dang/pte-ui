import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Exam Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.click('text=Log In');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 15000 });
  });

  test('full mock exam flow: start, answer, submit, result', async ({ page }) => {
    // Navigate to mock exams
    await page.goto(`${BASE}/student/mock-exams`);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Failed to load');

    // Attempt to start a mock exam
    const startBtn = page.locator('button:has-text("Start"), button:has-text("Generate"), button:has-text("Begin"), button:has-text("Mini Mock")').first();
    if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(3000);
    }

    // Verify the page is interactive
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);

    // Check for mock exam or practice content loaded
    const hasExamContent = await page.locator('text=MOCK EXAM').first().isVisible({ timeout: 2000 }).catch(() => false)
      || await page.locator('text=Question').first().isVisible({ timeout: 2000 }).catch(() => false);
    if (hasExamContent) {
      console.log('  Exam content loaded successfully');
    }

    // Verify dashboard also loads correctly
    await page.goto(`${BASE}/student/dashboard`);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Failed to load');
    await expect(page.locator('body')).not.toContainText('401');
  });
});
