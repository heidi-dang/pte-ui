/**
 * Smoke test: mock exam entry flow.
 * Verifies student can discover, start, and resume mock exams.
 */
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

let passed = 0; let failed = 0;
function assert(cond, label) { if (cond) { passed++; console.log(`  PASS: ${label}`); } else { failed++; console.error(`  FAIL: ${label}`); } }

async function main() {
  console.log('=== Mock Exam Entry Flow Smoke ===\n');

  // Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  assert(!!token, 'Student login works');
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 1. Available mock test definitions/options
  console.log('\n--- Available mock tests ---');
  const testsRes = await fetch(`${BASE}/api/student/mock-tests`, { headers: { Authorization: `Bearer ${token}` } });
  const tests = await testsRes.json();
  assert(Array.isArray(tests), 'mock-tests returns array');
  assert(tests.length > 0, `At least 1 test option available (got ${tests.length})`);

  // 2. Active attempt — should be null initially
  console.log('\n--- Active attempt ---');
  const activeRes = await fetch(`${BASE}/api/student/mock-tests/active`, { headers: { Authorization: `Bearer ${token}` } });
  const activeData = await activeRes.json();
  // May or may not have active — don't assert, just observe
  console.log(`  Active attempt: ${activeData.activeAttempt ? activeData.activeAttempt.id : 'none'}`);

  // 3. Generate mini mock
  console.log('\n--- Generate mini mock ---');
  const genRes = await fetch(`${BASE}/api/student/mock-tests/generate`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ testType: 'mini' }),
  });
  const genData = await genRes.json();
  const test = genData.test || genData;
  assert(test.questions !== undefined, 'Generate returns questions');
  assert(test.questions.length >= 3, `Generated ${test.questions.length} questions`);

  // 4. Save-progress creates In_Progress attempt
  console.log('\n--- Save progress (start) ---');
  const saveRes = await fetch(`${BASE}/api/student/mock-tests/save-progress`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({
      testId: test.id, title: test.title, type: 'mini',
      currentQuestionIndex: 0, secondsRemaining: 600, answers: {},
      questionsJson: test.questions, isPaused: false,
    }),
  });
  const saveData = await saveRes.json();
  assert(saveData.success === true, 'Save-progress successful');
  assert(saveData.attempt.status === 'In_Progress', `Status is In_Progress (got ${saveData.attempt.status})`);
  const attemptId = saveData.attempt.id;
  assert(attemptId !== undefined, 'Attempt ID returned');

  // 5. Active endpoint returns resumable attempt
  console.log('\n--- Active resume endpoint ---');
  const activeRes2 = await fetch(`${BASE}/api/student/mock-tests/active`, { headers: { Authorization: `Bearer ${token}` } });
  const activeData2 = await activeRes2.json();
  assert(activeData2.activeAttempt !== null, 'Active attempt found');
  assert(activeData2.activeAttempt.id === attemptId, 'Active is the same attempt');
  assert(activeData2.activeAttempt.status === 'In_Progress', 'Active status is In_Progress');

  // 6. Pause the attempt
  console.log('\n--- Pause attempt ---');
  const pauseRes = await fetch(`${BASE}/api/student/mock-tests/save-progress`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({
      attemptId, testId: test.id, title: test.title, type: 'mini',
      currentQuestionIndex: 1, secondsRemaining: 550, answers: {},
      isPaused: true,
    }),
  });
  assert(pauseRes.ok === true, 'Pause request OK');
  const pauseData = await pauseRes.json();
  assert(pauseData.attempt.status === 'Paused', `Status is Paused (got ${pauseData.attempt.status})`);

  // 7. Active returns paused attempt
  console.log('\n--- Active after pause ---');
  const activeRes3 = await fetch(`${BASE}/api/student/mock-tests/active`, { headers: { Authorization: `Bearer ${token}` } });
  const activeData3 = await activeRes3.json();
  assert(activeData3.activeAttempt !== null, 'Paused attempt found by active endpoint');
  assert(activeData3.activeAttempt.status === 'Paused', 'Active status is Paused');

  // 8. Attempt detail includes question snapshots
  console.log('\n--- Attempt detail ---');
  const detailRes = await fetch(`${BASE}/api/student/mock-tests/attempt/${attemptId}`, { headers: { Authorization: `Bearer ${token}` } });
  const detailData = await detailRes.json();
  assert(detailData.id === attemptId, 'Detail returns correct attempt');
  assert(Array.isArray(detailData.questions), 'Detail has questions array');
  assert(detailData.questions.length >= 1, 'At least 1 question in snapshot');

  // 9. Can generate again for a different type
  console.log('\n--- Generate section mock ---');
  const genSectionRes = await fetch(`${BASE}/api/student/mock-tests/generate`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ testType: 'section', focusSection: 'Speaking' }),
  });
  const genSectionData = await genSectionRes.json();
  const sectionTest = genSectionData.test || genSectionData;
  assert(sectionTest.questions !== undefined, 'Section generate returns questions');

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('Crash:', err); process.exit(1); });
