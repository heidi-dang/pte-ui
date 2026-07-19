import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Exam Results', () => {
  test('seeded mock attempt returns per-question breakdown', async ({ request }) => {
    // Login
    const loginRes = await request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // Seed a completed mock attempt
    const seedRes = await request.post(`${BASE}/api/test/seed-mock-result`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {},
    });
    const seedData = await seedRes.json();
    expect(seedData.attemptId).toBeTruthy();
    const attemptId = seedData.attemptId;
    console.log(`  Seeded attempt: ${attemptId}`);

    // Fetch detailed results
    const detailRes = await request.get(`${BASE}/api/student/mock-tests/attempt/${attemptId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const detail = await detailRes.json();

    // Overall results
    expect(detail.overallScore).toBe(72);
    expect(detail.speakingScore).toBe(68);
    expect(detail.writingScore).toBe(75);
    expect(detail.readingScore).toBe(70);
    expect(detail.listeningScore).toBe(74);

    // Per-question breakdown
    expect(Array.isArray(detail.questionResults)).toBe(true);
    expect(detail.questionResults.length).toBe(8);
    expect(detail.resultSummary.total).toBe(8);
    expect(detail.resultSummary.scored).toBe(8);

    // Each question has required fields
    for (const qr of detail.questionResults) {
      expect(qr.taskType).toBeTruthy();
      expect(qr.finalScore).toBeGreaterThanOrEqual(0);
      expect(qr.feedback).toBeTruthy();
    }

    // Verify specific task codes
    const taskTypes = detail.questionResults.map((qr: any) => qr.taskType);
    expect(taskTypes).toContain('RA');
    expect(taskTypes).toContain('WE');
    expect(taskTypes).toContain('MCS');
    expect(taskTypes).toContain('WFD');

    // Verify some results have transcript (speaking tasks)
    const raResult = detail.questionResults.find((qr: any) => qr.taskType === 'RA');
    expect(raResult).toBeTruthy();
    if (raResult && raResult.normalizedResponse) {
      const response = typeof raResult.normalizedResponse === 'string'
        ? JSON.parse(raResult.normalizedResponse) : raResult.normalizedResponse;
      expect(response.kind).toBe('audio');
      expect(response.transcript).toBeTruthy();
    }

    // Verify history includes it
    const historyRes = await request.get(`${BASE}/api/student/mock-tests/attempts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const history = await historyRes.json();
    const found = history.find((h: any) => h.id === attemptId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('Completed');
    expect(found.overallScore).toBe(72);
  });
});
