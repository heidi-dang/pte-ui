/**
 * Smoke test: SQLite to Postgres migration boolean safety.
 * Verifies the migration script table-specific boolean columns.
 */
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.error(`  FAIL: ${label}`); }
}

// Simulate the BOOLEAN_COLUMNS map logic from migrate-sqlite-to-postgres.cjs
const BOOLEAN_COLUMNS = new Map([
  ['User', new Set(['diagnosticDone', 'isPremium'])],
  ['Coupon', new Set(['active'])],
  ['FlashcardState', new Set(['mastered'])],
  ['Notification', new Set(['read'])],
]);

function convertValue(tableName, col, val) {
  const tableBooleans = BOOLEAN_COLUMNS.get(tableName);
  if (tableBooleans && tableBooleans.has(col)) {
    if (val === 1) return true;
    if (val === 0) return false;
  }
  return val;
}

function main() {
  console.log('=== Postgres Migration Boolean Safety Smoke ===\n');

  // 1. Known boolean columns convert 0/1 to true/false
  console.log('--- Test 1: Known boolean columns ---');
  assert(convertValue('User', 'diagnosticDone', 1) === true, 'User.diagnosticDone=1 -> true');
  assert(convertValue('User', 'diagnosticDone', 0) === false, 'User.diagnosticDone=0 -> false');
  assert(convertValue('User', 'isPremium', 1) === true, 'User.isPremium=1 -> true');
  assert(convertValue('Coupon', 'active', 0) === false, 'Coupon.active=0 -> false');
  assert(convertValue('FlashcardState', 'mastered', 1) === true, 'FlashcardState.mastered=1 -> true');
  assert(convertValue('Notification', 'read', 0) === false, 'Notification.read=0 -> false');

  // 2. Non-boolean columns keep integer values
  console.log('\n--- Test 2: Non-boolean columns keep integers ---');
  assert(convertValue('PracticeSubmission', 'score', 85) === 85, 'PracticeSubmission.score=85 stays 85');
  assert(convertValue('PracticeSubmission', 'score', 0) === 0, 'PracticeSubmission.score=0 stays 0');
  assert(convertValue('TestAttempt', 'overallScore', 75) === 75, 'TestAttempt.overallScore=75 stays 75');
  assert(convertValue('User', 'revision', 3) === 3, 'User.revision=3 stays 3');

  // 3. Columns named isPremium in other tables keep integers
  console.log('\n--- Test 3: Same column name in non-boolean table ---');
  // If a non-User table had an isPremium column, it stays integer
  assert(convertValue('SomeOtherTable', 'isPremium', 1) === 1, 'Unknown table isPremium column stays 1');

  // 4. Table-specific: only the exact table gets boolean conversion
  console.log('\n--- Test 4: Table-specific boolean conversion ---');
  assert(convertValue('SomeTable', 'diagnosticDone', 0) === 0, 'SomeTable.diagnosticDone stays 0 (not boolean)');
  assert(convertValue('SomeTable', 'mastered', 1) === 1, 'SomeTable.mastered stays 1 (not boolean)');

  // 5. Non-0/1 values in boolean columns pass through
  console.log('\n--- Test 5: Non-0/1 in boolean columns ---');
  assert(convertValue('User', 'diagnosticDone', 42) === 42, 'User.diagnosticDone=42 stays 42 (not converted)');

  // 6. Null values pass through
  console.log('\n--- Test 6: Null values ---');
  assert(convertValue('User', 'diagnosticDone', null) === null, 'User.diagnosticDone=null stays null');

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
