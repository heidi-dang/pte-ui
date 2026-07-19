import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

const VIEWPORTS = [
  { width: 375, height: 812, label: 'iPhone X' },
  { width: 390, height: 844, label: 'iPhone 14' },
  { width: 430, height: 932, label: 'iPhone 15 Pro Max' },
];

test.describe('Mock Exam Mobile', () => {
  for (const vp of VIEWPORTS) {
    test(`no overflow and content visible at ${vp.width}x${vp.height} (${vp.label})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE);
      await page.waitForLoadState('networkidle');
      await page.click('text=Log In');
      await page.fill('input[type="email"]', EMAIL);
      await page.fill('input[type="password"]', PASSWORD);
      await page.click('button:has-text("Sign In")');
      await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 15000 });

      // Check student dashboard
      await page.goto(`${BASE}/student/dashboard`);
      await page.waitForTimeout(2000);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('Failed to load');
      expect(bodyText.length).toBeGreaterThan(50);

      // Check practice page
      await page.goto(`${BASE}/student/practice`);
      await page.waitForTimeout(2000);
      const practiceOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(practiceOverflow).toBe(false);
      await expect(page.locator('body')).not.toContainText('Failed to load');

      // Check mock exams page
      await page.goto(`${BASE}/student/mock-exams`);
      await page.waitForTimeout(2000);
      const mockOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(mockOverflow).toBe(false);
      await expect(page.locator('body')).not.toContainText('Failed to load');
    });
  }
});
