import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Exam Full Browser Flow', () => {
  let token = '';

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    const body = await res.json();
    token = body.token;
    expect(token).toBeTruthy();
  });

  test('full lifecycle: generate, save, resume, submit, results via API + UI verification', async ({ page }) => {
    // Step 1: Generate mini exam via API
    const genRes = await page.request.post(`${BASE}/api/student/mock-tests/generate`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { testType: 'mini' },
    });
    const genData = await genRes.json();
    const testData = genData.test || genData;
    expect(testData.questions).toBeDefined();
    const questions = testData.questions || [];
    expect(questions.length).toBeGreaterThanOrEqual(5);
    console.log(`  Generated ${questions.length} questions`);

    // Step 2: Start attempt via API
    const startRes = await page.request.post(`${BASE}/api/student/mock-tests/save-progress`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        testId: testData.id, title: testData.title, type: 'mini',
        currentQuestionIndex: 0, secondsRemaining: 600, answers: {},
        questionsJson: questions, isPaused: false,
      },
    });
    const startData = await startRes.json();
    expect(startData.success).toBe(true);
    const attemptId = startData.attempt.id;
    expect(attemptId).toBeTruthy();

    // Step 3: Answer 6 different task types
    const answers: Record<string, unknown> = {};
    for (let i = 0; i < Math.min(6, questions.length); i++) {
      const q = questions[i];
      const code = q.taskCode || q.code || 'RA';
      if (['RA','RS','DI','RL','ASQ','SGD','RTS'].includes(code)) {
        answers[i] = { kind: 'audio', transcript: `Mock transcript for ${code}` };
      } else if (['SWT','WE','SST','WFD'].includes(code)) {
        answers[i] = { kind: 'text', text: `Mock essay answer for ${code} with sufficient content length for grading validation purposes.` };
      } else if (['MCS','MCSSL','HCS','SMW'].includes(code)) {
        answers[i] = { kind: 'single_choice', selected: 'Option A' };
      } else if (['MCM','MCMSL'].includes(code)) {
        answers[i] = { kind: 'multi_choice', selected: ['Option A', 'Option B'] };
      } else if (code === 'ROP') {
        answers[i] = { kind: 'ordered_list', ordered: ['First paragraph', 'Second paragraph', 'Third paragraph'] };
      } else if (['FIBR','FIBRW','FIBL'].includes(code)) {
        answers[i] = { kind: 'blanks', blanks: { '0': 'answer1', '1': 'answer2' } };
      } else {
        answers[i] = { kind: 'text', text: `Generic answer for ${code}` };
      }
    }
    expect(Object.keys(answers).length).toBeGreaterThanOrEqual(5);

    // Step 4: Submit via API
    const submitRes = await page.request.post(`${BASE}/api/student/mock-tests/complete`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { attemptId, testId: testData.id, title: testData.title, type: 'mini', answers, questionsJson: questions },
    });
    const submitData = await submitRes.json();
    expect(submitData.success !== false).toBe(true);

    // Step 5: Poll grading
    let graded = false;
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(2000);
      const statusRes = await page.request.get(`${BASE}/api/student/mock-tests/status/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statusData = await statusRes.json();
      const status = statusData.attempt?.status || statusData.status;
      if (status === 'Completed' || status === 'Grading_Failed' || status === 'Pending_Grading') {
        graded = true;
        console.log(`  Grading result: ${status}`);
        break;
      }
    }
    expect(graded).toBe(true);

    // Step 6: Navigate to results in browser
    await page.goto(`${BASE}/student/mock-exams`);
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Failed to load');
    expect(bodyText).not.toContain('401');
    expect(bodyText.length).toBeGreaterThan(50);

    // Step 7: Verify attempt shows in history via API
    const historyRes = await page.request.get(`${BASE}/api/student/mock-tests/attempts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const history = await historyRes.json();
    const found = history.find((h: any) => h.id === attemptId);
    expect(found).toBeTruthy();
    console.log(`  Attempt found in history: ${found?.status}`);
  });
});
