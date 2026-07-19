import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

function unwrap(body: any): any {
  if (body?.success === true && body?.data !== undefined) return body.data;
  return body;
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = await res.json();
  return body.token;
}

test.describe('Live server E2E (real API, no mocking)', () => {
  let token = '';

  test.beforeAll(async () => {
    token = await login();
  });

  test('RA speaking task: upload audio, submit, poll for result', async () => {
    const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const qRes = await fetch(`${BASE}/api/student/questions?taskCode=RA&pageSize=1`, { headers: authHeaders });
    let questions = await qRes.json();
    questions = questions?.data?.items || (Array.isArray(questions) ? questions : []);
    expect(questions.length).toBeGreaterThanOrEqual(1);
    const q = questions[0];
    expect(typeof q.instruction).toBe('string');
    expect(q.instruction.trim().length).toBeGreaterThan(0);

    const startRes = await fetch(`${BASE}/api/student/practice/attempts/start`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ questionBankItemId: q.id }),
    });
    const start = unwrap(await startRes.json());
    expect(start.attemptId).toBeTruthy();
    expect(typeof start.question.instruction).toBe('string');
    expect(start.question.instruction.trim().length).toBeGreaterThan(0);
    expect(start.question.instruction).toBe(q.instruction);
    const attemptId = start.attemptId;

    const fixture = readFileSync('scripts/fixtures/audio-test.wav');
    const form = new FormData();
    form.append('audio', new Blob([fixture], { type: 'audio/wav' }), 'response.wav');
    const uploadRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}/audio-upload`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
    });
    const upload = unwrap(await uploadRes.json());
    expect(upload.responseAudioId).toBeTruthy();

    const submitRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}/submit`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({}),
    });
    const submit = unwrap(await submitRes.json());
    expect(submit.submissionId).toBeTruthy();

    let result: any = null;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const attRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}`, { headers: authHeaders });
      const att = unwrap(await attRes.json());
      if (att.status === 'Completed' || att.status === 'Grading_Failed') {
        const resRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}/result`, { headers: authHeaders });
        result = unwrap(await resRes.json());
        break;
      }
    }
    expect(result).not.toBeNull();
    if (result?.status === 'Completed') {
      expect(result.result?.score ?? result.score).toEqual(expect.any(Number));
    }
  });

  test('WE writing task: submit text, poll for result', async () => {
    const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const qRes = await fetch(`${BASE}/api/student/questions?taskCode=WE&pageSize=1`, { headers: authHeaders });
    let questions = await qRes.json();
    questions = questions?.data?.items || (Array.isArray(questions) ? questions : []);
    if (questions.length === 0) return;
    const q = questions[0];
    expect(typeof q.instruction).toBe('string');
    expect(q.instruction.trim().length).toBeGreaterThan(0);

    const startRes = await fetch(`${BASE}/api/student/practice/attempts/start`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ questionBankItemId: q.id }),
    });
    const start = unwrap(await startRes.json());
    expect(start.attemptId).toBeTruthy();
    const attemptId = start.attemptId;

    const submitRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}/submit`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ answerJson: JSON.stringify({ typedText: 'E2E test essay response for WE task.' }) }),
    });
    const submit = unwrap(await submitRes.json());
    expect(submit.submissionId).toBeTruthy();

    let result: any = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const attRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}`, { headers: authHeaders });
      const att = unwrap(await attRes.json());
      if (att.status === 'Completed' || att.status === 'Grading_Failed') {
        const resRes = await fetch(`${BASE}/api/student/practice/attempts/${attemptId}/result`, { headers: authHeaders });
        result = unwrap(await resRes.json());
        break;
      }
    }
    expect(result).not.toBeNull();
    if (result?.status === 'Completed') {
      expect(result.result?.score ?? result.score).toEqual(expect.any(Number));
    }
  });
});
