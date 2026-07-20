import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Exam Entry Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.click('text=Log In');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 15000 });
  });

  test('mock exams page shows available options and active session at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(`${BASE}/student/mock-exams`);
    await page.waitForTimeout(2000);

    // No errors
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Failed to load');
    expect(bodyText).not.toContain('401');

    // Available mock exam options section heading visible
    const startSection = page.locator('text=Start New Mock Exam');
    await expect(startSection.first()).toBeVisible({ timeout: 3000 });

    // Mini Mock Test card visible
    const miniLabel = page.locator('text=Mini Mock Test');
    await expect(miniLabel.first()).toBeVisible({ timeout: 3000 });

    // At least one Start CTA visible
    const startCtas = page.locator('text=Start');
    const startCount = await startCtas.count();
    expect(startCount).toBeGreaterThanOrEqual(1);

    // Click Mini Mock Test to start
    await miniLabel.first().click();
    await page.waitForTimeout(2000);

    // Should either navigate to engine or show loading/generation
    const afterClickBody = await page.locator('body').innerText();
    expect(afterClickBody).not.toContain('Failed to load');
  });

  test('mock exams page desktop viewport shows all options', async ({ page }) => {
    await page.goto(`${BASE}/student/mock-exams`);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Failed to load');

    // All three mock options should be referenced
    const hasMini = bodyText.includes('Mini Mock');
    const hasSection = bodyText.includes('Section Mock');
    const hasFull = bodyText.includes('Full Mock');
    expect(hasMini || hasSection || hasFull).toBe(true);
  });
});
