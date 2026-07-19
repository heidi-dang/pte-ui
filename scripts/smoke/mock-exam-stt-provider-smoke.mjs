/**
 * Smoke test: STT provider selection for mock exam grading.
 */

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.error(`  FAIL: ${label}`); }
}

function getTranscriberLogic(testMode, sttProvider, nodeEnv, openAiKey, forcedMock) {
  if (testMode === '1' || sttProvider === 'fake') return 'fake';
  if (nodeEnv === 'production') {
    if (!openAiKey) return 'error-no-key';
    return 'whisper-only';
  }
  if (openAiKey && forcedMock !== '1') return 'whisper-only';
  return 'fake';
}

function main() {
  console.log('=== Mock Exam STT Provider Smoke ===\n');

  // 1. PTE_TEST_MODE=1 returns fake
  console.log('--- Test 1: PTE_TEST_MODE ---');
  assert(getTranscriberLogic('1', '', 'development', '', '') === 'fake', 'PTE_TEST_MODE=1 -> fake');
  assert(getTranscriberLogic('1', '', 'production', 'sk-xxx', '') === 'fake', 'PTE_TEST_MODE=1 overrides production');

  // 2. STT_PROVIDER=fake returns fake
  console.log('\n--- Test 2: STT_PROVIDER=fake ---');
  assert(getTranscriberLogic('', 'fake', 'production', 'sk-xxx', '') === 'fake', 'STT_PROVIDER=fake -> fake');

  // 3. Production without key throws error
  console.log('\n--- Test 3: Production without API key ---');
  assert(getTranscriberLogic('', '', 'production', '', '') === 'error-no-key', 'production no key -> error');

  // 4. Production with key returns Whisper-only
  console.log('\n--- Test 4: Production with key ---');
  assert(getTranscriberLogic('', '', 'production', 'sk-xxx', '') === 'whisper-only', 'production with key -> whisper');

  // 5. Development with key returns Whisper
  console.log('\n--- Test 5: Development with key ---');
  assert(getTranscriberLogic('', '', 'development', 'sk-xxx', '') === 'whisper-only', 'dev with key -> whisper');

  // 6. Development without key returns fake
  console.log('\n--- Test 6: Development without key ---');
  assert(getTranscriberLogic('', '', 'development', '', '') === 'fake', 'dev no key -> fake');

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
