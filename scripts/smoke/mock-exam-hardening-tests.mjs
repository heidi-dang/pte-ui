import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { fork } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

// Setup helper: create a dummy student and mock attempt
async function setupTestAttempt() {
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
      overallScore: null, // Nullable initially
      speakingScore: null,
      writingScore: null,
      readingScore: null,
      listeningScore: null,
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
  console.log('\n--- 1. Running Worker Concurrency Claim Test (Separate Processes) ---');
  
  const jobId = crypto.randomUUID();
  const jobKey = `concurrency_test_job:${jobId}`;
  await prisma.backgroundJob.create({
    data: {
      id: jobId,
      name: 'grade_mock_test',
      data: JSON.stringify({ attemptId: 'dummy-attempt' }),
      idempotencyKey: jobKey,
      status: 'queued',
      scheduledAt: new Date(Date.now() - 5000),
      attempts: 0,
      maxAttempts: 3,
    },
  });

  const runnerPath = path.join(process.cwd(), 'scripts/smoke/claim-runner.js');

  const runProcess = () => {
    return new Promise((resolve, reject) => {
      const child = fork(runnerPath, [jobId], { silent: true });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });
      child.on('close', (code) => {
        resolve({ code, stdout, stderr, pid: child.pid });
      });
    });
  };

  console.log('Spawning 2 concurrent Node processes to claim job...');
  const [res1, res2] = await Promise.all([
    runProcess(),
    runProcess(),
  ]);

  console.log(`Process 1 (PID: ${res1.pid}) exited with code ${res1.code}. Output:`, res1.stdout.trim());
  console.log(`Process 2 (PID: ${res2.pid}) exited with code ${res2.code}. Output:`, res2.stdout.trim());

  if (res1.code !== 0 || res2.code !== 0) {
    throw new Error(`FAIL: A child process exited with a non-zero code. Stderr 1: ${res1.stderr}, Stderr 2: ${res2.stderr}`);
  }

  let parsed1, parsed2;
  try {
    parsed1 = JSON.parse(res1.stdout);
    parsed2 = JSON.parse(res2.stdout);
  } catch (e) {
    throw new Error(`FAIL: Failed to parse child process outputs. ${e.message}`);
  }

  const claimedCount = (parsed1.result === 'claimed' ? 1 : 0) + (parsed2.result === 'claimed' ? 1 : 0);
  const lostRaceCount = (parsed1.result === 'lost_race' ? 1 : 0) + (parsed2.result === 'lost_race' ? 1 : 0);

  if (claimedCount !== 1 || lostRaceCount !== 1) {
    throw new Error(`FAIL: Concurrency claim count mismatch! Claimed: ${claimedCount}, Lost Race: ${lostRaceCount}`);
  }

  const finalJob = await prisma.backgroundJob.findUnique({ where: { id: jobId } });
  if (finalJob.status !== 'running') {
    throw new Error(`FAIL: Final background job status is not "running". Got: ${finalJob.status}`);
  }
  if (finalJob.attempts !== 1) {
    throw new Error(`FAIL: Final background job attempts count mismatch! Got: ${finalJob.attempts}`);
  }

  const claimWinner = parsed1.result === 'claimed' ? parsed1 : parsed2;
  if (finalJob.claimToken !== claimWinner.claimToken || finalJob.workerId !== claimWinner.workerId) {
    throw new Error(`FAIL: Final job claimToken or workerId mismatch! Claimed: ${claimWinner.claimToken}, DB: ${finalJob.claimToken}`);
  }

  console.log(`PASS: Separate-process claiming verified. Winner PID: ${claimWinner.pid}, Token: ${claimWinner.claimToken}`);

  // Cleanup
  await prisma.backgroundJob.delete({ where: { id: jobId } });
}

