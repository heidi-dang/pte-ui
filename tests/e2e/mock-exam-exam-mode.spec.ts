import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Exam Exam Mode', () => {
  let token = '';

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    const body = await res.json();
    token = body.token;
    expect(token).toBeTruthy();
  });

  test('mock exam start API creates In_Progress attempt with valid status', async ({ request }) => {
    // Generate test
    const genRes = await request.post(`${BASE}/api/student/mock-tests/generate`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { testType: 'mini' },
    });
    const genData = await genRes.json();
    const t = genData.test || genData;
    expect(t.questions).toBeDefined();

    // Start attempt
    const startRes = await request.post(`${BASE}/api/student/mock-tests/save-progress`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        testId: t.id, title: t.title, type: 'full',
        currentQuestionIndex: 0, secondsRemaining: 3600, answers: {},
        questionsJson: t.questions, isPaused: false,
      },
    });
    const startData = await startRes.json();
    expect(startData.success).toBe(true);
    expect(startData.attempt.status).toBe('In_Progress');
    const attemptId = startData.attempt.id;

    // Verify active endpoint returns it
    const activeRes = await request.get(`${BASE}/api/student/mock-tests/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const activeData = await activeRes.json();
    expect(activeData.activeAttempt).not.toBeNull();
    expect(activeData.activeAttempt.id).toBe(attemptId);
    expect(activeData.activeAttempt.status).toBe('In_Progress');

    // Pause
    const pauseRes = await request.post(`${BASE}/api/student/mock-tests/save-progress`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { attemptId, testId: t.id, title: t.title, type: 'full',
        currentQuestionIndex: 1, secondsRemaining: 3500, answers: {}, isPaused: true,
      },
    });
    expect(pauseRes.ok()).toBe(true);

    // Verify paused is active
    const pausedActiveRes = await request.get(`${BASE}/api/student/mock-tests/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pausedData = await pausedActiveRes.json();
    expect(pausedData.activeAttempt).not.toBeNull();
    expect(pausedData.activeAttempt.status).toBe('Paused');

    // Resume
    const resumeRes = await request.post(`${BASE}/api/student/mock-tests/save-progress`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { attemptId, testId: t.id, title: t.title, type: 'full',
        currentQuestionIndex: 1, secondsRemaining: 3500, answers: {}, isPaused: false,
      },
    });
    expect(resumeRes.ok()).toBe(true);

    // Verify resumed
    const resumedActiveRes = await request.get(`${BASE}/api/student/mock-tests/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const resumedData = await resumedActiveRes.json();
    expect(resumedData.activeAttempt).not.toBeNull();
    expect(resumedData.activeAttempt.status).toBe('In_Progress');
  });
});
