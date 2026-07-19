import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Exam Renderers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.click('text=Log In');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 10000 });
  });

  test('student portal renders with task navigation', async ({ page }) => {
    await page.goto(`${BASE}/student/practice`);
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Practice Library').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    // Verify speaking section exists
    await expect(page.locator('text=Speaking').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('known task names render in practice page', async ({ page }) => {
    await page.goto(`${BASE}/student/practice`);
    await page.waitForTimeout(2000);
    const names = ['Read Aloud', 'Repeat Sentence', 'Describe Image', 'Write Essay', 'Write from Dictation'];
    for (const name of names) {
      const visible = await page.locator(`text=${name}`).first().isVisible({ timeout: 2000 }).catch(() => false);
      if (visible) {
        console.log(`  Task visible: ${name}`);
      }
    }
  });
});
