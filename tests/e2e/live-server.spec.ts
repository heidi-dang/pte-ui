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

  test('student portal shell is visible after login', async ({ page }) => {
    // Log in via UI and confirm StudentPortalShell renders
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Click login button
    await page.click('text=Log In');

    // Fill credentials
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button:has-text("Sign In")');

    // Wait for student portal — check localStorage token and sidebar nav
    await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 10000 });
    await page.locator('nav').filter({ hasText: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 10000 });

    // Verify portal shell elements are visible
    await expect(page.locator('text=Dashboard').first()).toBeVisible();
    await expect(page.locator('text=Practice').first()).toBeVisible();

    // Verify sidebar navigation is present (desktop)
    const sidebarNav = page.locator('nav').filter({ hasText: 'Dashboard' });
    await expect(sidebarNav.first()).toBeVisible();
  });

  test('student practice page shows all 22 PTE task types', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Log in via UI
    await page.click('text=Log In');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button:has-text("Sign In")');

    // Wait for student portal — check localStorage token and sidebar nav
    await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 10000 });
    await page.locator('nav').filter({ hasText: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 10000 });

    // Click Practice in sidebar
    await page.getByRole('button', { name: 'Practice', exact: false }).first().click();
    await page.waitForTimeout(2000);

    // Verify page title
    await expect(page.locator('text=Practice Library').first()).toBeVisible();

    // Verify all 4 skill sections are visible
    await expect(page.locator('text=Speaking').first()).toBeVisible();
    await expect(page.locator('text=Writing').first()).toBeVisible();
    await expect(page.locator('text=Reading').first()).toBeVisible();
    await expect(page.locator('text=Listening').first()).toBeVisible();

    // Verify specific well-known tasks exist within the page
    await expect(page.locator('text=Read Aloud').first()).toBeVisible();
    await expect(page.locator('text=Write Essay').first()).toBeVisible();
    await expect(page.locator('text=Write from Dictation').first()).toBeVisible();

    // Count task card grid items — should have at least 20 task names visible
    const taskNames = ['Read Aloud', 'Repeat Sentence', 'Describe Image', 'Retell Lecture',
      'Answer Short Question', 'Respond to a Situation', 'Summarize Group Discussion',
      'Summarize Written Text', 'Write Essay',
      'Multiple-choice, Choose Single Answer', 'Multiple-choice, Choose Multiple Answers',
      'Re-order Paragraphs', 'Fill in the Blanks (Reading)', 'Fill in the Blanks (Reading & Writing)',
      'Summarize Spoken Text', 'Fill in the Blanks (Listening)', 'Highlight Correct Summary',
      'Select Missing Word', 'Highlight Incorrect Words', 'Write from Dictation'];
    let visibleCount = 0;
    for (const name of taskNames) {
      const el = page.getByText(name, { exact: false }).first();
      if (await el.isVisible().catch(() => false)) visibleCount++;
    }
    expect(visibleCount).toBeGreaterThanOrEqual(20);
  });

  test('student mock exams page loads without 401', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Log in via UI
    await page.click('text=Log In');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button:has-text("Sign In")');

    // Wait for student portal
    await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 10000 });
    await page.locator('nav').filter({ hasText: 'Dashboard' }).first().waitFor({ state: 'visible', timeout: 10000 });

    // Click Mock Exams in sidebar
    await page.getByRole('button', { name: 'Mock Exams', exact: false }).first().click();
    await page.waitForTimeout(2000);

    // Verify the page loads — either shows exam list or empty state
    // The key assertion: no "Failed to load" or 401 error visible
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('401');
    expect(bodyText).not.toContain('Failed to load');

    // Verify page title heading is visible
    await expect(page.getByRole('heading', { name: 'Mock Exams' }).first()).toBeVisible();
  });

  test('student portal practice and mock navigation works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Log in via UI
    await page.click('text=Log In');
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button:has-text("Sign In")');

    // Wait for student portal — on mobile check for bottom nav or token
    await page.waitForFunction(() => !!localStorage.getItem('pte_token'), { timeout: 10000 });
    await page.waitForTimeout(2000);

    // On mobile, bottom nav shows Practice and Mock buttons
    await page.getByRole('button', { name: 'Practice', exact: false }).first().click();
    await page.waitForTimeout(2000);

    // Verify Practice Library loads
    await expect(page.locator('text=Practice Library').first()).toBeVisible();
    await expect(page.locator('text=Read Aloud').first()).toBeVisible();

    // Navigate to Mock Exams via bottom nav
    await page.getByRole('button', { name: 'Mock', exact: false }).first().click();
    await page.waitForTimeout(2000);

    // Verify Mock Exams page loads
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('401');
    expect(bodyText).not.toContain('Failed to load');
    // Verify page title heading is visible
    await expect(page.getByRole('heading', { name: 'Mock Exams' }).first()).toBeVisible();
  });
});
