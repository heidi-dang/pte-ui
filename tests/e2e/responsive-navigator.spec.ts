import { test, expect, Page } from '@playwright/test';

const QUESTION_ID = 'test-question-id';
const ATTEMPT_ID = 'test-attempt-id';
const SUBMISSION_ID = 'test-submission-id';

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

  // Click "Log In" button in the header
  await page.click('button:has-text("Log In")');

  // Fill login form in the modal
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await page.fill('input[type="email"]', 'student@example.com');
  await page.fill('input[type="password"]', 'password123');

  // Submit login
  await page.click('button[type="submit"]');

  // Wait for modal to close and student dashboard to appear
  await page.waitForTimeout(1500);

  // Navigate to practice tab — use hamburger menu on mobile, direct click on desktop
  const navButton = page.locator('button:has-text("22 Practice Tasks")');
  if (await navButton.isVisible()) {
    await navButton.click();
  } else {
    // Mobile: open hamburger menu first (last button with md:hidden class)
    const mobileMenuBtn = page.locator('nav button.md\\:hidden').last();
    await mobileMenuBtn.click();
    await page.waitForTimeout(500);
    // Click in the mobile drawer
    await page.locator('div.fixed.inset-x-0 button:has-text("22 Practice Tasks")').click();
  }
  await page.waitForTimeout(1000);
}

test.describe('Responsive Question Navigator', () => {
  test('mobile viewport (390x844) — shows compact navigator, no overflow', async ({ page }) => {
    await mockAllRoutes(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAndGoToPractice(page);

    // Wait for question nav to render
    await page.waitForSelector('text=17 questions', { timeout: 8000 }).catch(() => {});

    // No horizontal overflow
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

    // Mobile navigator should be visible
    const mobileNav = page.locator('.md\\:hidden');
    await expect(mobileNav.first()).toBeVisible();

    // Desktop full grid should be hidden on mobile
    const desktopNav = page.locator('.hidden.md\\:flex');
    await expect(desktopNav.first()).not.toBeVisible();

    // Mobile should show "Question X of Y"
    await expect(page.locator('text=Question 1 of 17')).toBeVisible({ timeout: 8000 });

    // Previous button should be disabled on first question
    const prevButton = mobileNav.locator('button:has-text("Previous")');
    await expect(prevButton).toBeDisabled();

    // Next button should work
    const nextButton = mobileNav.locator('button:has-text("Next")');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await expect(page.locator('text=Question 2 of 17')).toBeVisible();

    // Jump dropdown should exist and work
    const select = page.locator('select[aria-label="Jump to question"]');
    await expect(select).toBeVisible();
    await select.selectOption('4');
    await expect(page.locator('text=Question 5 of 17')).toBeVisible();
  });

  test('desktop viewport (1280x800) — shows full question grid', async ({ page }) => {
    await mockAllRoutes(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAndGoToPractice(page);

    // Desktop full grid should be visible
    const desktopNav = page.locator('.hidden.md\\:flex');
    await expect(desktopNav.first()).toBeVisible();

    // Mobile navigator should be hidden on desktop
    const mobileNav = page.locator('.md\\:hidden');
    await expect(mobileNav.first()).not.toBeVisible();

    // No horizontal overflow
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });

  test('mobile with 100+ questions — page number shows correctly', async ({ page }) => {
    await mockAllRoutes(page, 105);
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAndGoToPractice(page);

    // Wait for "105 questions" text
    await page.waitForSelector('text=105 questions', { timeout: 8000 }).catch(() => {});

    // No horizontal overflow
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

    // Mobile navigator should show correct count
    await expect(page.locator('text=Question 1 of 105')).toBeVisible({ timeout: 8000 });

    // Jump dropdown should list many options
    const select = page.locator('select[aria-label="Jump to question"]');
    await expect(select).toBeVisible();
    const optionCount = await select.locator('option').count();
    expect(optionCount).toBeGreaterThanOrEqual(20);
  });

  test('tablet viewport (768x1024) — shows desktop grid', async ({ page }) => {
    await mockAllRoutes(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAndGoToPractice(page);

    // On tablet (md breakpoint = 768px), desktop grid should be visible
    const desktopNav = page.locator('.hidden.md\\:flex');
    await expect(desktopNav.first()).toBeVisible();

    // No horizontal overflow
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
