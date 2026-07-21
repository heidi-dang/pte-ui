/**
 * Final smoke: Question Bank CMS AI readiness.
 * Verifies UI loading state, enum schema, and CI wiring.
 */
import fs from 'fs';

let passed = 0; let failed = 0;
function assert(cond, label) { if (cond) { passed++; console.log(`  PASS: ${label}`); } else { failed++; console.error(`  FAIL: ${label}`); } }

function main() {
  console.log('=== Question Bank Final Readiness Smoke ===\n');

  // 1. UI loading state code path exists
  console.log('--- UI loading state ---');
  const dialogSource = fs.readFileSync('src/components/admin/question-bank/GenerationDialog.tsx', 'utf8');
  assert(dialogSource.includes('setLoading(true)'), 'Loading state set on submit');
  assert(dialogSource.includes('disabled={loading}'), 'Button disabled while loading');
  assert(dialogSource.includes("'Queuing Batch Generation...'") || dialogSource.includes("Queuing Batch Generation"), 'Loading text shown');

  const panelSource = fs.readFileSync('src/components/admin/question-bank/QuestionBankPanel.tsx', 'utf8');
  assert(panelSource.includes('rate_limit') || panelSource.includes('429'), 'Friendly 429 handling exists');
  assert(panelSource.includes('generation_in_progress') || panelSource.includes('Generating'), 'Friendly active-batch handling exists');

  // 2. Generation dialog has 22 task types
  console.log('\n--- 22 task types in UI ---');
  // Check for the ALL_TASKS array entries instead of <option> tags
  const taskOptions = dialogSource.match(/code:\s*'[A-Z]{2,5}'/g) || [];
  const taskCount = taskOptions.length;
  assert(taskCount >= 22, `22 task options (got ${taskCount})`);

  // 3. Prisma enum definitions exist
  console.log('\n--- DB enum constraints ---');
  const schemaSource = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(schemaSource.includes('enum QuestionStatus'), 'QuestionStatus enum defined');
  assert(schemaSource.includes('enum QuestionSection'), 'QuestionSection enum defined');
  assert(schemaSource.includes('enum QuestionDifficulty'), 'QuestionDifficulty enum defined');
  assert(schemaSource.includes('enum QuestionSource'), 'QuestionSource enum defined');
  assert(schemaSource.includes('enum GenerationBatchStatus'), 'GenerationBatchStatus enum defined');
  assert(schemaSource.includes('status            QuestionStatus'), 'QuestionBankItem.status uses enum');
  assert(schemaSource.includes('section           QuestionSection'), 'QuestionBankItem.section uses enum');
  assert(schemaSource.includes('difficulty        QuestionDifficulty'), 'QuestionBankItem.difficulty uses enum');
  assert(schemaSource.includes('source            QuestionSource?'), 'QuestionBankItem.source uses enum');
  assert(schemaSource.includes('status            GenerationBatchStatus'), 'QuestionGenerationBatch.status uses enum');

  // 4. CI runs the admin E2E test
  console.log('\n--- CI wiring ---');
  const ciSource = fs.readFileSync('.github/workflows/ci-cd.yml', 'utf8');
  assert(ciSource.includes('question-bank-generation-admin.spec.ts'), 'E2E test wired into CI');
  assert(ciSource.includes('question-bank-generation-pipeline-smoke.mjs'), 'Pipeline smoke deferred to server-smoke');
  assert(ciSource.includes('DEMO_MODE'), 'CI uses DEMO_MODE (avoids production mode)');

  // 5. E2E test file exists
  console.log('\n--- E2E file exists ---');
  const e2eSource = fs.readFileSync('tests/e2e/question-bank-generation-admin.spec.ts', 'utf8');
  assert(e2eSource.includes('admin can log in'), 'Admin login test exists');
  assert(e2eSource.includes('student'), 'Student access test exists');
  assert(e2eSource.includes('Question Bank'), 'CMS content check exists');

  // 6. No real DeepSeek key in CI config
  console.log('\n--- No real DeepSeek in CI ---');
  assert(!ciSource.includes('DEEPSEEK_API_KEY='), 'No DEEPSEEK_API_KEY value in CI config');
  assert(!ciSource.includes('openai'), 'No openai key in CI config');
  assert(ciSource.includes('DEMO_MODE'), 'CI uses DEMO_MODE for test config');

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
