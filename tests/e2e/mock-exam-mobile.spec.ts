import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Exam Mobile', () => {
  const widths = [375, 390, 430];

  for (const width of widths) {
    test(`no horizontal overflow at ${width}x812`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(BASE);
      await page.waitForLoadState('networkidle');
      await page.click('text=Log In');
      await page.fill('input[type="email"]', EMAIL);
      await page.fill('input[type="password"]', PASSWORD);
      await page.click('button:has-text("Sign In")');
      await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 10000 });

      await page.goto(`${BASE}/student/mock-exams`);
      await page.waitForTimeout(2000);

      // Check for horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow).toBe(false);

      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('Failed to load');
    });
  }
});
