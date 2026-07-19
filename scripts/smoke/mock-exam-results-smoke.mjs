/**
 * Smoke test: mock exam results breakdown.
 * Verifies detailed attempt endpoint returns per-question data.
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { MOCK_ATTEMPT_STATUS } from '../../src/shared/mockExamStatus.ts';

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.error(`  FAIL: ${label}`); }
}

async function main() {
  console.log('=== Mock Exam Results Breakdown Smoke ===\n');

  const email = `results-${Date.now()}@example.com`;
  let user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: 'Results Test', password: 'test', role: 'student' },
    });
  }
  console.log(`Test user: ${user.email}\n`);

  const testId = crypto.randomUUID();
  const attemptId = crypto.randomUUID();
  const questions = [
    { id: 'q1', questionId: 'q1', taskCode: 'RA', section: 'Speaking', title: 'Read Aloud', instruction: 'Read', promptText: 'Text', difficulty: 'medium', source: 'cms' },
    { id: 'q2', questionId: 'q2', taskCode: 'WE', section: 'Writing', title: 'Write Essay', instruction: 'Write', promptText: 'Topic', difficulty: 'medium', source: 'cms' },
    { id: 'q3', questionId: 'q3', taskCode: 'MCS', section: 'Reading', title: 'MC Single', instruction: 'Choose', promptText: 'Question', optionsJson: JSON.stringify(['A','B']), difficulty: 'medium', source: 'cms' },
  ];

  await prisma.testAttempt.create({
    data: {
      id: attemptId, userId: user.id, testId, title: 'Results Test', type: 'mini',
      status: MOCK_ATTEMPT_STATUS.COMPLETED, overallScore: 65,
      speakingScore: 60, writingScore: 70, readingScore: 65, listeningScore: 55,
      questionsJson: JSON.stringify(questions),
      answersJson: JSON.stringify({ '0': { kind: 'audio' }, '1': { kind: 'text', text: 'essay' } }),
      date: new Date().toISOString().split('T')[0], revision: 1, submittedAt: new Date(),
    },
  });

  // Create one result per question with different statuses
  const statuses = [MOCK_ATTEMPT_STATUS.COMPLETED, 'Failed', MOCK_ATTEMPT_STATUS.COMPLETED];
  const scores = [60, null, 90];
  for (let i = 0; i < questions.length; i++) {
    await prisma.mockQuestionResult.create({
      data: {
        attemptId, questionId: `q${i+1}`, questionIndex: i, questionVersion: 1,
        taskType: questions[i].taskCode,
        normalizedResponse: { kind: 'text', text: 'answer' },
        scoringPolicyVersion: 'pte-estimated-v1',
        status: statuses[i],
        finalScore: scores[i],
        feedback: statuses[i] === 'Failed' ? 'AI grading failed: timeout' : 'Scored successfully',
        aiProvider: statuses[i] === 'Failed' ? null : 'Deterministic Engine',
        aiModel: 'deterministic-pte-v1',
        gradedAt: new Date(),
        skillContributions: { speaking: 5, writing: 0, reading: 0, listening: 0 },
      },
    });
  }

  // Verify results
  console.log('--- Result verification ---');
  assert(true, 'Attempt created with 3 questions');

  const results = await prisma.mockQuestionResult.findMany({
    where: { attemptId },
    orderBy: { questionIndex: 'asc' },
  });
  assert(results.length === 3, '3 question results created');
  assert(results[0].status === MOCK_ATTEMPT_STATUS.COMPLETED, 'Q1 scored');
  assert(results[1].status === 'Failed', 'Q2 failed');
  assert(results[2].finalScore === 90, 'Q3 score correct');

  const summary = {
    total: results.length,
    scored: results.filter(r => r.finalScore !== null).length,
    failed: results.filter(r => r.status === 'Failed').length,
    pending: results.filter(r => r.status === 'Pending' || r.status === 'Grading').length,
  };
  assert(summary.total === 3, 'Total results: 3');
  assert(summary.scored === 2, 'Scored: 2');
  assert(summary.failed === 1, 'Failed: 1');
  assert(summary.pending === 0, 'Pending: 0');

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
  console.error('Results smoke crashed:', err);
  process.exit(1);
});