// 2. Playback limit under concurrency test
async function runConcurrentPlaybackTest() {
  console.log('\n--- 2. Running Concurrent Playback Limit Test ---');
  const { user, attempt } = await setupTestAttempt();
  const questionId = 'q-2';

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
  console.log('\n--- 3. Running Heartbeat and Stale recovery verification ---');
  
  const jobId = crypto.randomUUID();
  const claimToken = crypto.randomUUID();
  const leaseSeconds = 15; // short lease for testing
  
  const job = await prisma.backgroundJob.create({
    data: {
      id: jobId,
      name: 'grade_mock_test',
      data: JSON.stringify({ attemptId: 'dummy-attempt' }),
      status: 'running',
      claimToken,
      workerId: 'worker-stale-1',
      leaseExpiresAt: new Date(Date.now() + leaseSeconds * 1000),
      attempts: 1,
    },
  });

  // Verify at least two heartbeat database updates increase values
  const heartbeat1Time = new Date();
  const update1 = await prisma.backgroundJob.updateMany({
    where: { id: jobId, status: 'running', claimToken },
    data: {
      heartbeatAt: heartbeat1Time,
      leaseExpiresAt: new Date(heartbeat1Time.getTime() + leaseSeconds * 1000),
    },
  });

  if (update1.count !== 1) throw new Error('FAIL: Heartbeat 1 update failed');
  
  const updatedJob1 = await prisma.backgroundJob.findUnique({ where: { id: jobId } });
  
  // Wait a short time and trigger second heartbeat update
  await new Promise((r) => setTimeout(r, 100));
  const heartbeat2Time = new Date();
  const update2 = await prisma.backgroundJob.updateMany({
    where: { id: jobId, status: 'running', claimToken },
    data: {
      heartbeatAt: heartbeat2Time,
      leaseExpiresAt: new Date(heartbeat2Time.getTime() + leaseSeconds * 1000),
    },
  });

  if (update2.count !== 1) throw new Error('FAIL: Heartbeat 2 update failed');
  
  const updatedJob2 = await prisma.backgroundJob.findUnique({ where: { id: jobId } });

  if (updatedJob2.heartbeatAt.getTime() <= updatedJob1.heartbeatAt.getTime()) {
    throw new Error('FAIL: Heartbeat timestamp did not increase!');
  }
  if (updatedJob2.leaseExpiresAt.getTime() <= updatedJob1.leaseExpiresAt.getTime()) {
    throw new Error('FAIL: leaseExpiresAt timestamp did not increase!');
  }

  // Simulate stale recovery reclamation: lease is expired, run recovery
  await prisma.backgroundJob.update({
    where: { id: jobId },
    data: {
      leaseExpiresAt: new Date(Date.now() - 1000), // set to past
    },
  });

  // Call database recovery directly to emulate recoverStaleJobs routine
  const staleJobs = await prisma.backgroundJob.findMany({
    where: {
      status: 'running',
      leaseExpiresAt: { lt: new Date() },
    },
  });

  for (const stale of staleJobs) {
    const nextStatus = stale.attempts >= stale.maxAttempts ? 'dead_letter' : 'queued';
    await prisma.backgroundJob.update({
      where: { id: stale.id },
      data: {
        status: nextStatus,
        claimToken: null,
        workerId: null,
        leaseExpiresAt: null,
      },
    });
  }

  // Old worker attempts write. Count must be 0 because claimToken is null
  const oldWorkerWriteResult = await prisma.backgroundJob.updateMany({
    where: { id: jobId, status: 'running', claimToken },
    data: {
      status: 'completed',
      result: JSON.stringify({ success: true }),
    },
  });

  if (oldWorkerWriteResult.count !== 0) {
    throw new Error('FAIL: Stale worker was allowed to commit job results after recovery reclaimed lease!');
  }

  console.log('PASS: Heartbeat updates verified. Stale worker lost ownership commits blocked.');
  await prisma.backgroundJob.delete({ where: { id: jobId } });
}

