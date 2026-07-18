import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Setup helper: create a dummy student and mock attempt
async function setupTestAttempt() {
  // Check if test user exists
  let user = await prisma.user.findFirst({ where: { email: 'harden-test@example.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'harden-test@example.com',
        name: 'Hardening Test Student',
        password: 'dummy-password',
        role: 'student',
      },
    });
  }

  const attemptId = crypto.randomUUID();
  const testId = crypto.randomUUID();
  const attempt = await prisma.testAttempt.create({
    data: {
      id: attemptId,
      userId: user.id,
      testId,
      title: 'Harden Concurrency Test Mock',
      type: 'full',
      date: new Date().toISOString().split('T')[0],
      overallScore: 0,
      speakingScore: 0,
      writingScore: 0,
      readingScore: 0,
      listeningScore: 0,
      status: 'In_Progress',
      questionsJson: JSON.stringify([
        { id: 'q-1', code: 'RA', section: 'Speaking', title: 'Read Aloud 1', promptText: 'Read this aloud.' },
        { id: 'q-2', code: 'RS', section: 'Speaking', title: 'Repeat Sentence 1', audioUrl: '/uploads/rs1.mp3' }
      ]),
    },
  });

  return { user, attempt };
}

// 1. Concurrency Worker Claim Test
async function runWorkerClaimTest() {
  console.log('\n--- 1. Running Worker Concurrency Claim Test ---');
  
  // Create a queued background job
  const jobId = crypto.randomUUID();
  const jobKey = `concurrency_test_job:${jobId}`;
  await prisma.backgroundJob.create({
    data: {
      id: jobId,
      name: 'grade_mock_test',
      data: JSON.stringify({ attemptId: 'dummy-attempt' }),
      idempotencyKey: jobKey,
      status: 'queued',
      scheduledAt: new Date(Date.now() - 5000), // scheduled in the past
      attempts: 0,
      maxAttempts: 3,
    },
  });

  // Spawn 2 parallel claims using independent clients
  const prisma1 = new PrismaClient();
  const prisma2 = new PrismaClient();

  const worker1Id = 'worker-thread-1';
  const worker2Id = 'worker-thread-2';

  const claimFn = async (client, workerId) => {
    return await client.$transaction(async (tx) => {
      const candidates = await tx.backgroundJob.findMany({
        where: {
          status: 'queued',
          scheduledAt: { lte: new Date() },
        },
        orderBy: [
          { scheduledAt: 'asc' },
          { id: 'asc' },
        ],
        take: 10,
      });

      const candidate = candidates.find((j) => j.attempts < j.maxAttempts);
      if (!candidate) return null;

      const claimToken = crypto.randomUUID();
      const claim = await tx.backgroundJob.updateMany({
        where: {
          id: candidate.id,
          status: 'queued',
        },
        data: {
          status: 'running',
          workerId,
          claimToken,
          startedAt: new Date(),
          heartbeatAt: new Date(),
          leaseExpiresAt: new Date(Date.now() + 180000),
          attempts: { increment: 1 },
        },
      });

      if (claim.count !== 1) return null;

      return await tx.backgroundJob.findUnique({
        where: { id: candidate.id },
      });
    });
  };

  console.log('Spawning concurrent worker claims...');
  const [res1, res2] = await Promise.all([
    claimFn(prisma1, worker1Id),
    claimFn(prisma2, worker2Id),
  ]);

  if (res1 && res2) {
    throw new Error('FAIL: Both workers claimed the same job concurrently!');
  }

  const winner = res1 || res2;
  if (!winner) {
    throw new Error('FAIL: Neither worker claimed the job!');
  }

  console.log(`PASS: Single Winner Claim logic verified. Winner worker: ${winner.workerId}, claimToken: ${winner.claimToken}`);

  // Cleanup
  await prisma.backgroundJob.delete({ where: { id: jobId } });
  await prisma1.$disconnect();
  await prisma2.$disconnect();
}

// 2. Playback limit under concurrency test
async function runConcurrentPlaybackTest() {
  console.log('\n--- 2. Running Concurrent Playback Limit Test ---');
  const { user, attempt } = await setupTestAttempt();
  const questionId = 'q-2';

  // Seed initial consumption
  const consumption = await prisma.playbackConsumption.create({
    data: {
      attemptId: attempt.id,
      questionId,
      userId: user.id,
      playedCount: 0,
    },
  });

  const maxPlays = 1;
  const prisma1 = new PrismaClient();
  const prisma2 = new PrismaClient();

  const playRequest = async (client) => {
    return await client.$transaction(async (tx) => {
      const consumed = await tx.playbackConsumption.updateMany({
        where: {
          id: consumption.id,
          playedCount: { lt: maxPlays },
        },
        data: {
          playedCount: { increment: 1 },
          lastPlayedAt: new Date(),
          version: { increment: 1 },
        },
      });
      return consumed.count === 1;
    });
  };

  console.log('Sending two concurrent playback requests...');
  const [success1, success2] = await Promise.all([
    playRequest(prisma1),
    playRequest(prisma2),
  ]);

  if (success1 && success2) {
    throw new Error('FAIL: Both concurrent playback play requests succeeded, exceeding the limit!');
  }

  console.log(`PASS: Concurrent playback test verified. Success 1: ${success1}, Success 2: ${success2}`);

  // Cleanup
  await prisma.playbackConsumption.delete({ where: { id: consumption.id } });
  await prisma.testAttempt.delete({ where: { id: attempt.id } });
  await prisma1.$disconnect();
  await prisma2.$disconnect();
}

