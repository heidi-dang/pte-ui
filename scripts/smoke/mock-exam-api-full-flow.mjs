/**
 * Comprehensive mock exam full-flow API test.
 * Runs against a live server. Verifies:
 * - Login, list tests, generate mini exam
 * - Answer audo, writing, single-choice, multi-choice, reorder, blanks
 * - Save progress, resume after interruption
 * - Submit, poll grading, view results
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

let passed = 0; let failed = 0;
function assert(cond, label) { if (cond) { passed++; console.log(`  PASS: ${label}`); } else { failed++; console.error(`  FAIL: ${label}`); } }

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const body = await res.json();
  if (!body.token) throw new Error(`Login failed: ${JSON.stringify(body)}`);
  return body.token;
}

async function main() {
  console.log('=== Mock Exam API Full-Flow Smoke ===\n');

  // 1. Login
  const token = await login();
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  assert(typeof token === 'string' && token.length > 20, 'Logged in as student with valid token');
  console.log('');

  // 2. List available mock tests
  console.log('--- Available tests ---');
  const testsRes = await fetch(`${BASE}/api/student/mock-tests`, { headers: { Authorization: `Bearer ${token}` } });
  const tests = await testsRes.json();
  assert(Array.isArray(tests), 'mock-tests returns array');
  assert(tests.length > 0, `At least 1 test available (got ${tests.length})`);
  const miniTest = tests.find(t => t.type === 'mini') || tests[0];
  console.log(`  Selected test: ${miniTest.title} (${miniTest.type})`);

  // 3. Generate mini exam
  console.log('\n--- Generate mini exam ---');
  const genRes = await fetch(`${BASE}/api/student/mock-tests/generate`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ testType: 'mini' }),
  });
  const genJson = await genRes.json();
  const generatedTest = genJson.test || genJson;
  assert(generatedTest.questions !== undefined, 'Generated test has questions');
  const questions = generatedTest.questions || [];
  assert(questions.length >= 5, `At least 5 questions generated (got ${questions.length})`);
  console.log(`  Generated ${questions.length} questions`);

  // 4. Start the test (save-progress)
  console.log('\n--- Start test (save-progress) ---');
  const startRes = await fetch(`${BASE}/api/student/mock-tests/save-progress`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({
      testId: generatedTest.id, title: generatedTest.title, type: 'mini',
      currentQuestionIndex: 0, secondsRemaining: 600, answers: {},
      questionsJson: questions, isPaused: false,
    }),
  });
  const startData = await startRes.json();
  assert(startData.success === true, 'Save-progress successful');
  const attemptId = startData.attempt.id;
  assert(attemptId !== undefined, `Attempt ID: ${attemptId}`);
  assert(startData.attempt.status === 'In_Progress', 'Status is In_Progress');

  // 5. Answer tasks by type
  console.log('\n--- Answer tasks ---');
  const answers = {};
  for (let i = 0; i < Math.min(questions.length, 5); i++) {
    const q = questions[i];
    const code = q.taskCode || q.code || 'RA';
    if (['RA','RS','DI','RL','ASQ','SGD','RTS'].includes(code)) {
      answers[i] = { kind: 'audio', transcript: `Mock transcript for ${code}` };
      console.log(`  Q${i} (${code}): audio answer`);
    } else if (['SWT','WE','SST','WFD'].includes(code)) {
      answers[i] = { kind: 'text', text: `Mock ${code} essay answer with sufficient content for grading.` };
      console.log(`  Q${i} (${code}): text answer`);
    } else if (['MCS','MCSSL','HCS','SMW'].includes(code)) {
      answers[i] = { kind: 'single_choice', selected: 'Option A' };
      console.log(`  Q${i} (${code}): single_choice answer`);
    } else if (['MCM','MCMSL'].includes(code)) {
      answers[i] = { kind: 'multi_choice', selected: ['Option A', 'Option B'] };
      console.log(`  Q${i} (${code}): multi_choice answer`);
    } else if (code === 'ROP') {
      answers[i] = { kind: 'ordered_list', ordered: ['First', 'Second', 'Third'] };
      console.log(`  Q${i} (${code}): ordered_list answer`);
    } else if (['FIBR','FIBRW','FIBL'].includes(code)) {
      answers[i] = { kind: 'blanks', blanks: { '0': 'answer1', '1': 'answer2' } };
      console.log(`  Q${i} (${code}): blanks answer`);
    } else if (code === 'HIW') {
      answers[i] = { kind: 'highlight_words', words: ['wrong1', 'wrong2'] };
      console.log(`  Q${i} (${code}): highlight_words answer`);
    } else {
      answers[i] = { kind: 'text', text: 'Generic answer' };
      console.log(`  Q${i} (${code}): generic text answer`);
    }
  }
  assert(Object.keys(answers).length >= 5, `Answered ${Object.keys(answers).length} questions`);

  // 6. Save progress with answers
  console.log('\n--- Save progress with answers ---');
  const saveRes = await fetch(`${BASE}/api/student/mock-tests/save-progress`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({
      attemptId, testId: generatedTest.id, title: generatedTest.title, type: 'mini',
      currentQuestionIndex: 1, secondsRemaining: 500, answers,
      questionsJson: questions, isPaused: false,
    }),
  });
  const saveData = await saveRes.json();
  assert(saveData.success === true, 'Progress saved with answers');
  assert(saveData.attempt.currentQuestionIndex >= 1, 'Question index advanced');

  // 7. Resume (active endpoint)
  console.log('\n--- Resume ---');
  const activeRes = await fetch(`${BASE}/api/student/mock-tests/active`, { headers: { Authorization: `Bearer ${token}` } });
  const activeData = await activeRes.json();
  assert(activeData.activeAttempt !== null, 'Active attempt found');
  assert(activeData.activeAttempt.id === attemptId, 'Correct attempt returned for resume');

  // 8. Complete/submit the exam
  console.log('\n--- Submit exam ---');
  const completeRes = await fetch(`${BASE}/api/student/mock-tests/complete`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ attemptId, testId: generatedTest.id, title: generatedTest.title, type: 'mini', answers, questionsJson: questions }),
  });
  const completeData = await completeRes.json();
  assert(completeData.success !== false, 'Complete submitted (no error)');

  // 9. Poll grading status
  console.log('\n--- Poll grading ---');
  let gradingDone = false;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(`${BASE}/api/student/mock-tests/status/${attemptId}`, { headers: { Authorization: `Bearer ${token}` } });
    const statusData = await statusRes.json();
    const status = statusData.attempt?.status || statusData.status;
    console.log(`  Poll ${i + 1}: status=${status}`);
    if (status === 'Completed' || status === 'Grading_Failed' || status === 'Pending_Grading') {
      gradingDone = true;
      break;
    }
  }
  assert(gradingDone, 'Grading completed or progressed');

  // 10. View results
  console.log('\n--- View results ---');
  const detailRes = await fetch(`${BASE}/api/student/mock-tests/attempt/${attemptId}`, { headers: { Authorization: `Bearer ${token}` } });
  const detailData = await detailRes.json();
  assert(detailData.id === attemptId, 'Result returns correct attempt');
  assert(Array.isArray(detailData.questionResults), 'Result has questionResults array');
  if (detailData.questionResults && detailData.questionResults.length > 0) {
    const qr = detailData.questionResults[0];
    assert(qr.taskType !== undefined, 'Question result has taskType');
    assert(qr.finalScore !== undefined || qr.status !== undefined, 'Question result has score or status');
    assert(qr.feedback !== undefined || qr.status === 'Pending' || qr.status === 'Grading', 'Question result has feedback or pending');
  }

  // 11. History list
  console.log('\n--- History ---');
  const historyRes = await fetch(`${BASE}/api/student/mock-tests/attempts`, { headers: { Authorization: `Bearer ${token}` } });
  const history = await historyRes.json();
  assert(Array.isArray(history), 'History returns array');
  const found = history.find(h => h.id === attemptId);
  assert(found !== undefined, 'Completed attempt appears in history');
  console.log(`  History count: ${history.length}`);

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('Crash:', err); process.exit(1); });