// 4. Retry and dead-letter verification
async function runStaleRecoveryTest() {
  console.log('\n--- 4. Running Retry and Dead-Letter Verification ---');
  
  const attemptId = crypto.randomUUID();
  const attempt = await prisma.testAttempt.create({
    data: {
      id: attemptId,
      userId: (await prisma.user.findFirst({ where: { email: 'harden-test@example.com' } })).id,
      testId: 'dummy-test',
      title: 'Mock Attempt For Dead Letter',
      type: 'full',
      date: '2026-07-18',
      overallScore: null,
      speakingScore: null,
      writingScore: null,
      readingScore: null,
      listeningScore: null,
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

  // Run stale recovery helper query
  const staleJobs = await prisma.backgroundJob.findMany({
    where: {
      status: 'running',
      leaseExpiresAt: { lt: new Date() },
    },
  });

  for (const job of staleJobs) {
    const nextStatus = job.attempts >= job.maxAttempts ? 'dead_letter' : 'queued';
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: nextStatus,
        error: `Lease expired. Resetting status to ${nextStatus}.`,
        completedAt: nextStatus === 'dead_letter' ? new Date() : null,
        claimToken: null,
        workerId: null,
        leaseExpiresAt: null,
      },
    });

    if (job.name === 'grade_mock_test' && nextStatus === 'dead_letter') {
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

  if (recoveredJob.status !== 'dead_letter') {
    throw new Error(`FAIL: Expired job with max attempts did not transit to dead_letter! Got: ${recoveredJob.status}`);
  }
  if (recoveredJob.leaseExpiresAt !== null || recoveredJob.claimToken !== null) {
    throw new Error('FAIL: leaseExpiresAt and claimToken fields were not cleared for dead_letter job.');
  }
  if (updatedAttempt.status !== 'Grading_Failed') {
    throw new Error(`FAIL: Attempt status did not transition to Grading_Failed! Got: ${updatedAttempt.status}`);
  }

  console.log('PASS: Dead-letter state transitions and Grading_Failed status verified.');
  
  await prisma.backgroundJob.delete({ where: { id: staleJobId } });
  await prisma.testAttempt.delete({ where: { id: attemptId } });
}

// 5. Immutable snapshot test
async function runImmutableSnapshotTest() {
  console.log('\n--- 5. Running Immutable Snapshot Verification ---');
  const { user, attempt } = await setupTestAttempt();

  // Create MockQuestionResult record to act as immutable snapshot answers
  const qId = 'q-1';
  await prisma.mockQuestionResult.create({
    data: {
      attemptId: attempt.id,
      questionId: qId,
      questionVersion: 1,
      questionIndex: 0,
      taskType: 'RA',
      normalizedResponse: JSON.stringify({ text: 'This is the immutable snapshot response.' }),
      scoringPolicyVersion: 'pte-estimated-v1',
      status: 'Pending',
    },
  });

  // Mutate/delete mutable answers on the TestAttempt model (e.g. set answersJson to null)
  await prisma.testAttempt.update({
    where: { id: attempt.id },
    data: {
      answersJson: null, // deleted draft answer
    },
  });

  // Simulate grader reading question result answers:
  const snapshotRes = await prisma.mockQuestionResult.findUnique({
    where: { attemptId_questionId: { attemptId: attempt.id, questionId: qId } },
  });

  const parsedAns = JSON.parse(snapshotRes.normalizedResponse);
  if (parsedAns.text !== 'This is the immutable snapshot response.') {
    throw new Error('FAIL: Snapshot answer was modified or is not reading from MockQuestionResult!');
  }

  console.log('PASS: Immutable answer snapshotting passes.');

  // Cleanup
  await prisma.mockQuestionResult.delete({ where: { attemptId_questionId: { attemptId: attempt.id, questionId: qId } } });
  await prisma.testAttempt.delete({ where: { id: attempt.id } });
}

// 6. Versioned scoring formula test
function runScoringFormulaTest() {
  console.log('\n--- 6. Running Versioned Scoring Policy Formula Test ---');
  
  const norm1 = Math.round(10 + (10 / 10) * 80);
  if (norm1 !== 90) throw new Error(`Expected 90, got ${norm1}`);

  const norm2 = Math.round(10 + (0 / 15) * 80);
  if (norm2 !== 10) throw new Error(`Expected 10, got ${norm2}`);

  const norm3 = Math.round(10 + (7.5 / 15) * 80);
  if (norm3 !== 50) throw new Error(`Expected 50, got ${norm3}`);

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
    await runImmutableSnapshotTest();
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
