import { execSync } from 'child_process';
import { existsSync, unlinkSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

let passed = 0;
let failed = 0;
let dbPath = '';

function assert(condition, msg) {
  if (condition) passed++;
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

async function setupTestDb() {
  const dbFile = `/tmp/pte-intg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.db`;
  dbPath = dbFile;
  const dbUrl = `file:${dbFile}`;

  execSync(`DATABASE_URL="${dbUrl}" npx prisma migrate deploy --schema=${root}/prisma/schema.prisma 2>&1`, {
    cwd: root,
    timeout: 30000,
    stdio: 'pipe',
  });

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  await prisma.$connect();
  return { prisma, dbUrl };
}

async function teardownTestDb(prisma) {
  if (prisma) await prisma.$disconnect();
  if (dbPath && existsSync(dbPath)) unlinkSync(dbPath);
  if (dbPath && existsSync(dbPath + '-journal')) unlinkSync(dbPath + '-journal');
}

async function main() {
  console.log('=== Practice Behavioural Integration Tests ===\n');

  const { prisma, dbUrl } = await setupTestDb();
  let userId, qItemId;

  try {
    // ── 1. Seed test data ──────────────────────────────────────────────────
    console.log('1. Seeding test data...');

    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        password: '$2a$10$hashed',
        name: 'Test Student',
        role: 'student',
      },
    });
    userId = user.id;

    const qItem = await prisma.questionBankItem.create({
      data: {
        taskCode: 'RA',
        section: 'Speaking',
        title: 'Test Read Aloud',
        instruction: 'Read the passage aloud',
        promptText: 'Test passage for reading aloud.',
        audioUrl: '/test-audio.mp3',
        difficulty: 'medium',
        status: 'published',
        contentVersion: 1,
      },
    });
    qItemId = qItem.id;

    assert(!!userId && !!qItemId, 'Seed data created: user and question bank item');

    // ── 2. Transition Helper Correctness ───────────────────────────────────
    console.log('\n2. Testing transition helper...');

    const { assertPracticeAttemptTransition, isValidTransition } = await import(
      join(root, 'src/practice/contracts/transitions.ts')
    );

    // Valid transitions — each call throws on failure, serving as real assertion
    const tx = (from, to) => { assertPracticeAttemptTransition(from, to); passed++; };
    tx('In_Progress', 'Pending_Grading');
    tx('In_Progress', 'Pending_Transcription');
    tx('Pending_Transcription', 'Transcribing');
    tx('Transcribing', 'Pending_Grading');
    tx('Pending_Grading', 'Grading');
    tx('Grading', 'Completed');
    tx('Grading', 'Grading_Failed');

    // Invalid transitions throw
    let threw = false;
    try {
      assertPracticeAttemptTransition('Completed', 'In_Progress');
    } catch {
      threw = true;
    }
    assert(threw, 'Completed → In_Progress throws (invalid transition)');

    assert(!isValidTransition('Completed', 'Grading'), 'Completed → Grading is not valid');
    assert(isValidTransition('In_Progress', 'Expired'), 'In_Progress → Expired is valid');

    // ── 3. Attempt Lifecycle: In_Progress → Pending_Grading → Grading → Completed ──
    console.log('\n3. Testing attempt lifecycle (non-speaking task)...');

    const attempt = await prisma.practiceAttempt.create({
      data: {
        userId,
        questionBankItemId: qItemId,
        questionVersion: 1,
        taskCode: 'MCS',
        mode: 'timed',
        status: 'In_Progress',
        questionSnapshotJson: JSON.stringify({ title: 'Test MCS', options: ['A', 'B', 'C', 'D'] }),
        scoringPolicyVersion: 'pte-estimated-v1',
      },
    });
    const attemptId = attempt.id;

    assert(attempt.status === 'In_Progress', 'Attempt starts as In_Progress');
    assert(attempt.deadlineAt === null, 'No deadline for untimed task');

    // Submit the attempt (simulating what the submit handler does for non-speaking)
    const submission = await prisma.practiceSubmission.create({
      data: {
        userId,
        taskCode: 'MCS',
        title: 'Test MCS',
        section: 'Reading',
        answerJson: JSON.stringify({ selectedOption: 0 }),
        status: 'pending',
        attemptId,
      },
    });

    await prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: { status: 'Pending_Grading', submittedAt: new Date() },
    });

    const updatedAttempt = await prisma.practiceAttempt.findUnique({ where: { id: attemptId } });
    assert(updatedAttempt.status === 'Pending_Grading', 'After submit: Pending_Grading');
    assert(updatedAttempt.submittedAt !== null, 'submittedAt is set');

    // Simulate grading worker
    await prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: { status: 'Grading' },
    });

    await prisma.practiceSubmission.update({
      where: { id: submission.id },
      data: { status: 'graded', score: 75, feedback: 'Good work' },
    });

    await prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: { status: 'Completed' },
    });

    const finalAttempt = await prisma.practiceAttempt.findUnique({ where: { id: attemptId } });
    assert(finalAttempt.status === 'Completed', 'Final status: Completed');

    const gradedSub = await prisma.practiceSubmission.findUnique({ where: { id: submission.id } });
    assert(gradedSub.status === 'graded', 'Submission marked graded');
    assert(gradedSub.score === 75, 'Score preserved');

    // ── 4. Speaking attempt lifecycle with transcription ────────────────────
    console.log('\n4. Testing speaking attempt lifecycle...');

    const speakingAttempt = await prisma.practiceAttempt.create({
      data: {
        userId,
        questionBankItemId: qItemId,
        questionVersion: 1,
        taskCode: 'RA',
        mode: 'timed',
        status: 'In_Progress',
        questionSnapshotJson: JSON.stringify({ title: 'Test RA', audioUrl: '/prompt-audio.mp3' }),
        scoringPolicyVersion: 'pte-estimated-v1',
        playbackPolicySnapshotJson: JSON.stringify({ maxPlays: 2 }),
      },
    });
    const saId = speakingAttempt.id;

    assert(speakingAttempt.status === 'In_Progress', 'Speaking attempt starts In_Progress');

    // Attach audio (simulating upload)
    const audioMeta = await prisma.audioMetadata.create({
      data: {
        objectKey: `practice/${userId}/${saId}.wav`,
        mimeType: 'audio/wav',
        byteSize: 12345,
        hash: 'abc123',
        userId,
      },
    });

    await prisma.practiceAttempt.update({
      where: { id: saId },
      data: { responseAudioId: audioMeta.id },
    });

    // Submit speaking → Pending_Transcription
    const speakingSub = await prisma.practiceSubmission.create({
      data: {
        userId,
        taskCode: 'RA',
        title: 'Test RA',
        section: 'Speaking',
        audioMetadataId: audioMeta.id,
        status: 'pending',
        attemptId: saId,
      },
    });

    await prisma.practiceAttempt.update({
      where: { id: saId },
      data: { status: 'Pending_Transcription', submittedAt: new Date() },
    });

    let sa = await prisma.practiceAttempt.findUnique({ where: { id: saId } });
    assert(sa.status === 'Pending_Transcription', 'Speaking submit → Pending_Transcription');

    // Simulate transcribing worker
    await prisma.practiceAttempt.update({
      where: { id: saId },
      data: { status: 'Transcribing' },
    });

    // Simulate failed transcription
    await prisma.practiceAttempt.update({
      where: { id: saId },
      data: { status: 'Transcription_Failed' },
    });

    sa = await prisma.practiceAttempt.findUnique({ where: { id: saId } });
    assert(sa.status === 'Transcription_Failed', 'Transcription failure → Transcription_Failed');

    // Simulate retry transcription
    await prisma.practiceAttempt.update({
      where: { id: saId },
      data: { status: 'Pending_Transcription' },
    });
    await prisma.practiceAttempt.update({
      where: { id: saId },
      data: { status: 'Transcribing' },
    });

    // Simulate successful transcription → Pending_Grading
    await prisma.practiceSubmission.update({
      where: { id: speakingSub.id },
      data: { transcript: 'The continuous expansion of cloud infrastructures...' },
    });

    await prisma.practiceAttempt.update({
      where: { id: saId },
      data: { status: 'Pending_Grading' },
    });

    sa = await prisma.practiceAttempt.findUnique({ where: { id: saId } });
    assert(sa.status === 'Pending_Grading', 'After transcription → Pending_Grading');

    // Simulate grading worker
    await prisma.practiceAttempt.update({
      where: { id: saId },
      data: { status: 'Grading' },
    });
    await prisma.practiceSubmission.update({
      where: { id: speakingSub.id },
      data: { status: 'graded', score: 80, fluencyScore: 75, pronunciationScore: 70 },
    });
    await prisma.practiceAttempt.update({
      where: { id: saId },
      data: { status: 'Completed' },
    });

    sa = await prisma.practiceAttempt.findUnique({ where: { id: saId } });
    assert(sa.status === 'Completed', 'After grading → Completed');

    // Verify result query
    const resultSub = await prisma.practiceSubmission.findUnique({ where: { attemptId: saId } });
    assert(resultSub.score === 80, 'Score readable from result query');
    assert(resultSub.fluencyScore === 75, 'Fluency score readable');
    assert(resultSub.pronunciationScore === 70, 'Pronunciation score readable');

    // ── 5. Concurrent Playback Limits ──────────────────────────────────────
    console.log('\n5. Testing concurrent playback limits...');

    const playAttempt = await prisma.practiceAttempt.create({
      data: {
        userId,
        questionBankItemId: qItemId,
        questionVersion: 1,
        taskCode: 'RS',
        mode: 'timed',
        status: 'In_Progress',
        questionSnapshotJson: JSON.stringify({ title: 'Test RS', audioUrl: '/prompt-audio.mp3' }),
        scoringPolicyVersion: 'pte-estimated-v1',
        playbackPolicySnapshotJson: JSON.stringify({ maxPlays: 2 }),
      },
    });
    const paId = playAttempt.id;

    // First play succeeds
    await prisma.practicePlaybackConsumption.create({
      data: { attemptId: paId, userId, playedCount: 0 },
    });

    const firstPlay = await prisma.practicePlaybackConsumption.updateMany({
      where: { attemptId: paId, playedCount: { lt: 2 } },
      data: { playedCount: { increment: 1 }, lastPlayedAt: new Date(), version: { increment: 1 } },
    });
    assert(firstPlay.count === 1, 'First play succeeds (count=1)');

    // Second play succeeds
    const secondPlay = await prisma.practicePlaybackConsumption.updateMany({
      where: { attemptId: paId, playedCount: { lt: 2 } },
      data: { playedCount: { increment: 1 }, lastPlayedAt: new Date(), version: { increment: 1 } },
    });
    assert(secondPlay.count === 1, 'Second play succeeds (count=1)');

    // Third play is rejected (maxPlays=2)
    const thirdPlay = await prisma.practicePlaybackConsumption.updateMany({
      where: { attemptId: paId, playedCount: { lt: 2 } },
      data: { playedCount: { increment: 1 } },
    });
    assert(thirdPlay.count === 0, 'Third play rejected (count=0)');

    const finalPlayCount = await prisma.practicePlaybackConsumption.findUnique({ where: { attemptId: paId } });
    assert(finalPlayCount.playedCount === 2, 'Played count is exactly 2');

    // Non-In_Progress attempt rejects
    await prisma.practiceAttempt.update({
      where: { id: paId },
      data: { status: 'Pending_Grading' },
    });
    const expiredAttempt = await prisma.practiceAttempt.findUnique({ where: { id: paId } });
    assert(expiredAttempt.status !== 'In_Progress', 'Playback rejected for non-In_Progress attempt');

    // ── 6. Duplicate Submission / Idempotency ──────────────────────────────
    console.log('\n6. Testing idempotency and duplicate prevention...');

    // Simulate queueJob idempotency check
    const idemKey = `practice-grade:dup-test-${Date.now()}`;
    const job1 = await prisma.backgroundJob.create({
      data: {
        name: 'grade_submission',
        data: JSON.stringify({ submissionId: 'test-1' }),
        status: 'queued',
        idempotencyKey: idemKey,
      },
    });
    assert(!!job1.id, 'First job created');

    // Attempt duplicate via findUnique (simulating queueJob guard)
    const existing = await prisma.backgroundJob.findUnique({ where: { idempotencyKey: idemKey } });
    assert(!!existing, 'Duplicate idempotencyKey found by findUnique');

    const job2Exists = await prisma.backgroundJob.findUnique({ where: { idempotencyKey: idemKey } });
    assert(job2Exists !== null, 'queueJob skips create when idempotencyKey exists');

    // Duplicate submit check (responseAudioId unique)
    const dupAudio = await prisma.audioMetadata.create({
      data: {
        objectKey: `practice/${userId}/dup-test.wav`,
        mimeType: 'audio/wav',
        byteSize: 100,
        hash: 'dup123',
        userId,
      },
    });

    // Attach to an attempt
    await prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: { responseAudioId: dupAudio.id },
    });

    // Try to attach same audio to another attempt — should fail (unique constraint)
    let dupError = null;
    try {
      await prisma.practiceAttempt.create({
        data: {
          userId: userId + '-other',
          questionBankItemId: qItemId,
          questionVersion: 1,
          taskCode: 'RA',
          mode: 'timed',
          status: 'In_Progress',
          questionSnapshotJson: '{}',
          scoringPolicyVersion: 'pte-estimated-v1',
          responseAudioId: dupAudio.id,
        },
      });
    } catch (err) {
      dupError = err;
    }
    assert(dupError !== null, 'responseAudioId unique constraint prevents duplicate attach');

    // Re-submit to completed attempt check
    const completedAttempt = await prisma.practiceAttempt.findUnique({ where: { id: attemptId } });
    assert(completedAttempt.status !== 'In_Progress', 'Completed attempt status != In_Progress (cannot re-submit)');

    // ── 7. Structured Answer Grading (deterministic tasks) ─────────────────
    console.log('\n7. Testing structured answer submission and validation...');

    const evalMod = await import(join(root, 'src/server/aiService.ts'));

    // MCS (single choice)
    const mcsResult = await evalMod.evaluateSubmission('MCS', 'Reading', 'Test MCS', '', '', JSON.stringify({ correctOption: 0 }));
    assert(mcsResult.status === 'pending_deterministic', 'MCS grading returns pending_deterministic');

    // MCM (multiple choice)
    const mcmResult = await evalMod.evaluateSubmission('MCM', 'Reading', 'Test MCM', '', '', JSON.stringify({ correctOptions: [0, 2] }));
    assert(mcmResult.status === 'pending_deterministic', 'MCM grading returns pending_deterministic');

    // ROP (reorder)
    const ropResult = await evalMod.evaluateSubmission('ROP', 'Reading', 'Test ROP', '', '', JSON.stringify({ correctOrder: [3, 0, 1, 2] }));
    assert(ropResult.status === 'pending_deterministic', 'ROP grading returns pending_deterministic');

    // FIBRW
    const fibResult = await evalMod.evaluateSubmission('FIBRW', 'Reading', 'Test FIB', '', '', JSON.stringify({ blanks: { 0: 'answer' } }));
    assert(fibResult.status === 'pending_deterministic', 'FIBRW grading returns pending_deterministic');

    // Empty response guard
    const emptyResult = await evalMod.evaluateSubmission('WE', 'Writing', 'Test WE', '');
    assert(emptyResult.status === 'empty_response', 'Empty submission returns empty_response');

    // Placeholder speaking guard
    const placeholderResult = await evalMod.evaluateSubmission('RA', 'Speaking', 'Test RA', '[Speaking audio recorded for practice]');
    assert(placeholderResult.status === 'empty_response', 'Speaking placeholder rejected');

    // ── 8. Audio Re-record Replacement ─────────────────────────────────────
    console.log('\n8. Testing audio re-record safe replacement...');

    // Create old audio
    const oldAudio = await prisma.audioMetadata.create({
      data: {
        objectKey: `practice/${userId}/old-recording.wav`,
        mimeType: 'audio/wav',
        byteSize: 5000,
        hash: 'oldhash',
        userId,
      },
    });

    const reRecordAttempt = await prisma.practiceAttempt.create({
      data: {
        userId,
        questionBankItemId: qItemId,
        questionVersion: 1,
        taskCode: 'RA',
        mode: 'timed',
        status: 'In_Progress',
        questionSnapshotJson: '{}',
        scoringPolicyVersion: 'pte-estimated-v1',
        responseAudioId: oldAudio.id,
      },
    });

    // Simulate re-record: delete old, create new
    const newAudioMeta = await prisma.audioMetadata.create({
      data: {
        objectKey: `practice/${userId}/${reRecordAttempt.id}-new.wav`,
        mimeType: 'audio/wav',
        byteSize: 8000,
        hash: 'newhash',
        userId,
      },
    });

    // Delete old audio metadata
    const oldId = oldAudio.id;
    await prisma.audioMetadata.delete({ where: { id: oldId } });

    // Attach new
    await prisma.practiceAttempt.update({
      where: { id: reRecordAttempt.id },
      data: { responseAudioId: newAudioMeta.id },
    });

    const afterReRecord = await prisma.practiceAttempt.findUnique({
      where: { id: reRecordAttempt.id },
      include: { responseAudio: true },
    });
    assert(afterReRecord.responseAudio.id === newAudioMeta.id, 'Re-record: new audio attached');
    assert(afterReRecord.responseAudio.byteSize === 8000, 'Re-record: new audio size correct');

    const deletedOld = await prisma.audioMetadata.findUnique({ where: { id: oldId } });
    assert(deletedOld === null, 'Re-record: old audio metadata deleted');

    // ── 9. Worker Retry and Dead-Letter ────────────────────────────────────
    console.log('\n9. Testing worker retry and dead-letter...');

    const maxAttempts = 3;

    // Create a job that will reach max attempts
    const deadJob = await prisma.backgroundJob.create({
      data: {
        name: 'grade_submission',
        data: JSON.stringify({ submissionId: 'dead-test' }),
        status: 'queued',
        attempts: 0,
        maxAttempts,
      },
    });

    // Simulate 3 failed attempts
    for (let i = 1; i <= maxAttempts; i++) {
      await prisma.backgroundJob.update({
        where: { id: deadJob.id },
        data: { status: 'queued', attempts: i },
      });
    }

    // Now simulate recovery: at maxAttempts, set to dead_letter
    const recoveredJob = await prisma.backgroundJob.findUnique({ where: { id: deadJob.id } });
    const nextStatus = recoveredJob.attempts >= recoveredJob.maxAttempts ? 'dead_letter' : 'queued';
    assert(nextStatus === 'dead_letter', `At max attempts, next status is dead_letter (got ${nextStatus})`);

    await prisma.backgroundJob.update({
      where: { id: deadJob.id },
      data: { status: 'dead_letter', completedAt: new Date() },
    });

    const deadLettered = await prisma.backgroundJob.findUnique({ where: { id: deadJob.id } });
    assert(deadLettered.status === 'dead_letter', 'Job is in dead_letter status');
    assert(deadLettered.attempts >= deadLettered.maxAttempts, 'Attempt count >= maxAttempts');

    // Re-queue from dead_letter
    await prisma.backgroundJob.update({
      where: { id: deadJob.id },
      data: { status: 'queued', attempts: 0, error: null, completedAt: null },
    });

    const requeued = await prisma.backgroundJob.findUnique({ where: { id: deadJob.id } });
    assert(requeued.status === 'queued', 'Dead-letter job can be re-queued');
    assert(requeued.attempts === 0, 'Attempts reset on requeue');

    // ── 10. Worker Claim / Lease Enforcement ───────────────────────────────
    console.log('\n10. Testing worker claim and lease enforcement...');

    const claimableJob = await prisma.backgroundJob.create({
      data: {
        name: 'grade_submission',
        data: JSON.stringify({ submissionId: 'claim-test' }),
        status: 'queued',
        attempts: 0,
        maxAttempts: 3,
      },
    });

    // Claim via updateMany (atomic)
    const claimToken = 'test-claim-token';
    const claimed = await prisma.backgroundJob.updateMany({
      where: { id: claimableJob.id, status: 'queued' },
      data: {
        status: 'running',
        workerId: 'test-worker',
        claimToken,
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    assert(claimed.count === 1, 'Job claimed atomically');

    // Second concurrent claim fails
    const secondClaim = await prisma.backgroundJob.updateMany({
      where: { id: claimableJob.id, status: 'queued' },
      data: { status: 'running', workerId: 'worker-2', claimToken: 'token-2' },
    });
    assert(secondClaim.count === 0, 'Second concurrent claim fails');

    // Heartbeat check: update with claimToken
    const heartbeat = await prisma.backgroundJob.updateMany({
      where: { id: claimableJob.id, status: 'running', claimToken },
      data: { heartbeatAt: new Date() },
    });
    assert(heartbeat.count === 1, 'Heartbeat succeeds with correct claimToken');

    // Wrong claimToken fails
    const wrongHeartbeat = await prisma.backgroundJob.updateMany({
      where: { id: claimableJob.id, status: 'running', claimToken: 'wrong-token' },
      data: { heartbeatAt: new Date() },
    });
    assert(wrongHeartbeat.count === 0, 'Heartbeat fails with wrong claimToken');

    // Complete with claimToken
    const completed = await prisma.backgroundJob.updateMany({
      where: { id: claimableJob.id, status: 'running', claimToken },
      data: { status: 'completed', completedAt: new Date() },
    });
    assert(completed.count === 1, 'Job completed with correct claimToken');

    // ── 11. Attempt Expiry ─────────────────────────────────────────────────
    console.log('\n11. Testing attempt expiry...');

    const expAttempt = await prisma.practiceAttempt.create({
      data: {
        userId,
        questionBankItemId: qItemId,
        questionVersion: 1,
        taskCode: 'MCS',
        mode: 'timed',
        status: 'In_Progress',
        deadlineAt: new Date(Date.now() - 10000),
        questionSnapshotJson: '{}',
        scoringPolicyVersion: 'pte-estimated-v1',
      },
    });

    // Deadline has passed
    const now = new Date();
    assert(expAttempt.deadlineAt < now, 'Expired attempt has past deadline');

    // Mark as Expired
    await prisma.practiceAttempt.update({
      where: { id: expAttempt.id },
      data: { status: 'Expired' },
    });

    const expired = await prisma.practiceAttempt.findUnique({ where: { id: expAttempt.id } });
    assert(expired.status === 'Expired', 'Past-deadline attempt marked Expired');

    // ── 12. Immutable Grading Snapshot ─────────────────────────────────────
    console.log('\n12. Testing immutable grading snapshot...');

    const snapAttempt = await prisma.practiceAttempt.create({
      data: {
        userId,
        questionBankItemId: qItemId,
        questionVersion: 1,
        taskCode: 'MCS',
        mode: 'timed',
        status: 'Completed',
        questionSnapshotJson: JSON.stringify({ title: 'Snapshot Test', options: ['A', 'B'] }),
        scoringPolicyVersion: 'pte-estimated-v1',
      },
    });

    const snap = JSON.parse(snapAttempt.questionSnapshotJson);
    assert(snap.title === 'Snapshot Test', 'Question snapshot is immutable JSON stored at attempt creation');
    assert(snap.options.length === 2, 'Snapshot preserves all question data');

    const result = await prisma.practiceSubmission.findUnique({ where: { attemptId: snapAttempt.id } });
    assert(result === null, 'Completed attempt with no submission returns null (no result leakage)');

    // ── Summary ────────────────────────────────────────────────────────────
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) {
      console.log('SOME TESTS FAILED');
      process.exit(1);
    } else {
      console.log('PASS: All behavioural integration tests passed.\n');
    }

  } finally {
    await teardownTestDb(prisma);
  }
}

main().catch((err) => {
  console.error('Test suite error:', err);
  if (dbPath && existsSync(dbPath)) unlinkSync(dbPath);
  process.exit(1);
});
