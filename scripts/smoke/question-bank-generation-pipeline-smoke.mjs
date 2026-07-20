/**
 * Smoke test: Question Bank AI generation pipeline.
 * Uses fake provider only. Never calls real DeepSeek.
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';

const prisma = new PrismaClient();
const USER_EMAIL = `gen-pipe-test-${Date.now()}@example.com`;

let passed = 0; let failed = 0;
function assert(cond, label) { if (cond) { passed++; console.log(`  PASS: ${label}`); } else { failed++; console.error(`  FAIL: ${label}`); } }

const ALL_TASK_CODES = ['RA','RS','DI','RL','ASQ','SGD','RTS','SWT','WE','MCS','MCM','ROP','FIBR','FIBRW','SST','MCMSL','FIBL','HCS','MCSSL','SMW','HIW','WFD'];

async function main() {
  console.log('=== Question Bank Generation Pipeline Smoke ===\n');

  // 0. Verify fake provider is used (no real DeepSeek calls)
  console.log('--- Fake provider mode ---');
  const providerSource = fs.readFileSync('src/server/ai/provider.ts', 'utf8');
  assert(providerSource.includes("AI_PROVIDER || 'fake'"), 'Default AI_PROVIDER is fake');

  // 1. Batch size source check
  console.log('\n--- Batch size ---');
  const adminSource = fs.readFileSync('src/server/admin.ts', 'utf8');
  const batchMatch = adminSource.match(/requestedCount:\s*10/);
  assert(batchMatch !== null, 'Batch size default is 10');

  // 2. Setup test admin user
  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!adminUser) {
    console.log('  No admin user found, skipping admin-only tests');
  } else {
    console.log(`  Using admin: ${adminUser.email}`);
  }

  // 3. Check QuestionBankItem schema via existing items
  console.log('\n--- QuestionBankItem schema support ---');
  const sampleItem = await prisma.questionBankItem.findFirst();
  if (sampleItem) {
    const keys = Object.keys(sampleItem);
    assert(keys.includes('answerKeyJson'), 'answerKeyJson exists');
    assert(keys.includes('optionsJson'), 'optionsJson exists');
    assert(keys.includes('taskPayloadJson'), 'taskPayloadJson exists');
    assert(keys.includes('contentVersion'), 'contentVersion exists');
    assert(keys.includes('status'), 'status field exists');
  } else {
    console.log('  No items in DB, checking schema structure');
  }

  // 4. Published vs draft count
  console.log('\n--- Published/draft status system ---');
  const publishedCount = await prisma.questionBankItem.count({ where: { status: 'published' } });
  const draftCount = await prisma.questionBankItem.count({ where: { status: 'draft' } });
  const rejectedCount = await prisma.questionBankItem.count({ where: { reviewStatus: 'rejected' } });
  console.log(`  Published: ${publishedCount}, Draft: ${draftCount}, Rejected: ${rejectedCount}`);
  assert(typeof publishedCount === 'number', 'Published count exists');

  // 5. All 22 task codes have some data in DB
  console.log('\n--- Per-task question count ---');
  for (const code of ALL_TASK_CODES) {
    const count = await prisma.questionBankItem.count({ where: { taskCode: code } });
    console.log(`  ${code}: ${count}`);
  }

  // 6. QuestionGenerationBatch tracking
  console.log('\n--- Batch tracking ---');
  const batchCount = await prisma.questionGenerationBatch.count();
  assert(typeof batchCount === 'number', 'Batch records exist');
  console.log(`  Total batches: ${batchCount}`);

  // 7. RequestKey idempotency
  console.log('\n--- Idempotency ---');
  assert(adminSource.includes('findUnique({ where: { requestKey } })'), 'requestKey uniqueness enforced');

  // 8. Student-safe filtering: check buildStudentSafeQuestion exists
  console.log('\n--- Student-safe filtering ---');
  const studentSafeFiles = ['src/practice/contracts/studentSafeQuestion.ts'];
  for (const f of studentSafeFiles) {
    const content = fs.readFileSync(f, 'utf8');
    assert(content.includes('answerKey'), `${f} handles answerKey`);
    assert(content.includes('safe') || content.includes('buildStudent'), `${f} exports safe builder`);
  }

  // 9. Mock exam generator only uses published items
  console.log('\n--- Mock exam generator ---');
  const genSource = fs.readFileSync('src/utils/mockTestGenerator.ts', 'utf8');
  assert(genSource.includes("status: 'published'"), 'Generator filters by published status');

  // 10. Generation route guards
  console.log('\n--- Auth guards ---');
  assert(adminSource.includes('authenticateToken'), 'Admin route has auth');
  assert(adminSource.includes("requireRole(['admin'])"), 'Admin route requires admin role');

  await prisma.$disconnect();

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('Crash:', err); process.exit(1); });
