#!/usr/bin/env node

/**
 * Smoke test for Mock Exam system.
 * Verifies question generation, completion queuing, background job grading, and scoring reports.
 */

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';

let token = '';
let attemptId = '';

function bail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

async function fetchJson(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${url}`, { ...opts, headers });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`${res.status} ${body.error || body.message || res.statusText} (${url})`);
  }
  return body;
}

async function step1_login() {
  console.log('[1/5] Logging in student...');
  const data = await fetchJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!data.token) bail('No token returned from login');
  token = data.token;
  console.log('  Logged in successfully');
}

async function step2_generateMockQuestions() {
  console.log('[2/5] Testing dynamic mock test generator endpoint...');
  const result = await fetchJson('/api/student/mock-tests/generate', {
    method: 'POST',
    body: JSON.stringify({
      testType: 'mini',
    }),
  });

  if (!result || !result.success || !result.test || !Array.isArray(result.test.questions)) {
    bail('Invalid response from mock question generator');
  }
  console.log(`  Successfully generated ${result.test.questions.length} questions for dynamic test: "${result.test.title}"`);
  return result.test;
}

async function step3_completeMockTest(generatedTest) {
  console.log('[3/5] Submitting mock test completion...');
  
  const answers = {};
  generatedTest.questions.forEach((q, idx) => {
    if (q.taskCode === 'ROP') {
      answers[idx] = JSON.stringify(['A', 'B', 'C']);
    } else if (q.taskCode === 'MCS' || q.taskCode === 'MCM') {
      answers[idx] = 'Option A';
    } else {
      answers[idx] = 'This is the sample typed student response for the mock exam.';
    }
  });

  const response = await fetchJson('/api/student/mock-tests/complete', {
    method: 'POST',
    body: JSON.stringify({
      testId: generatedTest.id,
      title: generatedTest.title,
      type: 'mini',
      overallScore: 0,
      speakingScore: 0,
      writingScore: 0,
      readingScore: 0,
      listeningScore: 0,
      answers,
      questionsJson: generatedTest.questions,
    }),
  });

  if (!response || !response.success || !response.attempt) {
    bail('Failed to complete mock test attempt');
  }
  if (response.attempt.overallScore !== null) {
    bail('FAIL: Pending overallScore is not null! Got: ' + response.attempt.overallScore);
  }
  if (response.attempt.speakingScore !== null) {
    bail('FAIL: Pending speakingScore is not null! Got: ' + response.attempt.speakingScore);
  }
  attemptId = response.attempt.id;
  console.log(`  Mock test attempt recorded: ${attemptId}. Graded status: ${response.attempt.status} (overallScore: ${response.attempt.overallScore})`);
}

async function step4_waitForGrading() {
  console.log('[4/5] Waiting for background AI grading processor...');
  
  for (let i = 0; i < 10; i++) {
    console.log(`  Checking attempt status (attempt ${i + 1}/10)...`);
    const attempts = await fetchJson('/api/student/mock-tests/attempts');
    const myAttempt = attempts.find(a => a.id === attemptId);
    
    if (myAttempt && myAttempt.overallScore > 0) {
      console.log(`  GRADED! Overall score: ${myAttempt.overallScore}/90`);
      console.log(`  Subscores -> Speaking: ${myAttempt.speakingScore}, Writing: ${myAttempt.writingScore}, Reading: ${myAttempt.readingScore}, Listening: ${myAttempt.listeningScore}`);
      return;
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  bail('Timed out waiting for background job to grade the mock test.');
}

async function step5_verifyReports() {
  console.log('[5/5] Verifying mock test is present in dashboard reports...');
  const attempts = await fetchJson('/api/student/mock-tests/attempts');
  const myAttempt = attempts.find(a => a.id === attemptId);
  if (!myAttempt) bail('Mock test attempt not found in student history list');
  if (myAttempt.status !== 'Completed') bail(`Attempt status should be Completed, got: ${myAttempt.status}`);
  console.log('  Confirmed mock test in history reports');
}

(async () => {
  try {
    await step1_login();
    const test = await step2_generateMockQuestions();
    await step3_completeMockTest(test);
    await step4_waitForGrading();
    await step5_verifyReports();
    console.log('\nPASS: All mock exam smoke tests passed.');
    process.exit(0);
  } catch (err) {
    console.error('FAIL:', err.message);
    process.exit(1);
  }
})();
