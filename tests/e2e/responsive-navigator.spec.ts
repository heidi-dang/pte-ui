import { test, expect, Page } from '@playwright/test';

const QUESTION_ID = 'test-question-id';
const ATTEMPT_ID = 'test-attempt-id';

function generateQuestions(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${offset + i + 1}`,
    taskCode: 'RA',
    section: 'Speaking',
    title: `Read Aloud ${offset + i + 1}`,
    promptText: 'The quick brown fox jumps over the lazy dog.',
    instruction: 'Read the text aloud.',
    difficulty: 'medium',
    hasPromptAudio: false,
    hasImage: false,
  }));
}

async function mockAllRoutes(page: Page, questionCount = 17) {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'test-token-mobile-nav',
        user: { id: 'test-user', name: 'Test Student', email: 'student@example.com', role: 'student' },
      }),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    const token = route.request().headers()['authorization'] || '';
    if (token.includes('test-token-mobile-nav')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-user', name: 'Test Student', email: 'student@example.com', role: 'student' }),
      });
    } else {
      await route.fulfill({ status: 401, body: 'Unauthorized' });
    }
  });

  const pageSize = questionCount > 100 ? 20 : questionCount;
  const total = questionCount;
  const totalPages = Math.ceil(total / pageSize);

  await page.route('**/api/student/questions*', async (route) => {
    const url = new URL(route.request().url());
    const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
    const start = (pageParam - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const items = generateQuestions(end - start, start);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          items,
          page: pageParam,
          pageSize,
          total,
          totalPages,
          filters: {},
        },
      }),
    });
  });

  await page.route('**/api/student/practice/attempts/start', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          attemptId: ATTEMPT_ID,
          status: 'In_Progress',
          deadlineAt: new Date(Date.now() + 50000).toISOString(),
          taskCode: 'RA',
          section: 'Speaking',
          timing: { prepSeconds: 10, responseSeconds: 40 },
          playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
          question: {
            id: QUESTION_ID,
            taskCode: 'RA',
            section: 'Speaking',
            title: 'Read Aloud',
            instruction: 'Read the text aloud.',
            difficulty: 'medium',
            hasPromptAudio: false,
            hasImage: false,
            playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
            responseMode: 'audio',
            timing: { prepSeconds: 10, responseSeconds: 40 },
          },
        },
      }),
    });
  });

  await page.route('**/api/student/notifications', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

async function loginAndGoToPractice(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await page.click('button:has-text("Log In")');
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await page.fill('input[type="email"]', 'student@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  const navButton = page.locator('button:has-text("22 Practice Tasks")');
  if (await navButton.isVisible()) {
    await navButton.click();
  } else {
    const mobileMenuBtn = page.locator('nav button.md\\:hidden').last();
    await mobileMenuBtn.click();
    await page.waitForTimeout(500);
    await page.locator('div.fixed.inset-x-0 button:has-text("22 Practice Tasks")').click();
  }
  await page.waitForTimeout(1000);
}

async function expectNoOverflow(page: Page) {
  const result = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(result.scrollWidth, `Horizontal overflow detected: scroll=${result.scrollWidth} client=${result.clientWidth}`)
    .toBeLessThanOrEqual(result.clientWidth + 1);
}

async function expectVisibleWithinViewport(page: Page, locator: any, name: string) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${name} has no bounding box`).not.toBeNull();
  const viewport = page.viewportSize();
  expect(box!.x, `${name} left clipped`).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width, `${name} right clipped`).toBeLessThanOrEqual((viewport?.width || 0) + 1);
}

async function checkMobileNavigator(page: Page, total: number) {
  const desktopNav = page.locator('.hidden.md\\:flex');
  await expect(desktopNav.first()).not.toBeVisible();

  await expect(page.locator(`text=Question 1 of ${total}`)).toBeVisible({ timeout: 8000 });

  const select = page.locator('select[aria-label="Jump to question"]');
  await expect(select).toBeVisible();
  await select.selectOption('4');
  await expect(page.locator(`text=Question 5 of ${total}`)).toBeVisible({ timeout: 8000 });
}

async function checkDesktopNavigator(page: Page) {
  const desktopNav = page.locator('.hidden.md\\:flex');
  await expect(desktopNav.first()).toBeVisible();
  const mobileNav = page.locator('.md\\:hidden');
  await expect(mobileNav.first()).not.toBeVisible();
}

