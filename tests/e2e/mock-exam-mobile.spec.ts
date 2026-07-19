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
    test(`full flow at ${vp.width}x${vp.height} (${vp.label})`, async ({ page, request }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Login via API to get token, then set it in localStorage
      const loginRes = await request.post(`${BASE}/api/auth/login`, {
        data: { email: EMAIL, password: PASSWORD },
      });
      const loginData = await loginRes.json();
      const token = loginData.token;
      expect(token).toBeTruthy();

      await page.goto(BASE);
      await page.evaluate((t) => localStorage.setItem('pte_token', t), token);
      await page.goto(`${BASE}/student/dashboard`);
      await page.waitForTimeout(2000);

      // No overflow
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);
      console.log(`  Dashboard: no overflow`);

      // Mock exams page
      await page.goto(`${BASE}/student/mock-exams`);
      await page.waitForTimeout(2000);
      const mockOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(mockOverflow).toBe(false);
      const mockBody = await page.locator('body').innerText();
      expect(mockBody).not.toContain('Failed to load');
      expect(mockBody).not.toContain('401');
      expect(mockBody.length).toBeGreaterThan(50);

      // Practice page
      await page.goto(`${BASE}/student/practice`);
      await page.waitForTimeout(2000);
      const practiceOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(practiceOverflow).toBe(false);
      const practiceBody = await page.locator('body').innerText();
      expect(practiceBody).not.toContain('Failed to load');

      // Verify some UI is usable on practice page
      const speakingVisible = await page.locator('text=Speaking').first().isVisible({ timeout: 2000 }).catch(() => false);
      if (speakingVisible) console.log('  Speaking section visible');

      console.log(`  ${vp.label}: all checks passed`);
    });
  }
});
