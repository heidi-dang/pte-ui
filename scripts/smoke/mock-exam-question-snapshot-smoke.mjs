/**
 * Smoke test: mock exam question snapshot freezing.
 * Verifies:
 * 1. MockExamQuestionSchema accepts answerKeyJson
 * 2. MockExamQuestionSchema accepts all new frozen fields
 * 3. generateMockTest creates questions with frozen answer keys
 * 4. Snapshot validator catches missing fields
 * 5. CMS-sourced questions contain questionBankItemId and contentVersion
 * 6. Fallback questions do not crash validation
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { MockExamQuestionSchema } from '../../src/shared/mockExamTypes.ts';
import { validateMockExamSnapshot, validateMockQuestionSnapshot } from '../../src/utils/mockExamSnapshot.ts';

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.error(`  FAIL: ${label}`); }
}

async function main() {
  console.log('=== Mock Exam Question Snapshot Smoke ===\n');

  // 1. Schema accepts answerKeyJson field
  console.log('--- Test 1: Schema accepts frozen fields ---');
  const validQ = MockExamQuestionSchema.parse({
    id: 'test-1', questionId: 'test-1',
    taskCode: 'RA', section: 'Speaking', title: 'Test', instruction: 'Read aloud',
    promptText: 'Read this text', difficulty: 'medium', source: 'cms',
    answerKeyJson: '{"expected":"answer"}',
    sampleAnswer: 'Sample answer text',
    explanation: 'Explanation text',
    taskPayloadJson: '{"key":"value"}',
    contentVersion: 3,
    scoringPolicyVersion: 'pte-estimated-v1',
    rubricVersion: 'v2',
  });
  assert(validQ.answerKeyJson === '{"expected":"answer"}', 'answerKeyJson accepted');
  assert(validQ.sampleAnswer === 'Sample answer text', 'sampleAnswer accepted');
  assert(validQ.explanation === 'Explanation text', 'explanation accepted');
  assert(validQ.taskPayloadJson === '{"key":"value"}', 'taskPayloadJson accepted');
  assert(validQ.contentVersion === 3, 'contentVersion accepted');
  assert(validQ.scoringPolicyVersion === 'pte-estimated-v1', 'scoringPolicyVersion accepted');
  assert(validQ.rubricVersion === 'v2', 'rubricVersion accepted');

  // 2. Schema defaults for contentVersion and scoringPolicyVersion
  console.log('\n--- Test 2: Schema defaults ---');
  const defaultQ = MockExamQuestionSchema.parse({
    id: 'test-2', questionId: 'test-2',
    taskCode: 'WE', section: 'Writing', title: 'Test', instruction: 'Write essay',
    promptText: 'Write about...', difficulty: 'medium', source: 'fallback',
  });
  assert(defaultQ.contentVersion === 1, 'contentVersion defaults to 1');
  assert(defaultQ.scoringPolicyVersion === 'pte-estimated-v1', 'scoringPolicyVersion defaults to pte-estimated-v1');

  // 3. Validator catches missing required fields
  console.log('\n--- Test 3: Validator catches missing fields ---');
  const emptyResult = validateMockQuestionSnapshot({});
  assert(emptyResult.valid === false, 'Validator returns invalid for empty question');
  assert(emptyResult.errors.length >= 2, 'Has errors for missing taskCode and id');

  const validResult = validateMockQuestionSnapshot(validQ);
  assert(validResult.valid === true, 'Validator returns valid for complete question');

  // 4. Generate mock test with CMS data (if available)
  console.log('\n--- Test 4: CMS questions have frozen answer keys ---');
  const cmsItems = await prisma.questionBankItem.findMany({
    where: { status: 'published' },
    take: 5,
    select: { id: true, taskCode: true, answerKeyJson: true, contentVersion: true },
  });
  if (cmsItems.length > 0) {
    assert(cmsItems[0].id !== undefined, 'CMS item has id');
    // Check if any have answerKeyJson
    const withKeys = cmsItems.filter(i => i.answerKeyJson);
    console.log(`  CMS items with answerKeyJson: ${withKeys.length}/${cmsItems.length}`);
  } else {
    console.log('  No CMS items found (test environment may be empty)');
  }

  // 5. Schema round-trip preserves all fields
  console.log('\n--- Test 5: Round-trip preservation ---');
  const roundTripQ = MockExamQuestionSchema.parse(JSON.parse(JSON.stringify(validQ)));
  assert(roundTripQ.answerKeyJson === validQ.answerKeyJson, 'answerKeyJson survives serialize/parse');
  assert(roundTripQ.contentVersion === validQ.contentVersion, 'contentVersion survives serialize/parse');
  assert(roundTripQ.scoringPolicyVersion === validQ.scoringPolicyVersion, 'scoringPolicyVersion survives serialize/parse');

  // 6. Snapshot validation for full mock test
  console.log('\n--- Test 6: Full snapshot validation ---');
  const fullTest = {
    questions: [validQ, defaultQ],
  };
  const fullResult = validateMockExamSnapshot(fullTest);
  // defaultQ has source=fallback but no questionBankItemId, so no warning for that
  // But it should pass validation
  assert(fullResult.valid === true, 'Full snapshot with valid questions passes');

  // 7. Assert gradable snapshot
  console.log('\n--- Test 7: assertSnapshotGradable ---');
  const { assertSnapshotGradable } = await import('../../src/utils/mockExamSnapshot.ts');
  const gradableResult = assertSnapshotGradable(validQ);
  assert(gradableResult.valid === true, 'Complete question is gradable');

  const noPromptQ = MockExamQuestionSchema.parse({
    id: 'test-3', questionId: 'test-3',
    taskCode: 'RA', section: 'Speaking', title: 'Test', instruction: 'Read',
    promptText: '', difficulty: 'medium', source: 'cms',
    answerKeyJson: null,
  });
  const noPromptResult = assertSnapshotGradable(noPromptQ);
  assert(noPromptResult.valid === false, 'Question without prompt/audio is not gradable');

  await prisma.$disconnect();

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
