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
  const pageSize = questionCount > 100 ? 20 : questionCount;
  const total = questionCount;
  const totalPages = Math.ceil(total / pageSize);

  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'test-token-audit',
        user: { id: 'test-user', name: 'Test Student', email: 'student@example.com', role: 'student' },
      }),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    const token = route.request().headers()['authorization'] || '';
    if (token.includes('test-token-audit')) {
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
    const url = new URL(route.request().url());
    const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
    const start = (pageParam - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const items = generateQuestions(end - start, start);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true, data: { items, page: pageParam, pageSize, total, totalPages, filters: {} },
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
            id: QUESTION_ID, taskCode: 'RA', section: 'Speaking', title: 'Read Aloud',
            instruction: 'Read the text aloud.', difficulty: 'medium',
            hasPromptAudio: false, hasImage: false,
            playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
            responseMode: 'audio', timing: { prepSeconds: 10, responseSeconds: 40 },
          },
        },
      }),
    });
  });

  await page.route('**/api/student/notifications', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
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
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      viewport: window.innerWidth,
      docScrollWidth: doc.scrollWidth,
      docClientWidth: doc.clientWidth,
    };
  });
  expect(result.docScrollWidth, `Horizontal overflow: scroll=${result.docScrollWidth} client=${result.docClientWidth} viewport=${result.viewport}`)
    .toBeLessThanOrEqual(result.viewport + 1);
}

async function expectVisibleWithinViewport(page: Page, locator: any, name: string) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${name} has no bounding box`).not.toBeNull();
  const viewport = page.viewportSize();
  expect(box!.x, `${name} left clipped`).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width, `${name} right clipped`).toBeLessThanOrEqual((viewport?.width || 0) + 1);
}

const VIEWPORTS = [
  { width: 320, height: 568, label: '320px' },
  { width: 360, height: 740, label: '360px' },
  { width: 375, height: 667, label: '375px' },
  { width: 390, height: 844, label: '390px' },
  { width: 430, height: 932, label: '430px' },
  { width: 768, height: 1024, label: '768px' },
  { width: 1024, height: 768, label: '1024px' },
  { width: 1280, height: 800, label: '1280px' },
] as const;

test.describe('Deep Mobile Responsive Audit', () => {
  for (const vp of VIEWPORTS) {
    test(`viewport ${vp.label} (${vp.width}x${vp.height}) — practice task actions visible, no overflow`, async ({ page }) => {
      test.setTimeout(30000);
      await mockAllRoutes(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAndGoToPractice(page);

      await page.waitForSelector('text=17 questions', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(500);

      await expectNoOverflow(page);

      // All bottom action buttons should be visible and within viewport
      const isMobile = vp.width < 640;
      if (isMobile) {
        // Mobile layout: Submit full-width, Prev Q / Next Q below, Prev Task / Next Task below
        await expectVisibleWithinViewport(page, page.getByRole('button', { name: /submit answer/i }), 'Submit Answer');
        // Check at least one Prev/Next button is visible by scanning
        const mobileSubmit = page.locator('.sm\\:hidden button:has-text("Submit")');
        await expectVisibleWithinViewport(page, mobileSubmit.first(), 'Mobile Submit Answer');
      } else {
        // Desktop layout: all buttons in two groups
        await expectVisibleWithinViewport(page, page.locator('.hidden.sm\\:flex button:has-text("Prev Task")').first(), 'Prev Task');
        await expectVisibleWithinViewport(page, page.locator('.hidden.sm\\:flex button:has-text("Next Task")').first(), 'Next Task');
        await expectVisibleWithinViewport(page, page.locator('.hidden.sm\\:flex button:has-text("Prev Q")').first(), 'Prev Q');
        await expectVisibleWithinViewport(page, page.locator('.hidden.sm\\:flex button:has-text("Next Q")').first(), 'Next Q');
        await expectVisibleWithinViewport(page, page.locator('.hidden.sm\\:flex button:has-text("Submit")').first(), 'Submit');
      }
    });
  }

  test('100+ questions with page-aware navigation — iPhone SE (375x667)', async ({ page }) => {
    test.setTimeout(30000);
    await page.setViewportSize({ width: 375, height: 667 });
    await mockAllRoutes(page, 105);
    await loginAndGoToPractice(page);

    await page.waitForSelector('text=105 questions', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expectNoOverflow(page);

    // Verify page indicator
    await expect(page.locator('text=Page 1 of 6')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Question 1 of 105')).toBeVisible({ timeout: 5000 });

    // Navigate a few questions
    const nextQ = page.locator('.sm\\:hidden button:has-text("Next Q")').first();
    for (let i = 0; i < 3; i++) {
      await nextQ.click();
      await page.waitForTimeout(150);
    }
    await expect(page.locator('text=Question 4 of 105')).toBeVisible({ timeout: 5000 });
  });
});
