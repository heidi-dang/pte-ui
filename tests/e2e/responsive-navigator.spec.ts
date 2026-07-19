import { test, expect, Page } from '@playwright/test';

const QUESTION_ID = 'test-question-id';
const ATTEMPT_ID = 'test-attempt-id';

function generateQuestions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i + 1}`,
    taskCode: 'RA',
    section: 'Speaking',
    title: `Read Aloud ${i + 1}`,
    promptText: 'The quick brown fox jumps over the lazy dog.',
    instruction: 'Read the text aloud.',
    difficulty: 'medium',
    hasPromptAudio: false,
    hasImage: false,
  }));
}

async function mockAllRoutes(page: Page, questionCount = 17) {
  const questions = generateQuestions(questionCount);

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

  await page.route('**/api/student/questions*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          items: questions,
          page: 1,
          pageSize: questionCount,
          total: questionCount,
          totalPages: 1,
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

async function checkNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

async function checkMobileNavigator(page: Page, total: number) {
  const desktopNav = page.locator('.hidden.md\\:flex');
  await expect(desktopNav.first()).not.toBeVisible();

  await expect(page.locator(`text=Question 1 of ${total}`)).toBeVisible({ timeout: 8000 });

  const prevButton = page.getByRole('button', { name: 'Previous', exact: true });
  await expect(prevButton).toBeDisabled();

  const nextButton = page.getByRole('button', { name: 'Next', exact: true });
  await expect(nextButton).toBeEnabled();

  await nextButton.click();
  await expect(page.locator(`text=Question 2 of ${total}`)).toBeVisible();

  const select = page.locator('select[aria-label="Jump to question"]');
  await expect(select).toBeVisible();
  await select.selectOption('4');
  await expect(page.locator(`text=Question 5 of ${total}`)).toBeVisible();
}

async function checkDesktopNavigator(page: Page) {
  const desktopNav = page.locator('.hidden.md\\:flex');
  await expect(desktopNav.first()).toBeVisible();

  const mobileNav = page.locator('.md\\:hidden');
  await expect(mobileNav.first()).not.toBeVisible();
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
    test(`${vp.label} (${vp.width}x${vp.height}) — mobile navigator, no overflow`, async ({ page }) => {
      await mockAllRoutes(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAndGoToPractice(page);

      await page.waitForSelector('text=17 questions', { timeout: 8000 }).catch(() => {});
      await checkNoOverflow(page);
      await checkMobileNavigator(page, 17);
    });
  }

  for (const vp of DESKTOP_VIEWPORTS) {
    test(`${vp.label} (${vp.width}x${vp.height}) — desktop navigator, no overflow`, async ({ page }) => {
      await mockAllRoutes(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAndGoToPractice(page);

      await checkNoOverflow(page);
      await checkDesktopNavigator(page);
    });
  }

  test('100+ questions (390x844) — mobile navigator handles large dataset', async ({ page }) => {
    await mockAllRoutes(page, 105);
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAndGoToPractice(page);

    await page.waitForSelector('text=105 questions', { timeout: 8000 }).catch(() => {});
    await checkNoOverflow(page);
    await checkMobileNavigator(page, 105);

    const select = page.locator('select[aria-label="Jump to question"]');
    const optionCount = await select.locator('option').count();
    expect(optionCount).toBeGreaterThanOrEqual(20);

    // Jump to the last question via the dropdown
    const lastIndex = optionCount - 1;
    await select.selectOption(String(lastIndex));
    const nextButton = page.getByRole('button', { name: 'Next', exact: true });
    await expect(nextButton).toBeDisabled();

    // Previous from last question should navigate backward
    const prevButton = page.getByRole('button', { name: 'Previous', exact: true });
    await expect(prevButton).toBeEnabled();
    await prevButton.click();
    await expect(page.locator('text=Question 104 of 105')).toBeVisible();
    await expect(nextButton).toBeEnabled();
  });
});
