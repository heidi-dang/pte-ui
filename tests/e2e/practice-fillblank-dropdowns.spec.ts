import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Practice Fill-Blank Dropdowns', () => {
  test('FIBRW page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/practice`);
    await page.waitForSelector('text=All 22 Task Types');
    await page.locator('button:has-text("FIBRW")').first().click();
    await page.waitForTimeout(3000);
    expect(errors.filter(e => !e.includes('favicon') && !e.includes('404')).length).toBe(0);
  });

  test('FIBR page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE}/practice`);
    await page.waitForSelector('text=All 22 Task Types');
    await page.locator('button:has-text("FIBR")').first().click();
    await page.waitForTimeout(3000);
    expect(errors.filter(e => !e.includes('favicon') && !e.includes('404')).length).toBe(0);
  });

  test('FIBL page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(`${BASE}/practice`);
    await page.waitForSelector('text=All 22 Task Types');
    await page.locator('button:has-text("FIBL")').first().click();
    await page.waitForTimeout(3000);
    expect(errors.filter(e => !e.includes('favicon') && !e.includes('404')).length).toBe(0);
  });
});