async function checkBottomActionsVisible(page: Page, isMobile: boolean) {
  if (isMobile) {
    // Mobile: Submit Answer is full-width, no separate Submit button
    await expectVisibleWithinViewport(page, page.getByRole('button', { name: /submit answer/i }).first(), 'Submit Answer');
    // Prev Q / Next Q in mobile grid
    const prevQ = page.locator('.sm\\:hidden button:has-text("Prev Q")');
    const nextQ = page.locator('.sm\\:hidden button:has-text("Next Q")');
    const prevTask = page.locator('.sm\\:hidden button:has-text("Prev Task")');
    const nextTask = page.locator('.sm\\:hidden button:has-text("Next Task")');
    // At least one set should be visible
    const anyVisible = (await prevQ.first().isVisible()) || (await nextQ.first().isVisible()) ||
      (await prevTask.first().isVisible()) || (await nextTask.first().isVisible());
    expect(anyVisible).toBe(true);
  } else {
    await expectVisibleWithinViewport(page, page.getByRole('button', { name: /prev task/i }).first(), 'Prev Task');
    await expectVisibleWithinViewport(page, page.getByRole('button', { name: /next task/i }).first(), 'Next Task');
    await expectVisibleWithinViewport(page, page.getByRole('button', { name: /prev q/i }).first(), 'Prev Q');
    await expectVisibleWithinViewport(page, page.getByRole('button', { name: /next q/i }).first(), 'Next Q');
    await expectVisibleWithinViewport(page, page.getByRole('button', { name: 'Submit' }).first(), 'Submit');
  }
}

const MOBILE_VIEWPORTS = [
  { width: 375, height: 667, label: 'iPhone SE' },
  { width: 390, height: 844, label: 'iPhone 14/15' },
  { width: 430, height: 932, label: 'iPhone Pro Max' },
] as const;

const DESKTOP_VIEWPORTS = [
  { width: 768, height: 1024, label: 'tablet' },
  { width: 1280, height: 800, label: 'desktop' },
] as const;

test.describe('Responsive Question Navigator', () => {
  for (const vp of MOBILE_VIEWPORTS) {
    test(`${vp.label} (${vp.width}x${vp.height}) — mobile navigator, no overflow, actions visible`, async ({ page }) => {
      await mockAllRoutes(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAndGoToPractice(page);
      await page.waitForSelector('text=17 questions', { timeout: 8000 }).catch(() => {});
      await expectNoOverflow(page);
      await checkMobileNavigator(page, 17);
      await checkBottomActionsVisible(page, true);
    });
  }

  for (const vp of DESKTOP_VIEWPORTS) {
    test(`${vp.label} (${vp.width}x${vp.height}) — desktop navigator, no overflow, actions visible`, async ({ page }) => {
      await mockAllRoutes(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAndGoToPractice(page);
      await expectNoOverflow(page);
      await checkDesktopNavigator(page);
      await checkBottomActionsVisible(page, false);
    });
  }

  test('100+ questions (390x844) — production page size, page-aware navigation', async ({ page }) => {
    await mockAllRoutes(page, 105);
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAndGoToPractice(page);
    await page.waitForSelector('text=105 questions', { timeout: 8000 }).catch(() => {});
    await expectNoOverflow(page);

    await expect(page.locator('text=Question 1 of 105')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Page 1 of 6')).toBeVisible();

    // Jump to Q5 via dropdown
    const select = page.locator('select[aria-label="Jump to question"]');
    await select.selectOption('4');
    await expect(page.locator('text=Question 5 of 105')).toBeVisible({ timeout: 8000 });

    // Next Q advances within page
    const nextQ = page.locator('.sm\\:hidden button:has-text("Next Q")').first();
    await nextQ.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Question 6 of 105')).toBeVisible();

    // Navigate forward to page boundary (Q20)
    await select.selectOption('19');
    await page.waitForTimeout(500);
    await expect(page.locator('text=Question 20 of 105')).toBeVisible();
    await expect(page.locator('text=Page 1 of 6')).toBeVisible();

    await expect(page.locator('text=Page 1 of 6')).toBeVisible();

    // Next Q auto-loads page 2
    await expect(nextQ).toBeEnabled({ timeout: 3000 });
    await nextQ.click();
    await page.waitForTimeout(800);
    await expect(page.locator('text=Question 21 of 105')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=Page 2 of 6')).toBeVisible();

    // Jump within page 2
    const select2 = page.locator('select[aria-label="Jump to question"]');
    await select2.selectOption('5');
    await expect(page.locator('text=Question 26 of 105')).toBeVisible({ timeout: 8000 });

    // Prev Page goes back (MobileNavigator uses md:hidden, not sm:hidden)
    const prevPage = page.getByRole('button', { name: 'Prev Page' }).first();
    await prevPage.click();
    await page.waitForTimeout(800);
    await expect(page.locator('text=Page 1 of 6')).toBeVisible({ timeout: 5000 });

    await expectNoOverflow(page);
    await checkBottomActionsVisible(page, true);
  });
});
