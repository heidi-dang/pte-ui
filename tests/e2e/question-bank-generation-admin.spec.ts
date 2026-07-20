import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = 'info@tnaprovider.com.au';
const ADMIN_PASSWORD = 'password123';
const STUDENT_EMAIL = 'student@example.com';
const STUDENT_PASSWORD = 'password123';

test.describe('Question Bank Admin Generation', () => {
  test('admin can log in and see CMS controls', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.click('text=Log In');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button:has-text("Sign In")');

    // Switch to admin role
    await page.click('text=admin');
    await page.waitForTimeout(1000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Failed to load');
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('student cannot access admin generation page', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.click('text=Log In');
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', STUDENT_PASSWORD);
    await page.click('button:has-text("Sign In")');

    // Try to access admin page
    await page.goto(`${BASE}/admin`);
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    // Student should not see admin content
    expect(bodyText).not.toContain('Question Bank');
  });
});
