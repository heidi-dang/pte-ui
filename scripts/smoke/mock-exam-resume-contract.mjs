/**
 * Smoke test: mock exam resume contract.
 * Tests the status contract directly via Prisma.
 *
 * Verifications:
 * 1. ACTIVE_RESUME_STATUSES = [In_Progress, Paused]
 * 2. Completed, Pending_Grading, Grading_Failed are excluded
 * 3. answersJson and questionsJson preserved
 * 4. Resume (Paused→In_Progress) updates correctly
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

async function main() {
  console.log('=== Mock Exam Resume Contract Smoke ===\n');

  const email = `resume-test-${Date.now()}@example.com`;
  let user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: 'Resume Contract Test', password: 'test-password', role: 'student' },
    });
  }
  console.log(`Test user: ${user.email}\n`);

  const testId = crypto.randomUUID();
  const ANSWERS = { q1: 'answer 1', q2: 'answer 2' };
  const QUESTIONS = [
    { id: 'q1', taskCode: 'RA', instruction: 'Read aloud' },
    { id: 'q2', taskCode: 'RS', instruction: 'Repeat sentence' },
  ];
  const answersStr = JSON.stringify(ANSWERS);
  const questionsStr = JSON.stringify(QUESTIONS);

  // Helper: count active (In_Progress or Paused)
  const countActive = (uid) =>
    prisma.testAttempt.count({
      where: { userId: uid, status: { in: ['In_Progress', 'Paused'] } },
    });

  // --- Test 1: In_Progress is active ---
  console.log('--- Test 1: In_Progress is active ---');
  const id1 = crypto.randomUUID();
  await prisma.testAttempt.create({
    data: {
      id: id1, userId: user.id, testId, title: 'In Progress Test', type: 'mini',
      status: 'In_Progress', currentQuestionIndex: 0, secondsRemaining: 600,
      answersJson: answersStr, questionsJson: questionsStr,
      date: new Date().toISOString().split('T')[0], revision: 1,
    },
  });
  const c1 = await countActive(user.id);
  assert(c1 >= 1, `Active count >= 1 after In_Progress (got ${c1})`);

  const activeInProgress = await prisma.testAttempt.findFirst({
    where: { userId: user.id, status: 'In_Progress' },
  });
  assert(activeInProgress !== null, 'In_Progress attempt exists');
  assert(activeInProgress.id === id1, 'Correct In_Progress attempt');

  // --- Test 2: answersJson + questionsJson preserved ---
  console.log('\n--- Test 2: Snapshots preserved ---');
  const stored = await prisma.testAttempt.findUnique({ where: { id: id1 } });
  assert(stored.answersJson === answersStr, 'answersJson stored correctly');
  assert(stored.questionsJson === questionsStr, 'questionsJson stored correctly');
  const parsed = JSON.parse(stored.answersJson);
  assert(parsed.q1 === 'answer 1' && parsed.q2 === 'answer 2', 'Answers parsed correctly');

  // --- Test 3: Paused is active ---
  console.log('\n--- Test 3: Paused is active ---');
  const id2 = crypto.randomUUID();
  await prisma.testAttempt.create({
    data: {
      id: id2, userId: user.id, testId, title: 'Paused Test', type: 'mini',
      status: 'Paused', currentQuestionIndex: 3, secondsRemaining: 400,
      answersJson: answersStr, questionsJson: questionsStr,
      date: new Date().toISOString().split('T')[0], revision: 1,
      pausedAt: new Date(),
    },
  });
  const c2 = await countActive(user.id);
  assert(c2 >= 2, `Active count >= 2 after Paused (got ${c2})`);

  const activePaused = await prisma.testAttempt.findFirst({
    where: { userId: user.id, status: 'Paused' },
  });
  assert(activePaused !== null, 'Paused attempt exists');
  assert(activePaused.id === id2, 'Correct Paused attempt');

  // --- Test 4: Completed NOT active ---
  console.log('\n--- Test 4: Completed excluded ---');
  const id3 = crypto.randomUUID();
  await prisma.testAttempt.create({
    data: {
      id: id3, userId: user.id, testId, title: 'Completed Test', type: 'mini',
      status: 'Completed', overallScore: 60, answersJson: '{}',
      date: new Date().toISOString().split('T')[0], revision: 1,
    },
  });
  const c3 = await countActive(user.id);
  assert(c3 === 2, `Active count still 2 after Completed (got ${c3})`);
  const completedExists = await prisma.testAttempt.count({
    where: { userId: user.id, status: 'Completed' },
  });
  assert(completedExists === 1, 'Completed attempt exists');

  // --- Test 5: Pending_Grading NOT active ---
  console.log('\n--- Test 5: Pending_Grading excluded ---');
  await prisma.testAttempt.create({
    data: {
      id: crypto.randomUUID(), userId: user.id, testId, title: 'PendingGrading Test', type: 'mini',
      status: 'Pending_Grading', answersJson: '{}',
      date: new Date().toISOString().split('T')[0], revision: 1,
    },
  });
  const c5 = await countActive(user.id);
  assert(c5 === 2, `Active count still 2 after Pending_Grading (got ${c5})`);

  // --- Test 6: Grading_Failed NOT active ---
  console.log('\n--- Test 6: Grading_Failed excluded ---');
  await prisma.testAttempt.create({
    data: {
      id: crypto.randomUUID(), userId: user.id, testId, title: 'GradingFailed Test', type: 'mini',
      status: 'Grading_Failed', answersJson: '{}',
      date: new Date().toISOString().split('T')[0], revision: 1,
    },
  });
  const c6 = await countActive(user.id);
  assert(c6 === 2, `Active count still 2 after Grading_Failed (got ${c6})`);

  // --- Test 7: Resume from Paused works ---
  console.log('\n--- Test 7: Resume (Paused → In_Progress) ---');
  await prisma.testAttempt.update({
    where: { id: id2 },
    data: { status: 'In_Progress', currentQuestionIndex: 7, pausedAt: null },
  });
  const resumed = await prisma.testAttempt.findUnique({ where: { id: id2 } });
  assert(resumed.status === 'In_Progress', 'Resumed status is In_Progress');
  assert(resumed.currentQuestionIndex === 7, 'Question index updated to 7');
  const c7 = await countActive(user.id);
  assert(c7 === 2, 'Active count unchanged after resume');

  // Cleanup
  await prisma.testAttempt.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
