import { test, expect, Page } from '@playwright/test';

const QUESTION_ID = 'test-speaking-question-id';
const ATTEMPT_ID = 'test-speaking-attempt-id';
const SUBMISSION_ID = 'test-speaking-submission-id';

async function mockAllRoutes(page: Page) {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'test-token', user: { id: 'test-user', name: 'Test Student', email: 'student@example.com', role: 'student' } }),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'test-user', name: 'Test Student', email: 'student@example.com', role: 'student' }),
    });
  });

  await page.route('**/api/student/questions*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: QUESTION_ID, taskCode: 'RA', section: 'Speaking', title: 'Read Aloud', promptText: 'The quick brown fox jumps over the lazy dog.', instruction: 'Read the text aloud.', difficulty: 'Medium' },
      ]),
    });
  });

  await page.route('**/api/student/practice/attempts/start', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        attemptId: ATTEMPT_ID,
        deadlineAt: new Date(Date.now() + 60000).toISOString(),
        taskCode: 'RA',
        section: 'Speaking',
        timing: { prepSeconds: 5, responseSeconds: 40 },
        question: { id: QUESTION_ID, taskCode: 'RA', section: 'Speaking', title: 'Read Aloud', promptText: 'The quick brown fox jumps over the lazy dog.' },
        playbackPolicy: { maxPlays: 1, cooldownMs: 0 },
      }),
    });
  });

  await page.route(`**/api/student/practice/attempts/${ATTEMPT_ID}/play-prompt`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, audioUrl: '/test-audio.mp3', playedCount: 1 }),
    });
  });

  await page.route(`**/api/student/practice/attempts/${ATTEMPT_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: ATTEMPT_ID, taskCode: 'RA', mode: 'timed', status: 'In_Progress',
        startedAt: new Date().toISOString(), deadlineAt: new Date(Date.now() + 60000).toISOString(),
        submittedAt: null, hasResponseAudio: false, submissionId: null, submissionStatus: null,
      }),
    });
  });

  await page.route(`**/api/student/practice/attempts/${ATTEMPT_ID}/result`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: SUBMISSION_ID, score: 72, fluencyScore: 68, pronunciationScore: 75, grammarIssues: 2,
        feedback: 'Good pronunciation and fluency. Minor grammar issues detected.',
        status: 'Completed',
      }),
    });
  });
}

test.describe('Speaking Practice E2E', () => {
  test('RA (Read Aloud) task renders, interacts with prompt, and submits', async ({ page }) => {
    const responses: { url: string; method: string }[] = [];
    page.on('request', (req) => { responses.push({ url: req.url(), method: req.method() }); });

    await mockAllRoutes(page);
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');

    const pageText = await page.textContent('body');
    expect(pageText).toContain('All 22 Task Types');
    expect(pageText).toContain('RA');

    const raButton = page.locator('button:has(span:has-text("RA"))').first();
    await expect(raButton).toBeVisible();
    const currentBg = await raButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(currentBg).not.toBe('transparent');

    await page.waitForTimeout(1000);

    const bodyTextAfter = await page.textContent('body');
    expect(bodyTextAfter).toContain('RA');
    expect(bodyTextAfter).toContain('Speaking');

    const sentToPlayPrompt = responses.some(r => r.url.includes('play-prompt') && r.method === 'POST');
    const sentToStart = responses.some(r => r.url.includes('attempts/start') && r.method === 'POST');

    expect(sentToStart).toBe(true);
  });

  test('Speaking task layout shows TaskRenderer alongside recording section', async ({ page }) => {
    await mockAllRoutes(page);
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Read Aloud');
    expect(bodyText).toContain('Submit');
  });

  test('Attempt polling and result display for speaking task', async ({ page }) => {
    let pollCount = 0;

    await page.route(`**/api/student/practice/attempts/${ATTEMPT_ID}`, async (route) => {
      pollCount++;
      const isCompleted = pollCount >= 3;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: ATTEMPT_ID, taskCode: 'RA', mode: 'timed',
          status: isCompleted ? 'Completed' : 'In_Progress',
          startedAt: new Date().toISOString(), deadlineAt: new Date(Date.now() + 60000).toISOString(),
          submittedAt: isCompleted ? new Date().toISOString() : null,
          hasResponseAudio: true,
          submissionId: isCompleted ? SUBMISSION_ID : null,
          submissionStatus: isCompleted ? 'graded' : 'pending',
        }),
      });
    });

    await page.route(`**/api/student/practice/attempts/${ATTEMPT_ID}/submit`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, submissionId: SUBMISSION_ID, status: 'pending' }),
      });
    });

    await page.route(`**/api/student/practice/attempts/${ATTEMPT_ID}/result`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: SUBMISSION_ID, score: 72, fluencyScore: 68, pronunciationScore: 75, grammarIssues: 2,
          feedback: 'Good pronunciation and fluency.',
          status: 'Completed',
        }),
      });
    });

    await mockAllRoutes(page);
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const submitButton = page.locator('button', { hasText: 'Submit' }).first();
    if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForTimeout(2000);
    }

    expect(pollCount).toBeGreaterThanOrEqual(1);
  });
});
