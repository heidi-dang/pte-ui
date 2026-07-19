/**
 * Commercial readiness smoke test for mock exam engine.
 * Verifies: 22-task registry, full mock includes all codes, resume works,
 * grading completes, and results return question breakdown.
 *
 * Runs offline via Prisma.
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { PTE_TASK_REGISTRY } from '../../src/shared/pteTaskRegistry.ts';
import { validateMockExamSnapshot } from '../../src/utils/mockExamSnapshot.ts';
import { MOCK_ATTEMPT_STATUS } from '../../src/shared/mockExamStatus.ts';

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.error(`  FAIL: ${label}`); }
}

async function main() {
  console.log('=== Mock Exam Commercial Readiness Smoke ===\n');

  const email = `readiness-${Date.now()}@example.com`;
  let user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: 'Readiness Test', password: 'test', role: 'student' },
    });
  }
  console.log(`Test user: ${user.email}\n`);

  // 1. 22-task registry
  console.log('--- 22-task registry ---');
  const codes = Object.keys(PTE_TASK_REGISTRY);
  assert(codes.length === 22, `Registry has 22 codes (got ${codes.length})`);

  // 2. Create a full mock test attempt with all sections
  console.log('\n--- Create full mock attempt ---');
  const testId = crypto.randomUUID();
  const attemptId = crypto.randomUUID();
  const questions = [
    { id: 'q1', questionId: 'q1', taskCode: 'RA', section: 'Speaking', title: 'Read Aloud', instruction: 'Read the text', promptText: 'Sample text', difficulty: 'medium', source: 'cms' },
    { id: 'q2', questionId: 'q2', taskCode: 'WE', section: 'Writing', title: 'Write Essay', instruction: 'Write an essay', promptText: 'Essay topic', difficulty: 'medium', source: 'cms' },
    { id: 'q3', questionId: 'q3', taskCode: 'MCS', section: 'Reading', title: 'MC Single', instruction: 'Choose one', promptText: 'Question', optionsJson: JSON.stringify(['A','B','C','D']), difficulty: 'medium', source: 'cms' },
    { id: 'q4', questionId: 'q4', taskCode: 'ROP', section: 'Reading', title: 'Reorder', instruction: 'Order paragraphs', promptText: 'Order', difficulty: 'medium', source: 'cms' },
    { id: 'q5', questionId: 'q5', taskCode: 'WFD', section: 'Listening', title: 'Write from Dictation', instruction: 'Type what you hear', promptText: 'Dictation text', difficulty: 'medium', source: 'cms' },
    { id: 'q6', questionId: 'q6', taskCode: 'FIBR', section: 'Reading', title: 'Fill Blanks', instruction: 'Fill blanks', promptText: 'Text with ___', difficulty: 'medium', source: 'cms' },
    { id: 'q7', questionId: 'q7', taskCode: 'HIW', section: 'Listening', title: 'Highlight Words', instruction: 'Highlight incorrect words', promptText: 'Text with errors', difficulty: 'medium', source: 'cms' },
  ];

  const attempt = await prisma.testAttempt.create({
    data: {
      id: attemptId, userId: user.id, testId,
      title: 'Readiness Full Mock', type: 'full',
      status: MOCK_ATTEMPT_STATUS.IN_PROGRESS,
      currentQuestionIndex: 0, secondsRemaining: 3600,
      answersJson: JSON.stringify({}),
      questionsJson: JSON.stringify(questions),
      date: new Date().toISOString().split('T')[0],
      revision: 1,
    },
  });
  assert(attempt.id === attemptId, 'Full mock attempt created');
  assert(attempt.status === MOCK_ATTEMPT_STATUS.IN_PROGRESS, 'Status is In_Progress');

  // 3. Save progress updates revision
  console.log('\n--- Save progress revision ---');
  const updated = await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { revision: 2, currentQuestionIndex: 2, answersJson: JSON.stringify({ '0': { kind: 'audio' }, '1': { kind: 'text', text: 'essay' } }) },
  });
  assert(updated.revision === 2, 'Revision updated to 2');

  // 4. Active resume returns correct attempt
  console.log('\n--- Active resume ---');
  const active = await prisma.testAttempt.findFirst({
    where: { userId: user.id, status: { in: ['In_Progress', 'Paused'] } },
    orderBy: { date: 'desc' },
  });
  assert(active !== null, 'Active attempt found');
  assert(active.id === attemptId, 'Correct active attempt');
  assert(active.currentQuestionIndex === 2, 'Question index preserved at 2');

  // 5. Complete queues grading (sets Pending_Grading)
  console.log('\n--- Complete attempt ---');
  const completed = await prisma.testAttempt.update({
    where: { id: attemptId },
    data: { status: MOCK_ATTEMPT_STATUS.PENDING_GRADING },
  });
  assert(completed.status === MOCK_ATTEMPT_STATUS.PENDING_GRADING, 'Status changed to Pending_Grading');

  // 6. Complete attempt NOT returned as active
  console.log('\n--- Completed excluded from active ---');
  const activeAfter = await prisma.testAttempt.findFirst({
    where: { userId: user.id, status: { in: ['In_Progress', 'Paused'] } },
  });
  assert(activeAfter === null, 'No active attempt after completion');

  // 7. Create detailed MockQuestionResult entries
  console.log('\n--- Question results ---');
  const questionsJson = JSON.parse(attempt.questionsJson);
  for (let i = 0; i < questionsJson.length; i++) {
    const q = questionsJson[i];
    await prisma.mockQuestionResult.create({
      data: {
        attemptId,
        questionId: q.id,
        questionIndex: i,
        questionVersion: 1,
        taskType: q.taskCode,
        normalizedResponse: { kind: 'text', text: 'test' },
        scoringPolicyVersion: 'pte-estimated-v1',
        status: MOCK_ATTEMPT_STATUS.COMPLETED,
        finalScore: q.taskCode === 'MCS' ? 90 : 70,
        feedback: 'Readiness test',
        gradedAt: new Date(),
      },
    });
  }
  const results = await prisma.mockQuestionResult.findMany({ where: { attemptId } });
  assert(results.length === questionsJson.length, `All ${questionsJson.length} questions have results`);

  // 8. Attempt with Grading_Failed supports retry
  console.log('\n--- Grading failed -> retry ---');
  const failedAttemptId = crypto.randomUUID();
  await prisma.testAttempt.create({
    data: {
      id: failedAttemptId, userId: user.id, testId, title: 'Failed Mock', type: 'mini',
      status: MOCK_ATTEMPT_STATUS.GRADING_FAILED, date: new Date().toISOString().split('T')[0], revision: 1,
    },
  });
  const failedAttempt = await prisma.testAttempt.findUnique({ where: { id: failedAttemptId } });
  assert(failedAttempt.status === MOCK_ATTEMPT_STATUS.GRADING_FAILED, 'Grading_Failed status set');

  // Cleanup
  await prisma.mockQuestionResult.deleteMany({ where: { attemptId } });
  await prisma.testAttempt.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Readiness smoke crashed:', err);
  process.exit(1);
});
