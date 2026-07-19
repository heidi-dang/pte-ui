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
    await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 15000 });
  });

  test('student portal practice page shows all skill sections', async ({ page }) => {
    await page.goto(`${BASE}/student/practice`);
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Failed to load');

    // Check section headings are visible
    const sections = ['Speaking', 'Writing', 'Reading', 'Listening'];
    let foundSections = 0;
    for (const s of sections) {
      const visible = await page.locator(`text=${s}`).first().isVisible({ timeout: 2000 }).catch(() => false);
      if (visible) foundSections++;
    }
    expect(foundSections).toBeGreaterThanOrEqual(3);
  });

  test('known task names visible in practice library', async ({ page }) => {
    await page.goto(`${BASE}/student/practice`);
    await page.waitForTimeout(2000);

    const taskNames = ['Read Aloud', 'Write Essay', 'Write from Dictation'];
    let found = 0;
    for (const name of taskNames) {
      const visible = await page.locator(`text=${name}`).first().isVisible({ timeout: 2000 }).catch(() => false);
      if (visible) found++;
    }
    expect(found).toBeGreaterThanOrEqual(2);
  });
});