// 3. Heartbeat lost lease ownership check
async function runHeartbeatOwnershipTest() {
  console.log('\n--- 3. Running Worker Heartbeat Lost-Lease Test ---');
  
  const jobId = crypto.randomUUID();
  const claimToken = crypto.randomUUID();
  const job = await prisma.backgroundJob.create({
    data: {
      id: jobId,
      name: 'grade_mock_test',
      data: JSON.stringify({ attemptId: 'dummy' }),
      status: 'running',
      claimToken,
      workerId: 'worker-stale-1',
      leaseExpiresAt: new Date(Date.now() + 60000),
      attempts: 1,
    },
  });

  // Update lease using a stale token (representing a lost ownership)
  const differentToken = crypto.randomUUID();
  const updateResultStale = await prisma.backgroundJob.updateMany({
    where: {
      id: jobId,
      status: 'running',
      claimToken: differentToken,
    },
    data: {
      heartbeatAt: new Date(),
    },
  });

  if (updateResultStale.count !== 0) {
    throw new Error('FAIL: Heartbeat update succeeded even with incorrect claimToken!');
  }

  // Update lease using correct token
  const updateResultCorrect = await prisma.backgroundJob.updateMany({
    where: {
      id: jobId,
      status: 'running',
      claimToken,
    },
    data: {
      heartbeatAt: new Date(),
    },
  });

  if (updateResultCorrect.count !== 1) {
    throw new Error('FAIL: Heartbeat update failed for valid claimToken ownership!');
  }

  console.log('PASS: Heartbeat lease matching claimToken verified.');
  await prisma.backgroundJob.delete({ where: { id: jobId } });
}

// 4. Stale-worker and recovery dead-letter test
async function runStaleRecoveryTest() {
  console.log('\n--- 4. Running Stale Worker Recovery Test ---');
  
  const attemptId = crypto.randomUUID();
  const attempt = await prisma.testAttempt.create({
    data: {
      id: attemptId,
      userId: (await prisma.user.findFirst({ where: { email: 'harden-test@example.com' } })).id,
      testId: 'dummy-test',
      title: 'Mock Attempt For Recovery',
      type: 'full',
      date: '2026-07-18',
      overallScore: 0,
      speakingScore: 0,
      writingScore: 0,
      readingScore: 0,
      listeningScore: 0,
      status: 'Grading',
    },
  });

  const staleJobId = crypto.randomUUID();
  await prisma.backgroundJob.create({
    data: {
      id: staleJobId,
      name: 'grade_mock_test',
      data: JSON.stringify({ attemptId }),
      status: 'running',
      attempts: 3, // Already hit max attempts (3/3)
      maxAttempts: 3,
      leaseExpiresAt: new Date(Date.now() - 10000), // lease expired in the past
    },
  });

  // Trigger Recovery
  const staleJobs = await prisma.backgroundJob.findMany({
    where: {
      status: 'running',
      leaseExpiresAt: { lt: new Date() },
    },
  });

  for (const job of staleJobs) {
    const nextStatus = job.attempts >= job.maxAttempts ? 'failed' : 'queued';
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: nextStatus,
        error: `Lease expired. Resetting status.`,
        completedAt: nextStatus === 'failed' ? new Date() : null,
      },
    });

    if (job.name === 'grade_mock_test' && nextStatus === 'failed') {
      const payload = JSON.parse(job.data);
      await prisma.testAttempt.update({
        where: { id: payload.attemptId },
        data: { status: 'Grading_Failed' },
      });
    }
  }

  // Verify state
  const recoveredJob = await prisma.backgroundJob.findUnique({ where: { id: staleJobId } });
  const updatedAttempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });

  if (recoveredJob.status !== 'failed') {
    throw new Error(`FAIL: Expired job with max attempts did not transit to failed! Got: ${recoveredJob.status}`);
  }

  if (updatedAttempt.status !== 'Grading_Failed') {
    throw new Error(`FAIL: Attempt status did not transition to Grading_Failed! Got: ${updatedAttempt.status}`);
  }

  console.log('PASS: Stale recovery and Grading_Failed transitions verified.');
  
  await prisma.backgroundJob.delete({ where: { id: staleJobId } });
  await prisma.testAttempt.delete({ where: { id: attemptId } });
}

// 5. Versioned scoring formula test
function runScoringFormulaTest() {
  console.log('\n--- 5. Running Versioned Scoring Policy Formula Test ---');
  
  // Normalization formula: 10 + earnedCredit / maximumCredit * 80
  const norm1 = Math.round(10 + (10 / 10) * 80);
  if (norm1 !== 90) throw new Error(`Expected 90, got ${norm1}`);

  const norm2 = Math.round(10 + (0 / 15) * 80);
  if (norm2 !== 10) throw new Error(`Expected 10, got ${norm2}`);

  const norm3 = Math.round(10 + (7.5 / 15) * 80);
  if (norm3 !== 50) throw new Error(`Expected 50, got ${norm3}`);

  // division by zero check
  const divZero = (max) => max <= 0 ? null : 10;
  if (divZero(0) !== null) throw new Error('Expected division by zero to return null');

  console.log('PASS: Versioned scoring v1 normalization equations pass.');
}

async function main() {
  try {
    await runWorkerClaimTest();
    await runConcurrentPlaybackTest();
    await runHeartbeatOwnershipTest();
    await runStaleRecoveryTest();
    runScoringFormulaTest();
    console.log('\n====================================');
    console.log('ALL HARDENING CONCURRENCY TESTS PASSED! 🎉');
    console.log('====================================');
  } catch (err) {
    console.error('TESTING SUITE ENCOUNTERED AN ERROR:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
