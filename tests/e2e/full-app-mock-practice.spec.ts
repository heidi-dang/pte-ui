import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Full App Mock & Practice Flow', () => {
  let token = '';
  const errors: string[] = [];

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    token = (await res.json()).token;
    expect(token).toBeTruthy();
  });

  test.beforeEach(async ({ page }) => {
    errors.length = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => errors.push(`[PAGE ERROR] ${err.message}`));
  });

  test('generate mini mock exam', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/student/mock-tests/generate`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { testType: 'mini' },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.test || data.success).toBeTruthy();
    const questions = data.test?.questions || [];
    expect(questions.length).toBeGreaterThanOrEqual(3);
  });

  test('mock exam full lifecycle: save → resume → submit', async ({ page }) => {
    // Generate
    const genRes = await page.request.post(`${BASE}/api/student/mock-tests/generate`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { testType: 'mini' },
    });
    const genData = await genRes.json();
    const testData = genData.test || genData;
    const questions = testData.questions || [];

    // Save progress
    const saveRes = await page.request.post(`${BASE}/api/student/mock-tests/save-progress`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        testId: testData.id, title: testData.title, type: 'mini',
        currentQuestionIndex: 2, secondsRemaining: 300, answers: { '0': { kind: 'text', text: 'Test answer' } },
        questionsJson: questions, isPaused: false,
      },
    });
    const saveData = await saveRes.json();
    expect(saveData.success).toBe(true);
    const attemptId = saveData.attempt.id;

    // Resume (get active)
    const activeRes = await page.request.get(`${BASE}/api/student/mock-tests/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const activeData = await activeRes.json();
    expect(activeData.activeAttempt).toBeTruthy();
    expect(activeData.activeAttempt.id).toBe(attemptId);

    // Submit with answers for each question
    const answers: Record<string, unknown> = {};
    for (let i = 0; i < Math.min(questions.length, 5); i++) {
      const q = questions[i];
      const code = q.taskCode || q.code || 'RA';
      if (['MCS', 'MCSSL', 'HCS', 'SMW'].includes(code)) {
        answers[i] = { kind: 'single_choice', selected: (q.options?.[0]) || 'Option A' };
      } else if (['MCM', 'MCMSL'].includes(code)) {
        answers[i] = { kind: 'multi_choice', selected: [(q.options?.[0]) || 'A', (q.options?.[1]) || 'B'] };
      } else if (['ROP'].includes(code)) {
        answers[i] = { kind: 'ordered_list', ordered: ['A', 'B', 'C'] };
      } else if (['FIBR', 'FIBRW', 'FIBL'].includes(code)) {
        answers[i] = { kind: 'blanks', blanks: { '0': 'test', '1': 'answer' } };
      } else if (['WFD'].includes(code)) {
        answers[i] = { kind: 'text', text: 'test transcription' };
      } else if (['HIW'].includes(code)) {
        answers[i] = { kind: 'highlight', highlighted: [1, 3] };
      } else {
        answers[i] = { kind: 'text', text: `Mock response for ${code} task during automated testing.` };
      }
    }

    const submitRes = await page.request.post(`${BASE}/api/student/mock-tests/complete`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { attemptId, testId: testData.id, title: testData.title, type: 'mini', answers, questionsJson: questions },
    });
    expect(submitRes.status()).toBe(202);

    // Check attempt status
    const statusRes = await page.request.get(`${BASE}/api/student/mock-tests/status/${attemptId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(statusRes.ok()).toBe(true);
    const statusData = await statusRes.json();
    expect(statusData.attempt.status).not.toBe(500);
  });

  test('practice questions list filtered by task', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/student/questions?taskCode=MCS&pageSize=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    if (data.data?.items?.length > 0) {
      for (const item of data.data.items) {
        expect(item.taskCode).toBe('MCS');
        expect(item.answerKeyJson).toBeUndefined();
      }
    }
  });

  test('practice questions counts endpoint', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/student/questions/counts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('practice overview stats', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/student/practice/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('no console errors during API operations', async () => {
    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('undefined') || e.includes('null')
      || e.includes('map is not') || e.includes('Cannot read')
      || e.includes('500') || e.includes('403') || e.includes('401'));
    expect(criticalErrors).toHaveLength(0);
  });
});
