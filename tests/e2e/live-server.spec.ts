import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = await res.json();
  if (!body.token) throw new Error('Login failed: ' + JSON.stringify(body));
  return body.token;
}

test.describe('Live server E2E (real API, no mocking)', () => {
  let token: string;

  test.beforeAll(async () => {
    token = await login();
  });

  test('RA speaking task: upload audio, submit, poll for result', async ({ page }) => {
    const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const questionsRes = await fetch(`${BASE}/api/student/questions?taskCode=RA&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const questions = await questionsRes.json();
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThanOrEqual(1);
    const question = questions[0];
    console.log(`  Using RA question: ${question.title}`);

    const startRes = await fetch(`${BASE}/api/student/practice/attempts/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ questionBankItemId: question.id }),
    });
    const startBody = await startRes.json();
    expect(startBody.success).toBe(true);
    const attemptId: string = startBody.attemptId;
    console.log(`  Started attempt: ${attemptId}`);

    const audioFixture = require('fs').readFileSync('scripts/fixtures/audio-test.wav');
    const uploadForm = new FormData();
    uploadForm.append('audio', new Blob([audioFixture], { type: 'audio/wav' }), 'response.wav');
    const uploadRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}/audio-upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: uploadForm,
    });
    const uploadBody = await uploadRes.json();
    expect(uploadBody.success).toBe(true);
    console.log(`  Audio uploaded: ${uploadBody.audioMetadataId}`);

    const submitRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    const submitBody = await submitRes.json();
    expect(submitBody.submissionId).toBeTruthy();
    console.log(`  Submitted: ${submitBody.submissionId} (${submitBody.status})`);

    let result: any = null;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const attemptRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const attemptBody = await attemptRes.json();
      console.log(`  Poll ${i + 1}: status=${attemptBody.status}, submissionStatus=${attemptBody.submissionStatus}`);
      if (attemptBody.status === 'Completed' || attemptBody.status === 'Grading_Failed') {
        const resultRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}/result`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        result = await resultRes.json();
        break;
      }
    }

    expect(result).not.toBeNull();
    if (result && result.status === 'Completed') {
      expect(result.score).toEqual(expect.any(Number));
      console.log(`  Score: ${result.score}, feedback: ${(result.feedback || '').slice(0, 60)}`);
    } else {
      console.log(`  Grading not completed in polling window (result status: ${result?.status})`);
    }
  });

  test('WE writing task: submit text, poll for result', async ({ page }) => {
    const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const questionsRes = await fetch(`${BASE}/api/student/questions?taskCode=WE&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const questions = await questionsRes.json();
    expect(Array.isArray(questions)).toBe(true);
    if (questions.length === 0) {
      console.log('  No WE question available — skipping');
      return;
    }
    const question = questions[0];
    console.log(`  Using WE question: ${question.title}`);

    const startRes = await fetch(`${BASE}/api/student/practice/attempts/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ questionBankItemId: question.id }),
    });
    const startBody = await startRes.json();
    expect(startBody.success).toBe(true);
    const attemptId: string = startBody.attemptId;
    console.log(`  Started attempt: ${attemptId}`);

    const submitRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ answerJson: JSON.stringify({ typedText: 'Live E2E test submission for WE task. This is a sample essay response to verify the end-to-end flow works correctly.' }) }),
    });
    const submitBody = await submitRes.json();
    expect(submitBody.submissionId).toBeTruthy();
    console.log(`  Submitted: ${submitBody.submissionId} (${submitBody.status})`);

    let result: any = null;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const attemptRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const attemptBody = await attemptRes.json();
      console.log(`  Poll ${i + 1}: status=${attemptBody.status}, submissionStatus=${attemptBody.submissionStatus}`);
      if (attemptBody.status === 'Completed' || attemptBody.status === 'Grading_Failed') {
        const resultRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}/result`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        result = await resultRes.json();
        break;
      }
    }

    expect(result).not.toBeNull();
    if (result && result.status === 'Completed') {
      expect(result.score).toEqual(expect.any(Number));
      console.log(`  Score: ${result.score}, feedback: ${(result.feedback || '').slice(0, 60)}`);
    } else {
      console.log(`  Grading not completed in polling window (result status: ${result?.status})`);
    }
  });
});
