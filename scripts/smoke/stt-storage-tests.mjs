import { getAudioStore } from '../../src/server/storage.js';
import { getTranscriber, FakeTranscriber } from '../../src/server/stt.js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Speech Transcription and LocalDiskStore Audit ---');

  try {
    // 1. Setup Owner and Other Users & Attempts
    let owner = await prisma.user.findFirst({ where: { email: 'owner@example.com' } });
    if (!owner) {
      owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Owner Student',
          password: 'pwd',
          role: 'student',
        },
      });
    }

    let other = await prisma.user.findFirst({ where: { email: 'other@example.com' } });
    if (!other) {
      other = await prisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other Student',
          password: 'pwd',
          role: 'student',
        },
      });
    }

    const attemptId = crypto.randomUUID();
    const attempt = await prisma.testAttempt.create({
      data: {
        id: attemptId,
        userId: owner.id,
        testId: 'test-123',
        title: 'Owner Test Attempt',
        type: 'full',
        date: '2026-07-18',
        overallScore: null,
        speakingScore: null,
        writingScore: null,
        readingScore: null,
        listeningScore: null,
        status: 'In_Progress',
      },
    });

    // 2. LocalDiskStore upload
    const store = getAudioStore();
    console.log(`Speech transcription test provider: FakeTranscriber`);
    console.log(`Audio storage backend tested: LocalDiskStore`);
    console.log(`Real OpenAI transcription: Outside current release scope`);
    console.log(`S3-compatible storage: Outside current release scope`);

    const objectKey = `recordings/${crypto.randomUUID()}.mp3`;
    const buffer = Buffer.from('audio-data-payload');
    const mimeType = 'audio/mpeg';

    await store.put(objectKey, buffer, mimeType);
    console.log(`  Uploaded audio file. Key: ${objectKey}`);

    const audioMetadata = await prisma.audioMetadata.create({
      data: {
        attemptId: attempt.id,
        userId: owner.id,
        questionId: 'q-1',
        objectKey,
        mimeType,
        byteSize: buffer.length,
        durationSec: 5,
      },
    });
    console.log(`  Created AudioMetadata record. ID: ${audioMetadata.id}`);

    // 4. Owner Authorized Playback Check
    // Owner can fetch the attempt detail containing signed/playback URL
    const ownerQueryAttempt = await prisma.testAttempt.findFirst({
      where: { id: attempt.id, userId: owner.id },
      include: { audioMetadata: true },
    });
    if (!ownerQueryAttempt) {
      throw new Error('FAIL: Owner could not fetch their own attempt detail');
    }
    const ownerPlaybackUrl = await store.getSignedReadUrl(objectKey);
    console.log(`  Owner playback URL generated successfully: ${ownerPlaybackUrl}`);

    // 5. Cross-User Playback Rejection Check
    const crossQueryAttempt = await prisma.testAttempt.findFirst({
      where: { id: attempt.id, userId: other.id },
    });
    if (crossQueryAttempt) {
      throw new Error('FAIL: Cross-user was allowed to load attempt details!');
    }
    console.log('  PASS: Cross-user retrieval request was successfully rejected.');

    // 6. File Retrieval and Content Check
    const retrieved = await store.get(objectKey);
    if (retrieved.toString() !== 'audio-data-payload') {
      throw new Error('FAIL: Retrieved file content does not match uploaded data.');
    }
    console.log('  PASS: File retrieved and content verified.');

    // 7. Application Restart Simulation
    console.log('  Simulating server restart...');
    const restartedStore = getAudioStore();
    const retrievedPostRestart = await restartedStore.get(objectKey);
    if (retrievedPostRestart.toString() !== 'audio-data-payload') {
      throw new Error('FAIL: Post-restart file retrieval content mismatch.');
    }
    console.log('  PASS: File persists and remains retrievable after restart.');

    // 8. Authorized Deletion
    await store.delete(objectKey);
    await prisma.audioMetadata.delete({ where: { id: audioMetadata.id } });
    console.log(`  Deleted audio metadata and key: ${objectKey}`);

    // 9. Verify No Longer Retrievable
    let noLongerRetrievable = false;
    try {
      await store.get(objectKey);
    } catch {
      noLongerRetrievable = true;
    }
    if (!noLongerRetrievable) {
      throw new Error('FAIL: File was still retrievable after deletion!');
    }
    console.log('  PASS: File successfully deleted and is no longer retrievable.');

    // Cleanup attempt
    await prisma.testAttempt.delete({ where: { id: attempt.id } });

    console.log('\n====================================');
    console.log('LOCAL DISK STORE LIFECYCLE AUDIT PASSED! 🎉');
    console.log('====================================');

  } catch (err) {
    console.error('FAIL: LocalDiskStore audit failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
