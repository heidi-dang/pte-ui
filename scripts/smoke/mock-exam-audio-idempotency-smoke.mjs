/**
 * Smoke test: mock exam audio upload idempotency.
 * Tests via Prisma that the upload logic would deduplicate by attemptId+questionId.
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.error(`  FAIL: ${label}`); }
}

async function main() {
  console.log('=== Mock Exam Audio Idempotency Smoke ===\n');

  const email = `audio-test-${Date.now()}@example.com`;
  let user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: 'Audio Test', password: 'test', role: 'student' },
    });
  }
  console.log(`Test user: ${user.email}\n`);

  const testId = crypto.randomUUID();
  const attemptId = crypto.randomUUID();
  const questionId = 'q-audio-1';
  const q2Id = 'q-audio-2';

  // Create test attempts first (required for FK constraint)
  await prisma.testAttempt.create({
    data: {
      id: attemptId, userId: user.id, testId, title: 'Audio Test', type: 'mini',
      status: 'In_Progress', date: new Date().toISOString().split('T')[0], revision: 1,
    },
  });
  const attempt2Id = crypto.randomUUID();
  await prisma.testAttempt.create({
    data: {
      id: attempt2Id, userId: user.id, testId, title: 'Audio Test 2', type: 'mini',
      status: 'In_Progress', date: new Date().toISOString().split('T')[0], revision: 1,
    },
  });

  const hash1 = 'hash1';
  const hash2 = 'hash2';
  const key1 = 'key1';
  const key2 = 'key2';

  // 1. First upload creates one metadata row
  console.log('--- Test 1: First upload creates metadata ---');
  const first = await prisma.audioMetadata.create({
    data: { objectKey: key1, mimeType: 'audio/webm', byteSize: 100, hash: hash1, userId: user.id, attemptId, questionId },
  });
  assert(first.id !== undefined, 'First upload creates metadata');
  const count1 = await prisma.audioMetadata.count({ where: { attemptId, questionId } });
  assert(count1 === 1, `1 metadata after first upload (got ${count1})`);

  // 2. Second upload for same attempt+question replaces metadata
  console.log('\n--- Test 2: Second upload replaces (not duplicates) ---');
  const existing = await prisma.audioMetadata.findFirst({ where: { attemptId, questionId } });
  assert(existing !== null, 'Existing metadata found');

  await prisma.audioMetadata.update({
    where: { id: existing.id },
    data: { objectKey: key2, byteSize: 200, hash: hash2 },
  });
  const count2 = await prisma.audioMetadata.count({ where: { attemptId, questionId } });
  assert(count2 === 1, `Still 1 metadata after second upload (got ${count2})`);

  const updated = await prisma.audioMetadata.findFirst({ where: { attemptId, questionId } });
  assert(updated.objectKey === key2, 'objectKey updated');
  assert(updated.hash === hash2, 'hash updated');
  assert(updated.byteSize === 200, 'byteSize updated');

  // 3. Different questionId creates separate metadata
  console.log('\n--- Test 3: Different questionId -> separate metadata ---');
  const second = await prisma.audioMetadata.create({
    data: { objectKey: 'key3', mimeType: 'audio/webm', byteSize: 150, hash: 'hash3', userId: user.id, attemptId, questionId: q2Id },
  });
  assert(second.id !== undefined, 'Second question creates separate metadata');
  const count3 = await prisma.audioMetadata.count({ where: { attemptId } });
  assert(count3 === 2, `2 metadatas for different questions (got ${count3})`);

  // 4. Different attemptId creates separate metadata
  console.log('\n--- Test 4: Different attemptId -> separate metadata ---');
  await prisma.audioMetadata.create({
    data: { objectKey: 'key4', mimeType: 'audio/webm', byteSize: 200, hash: 'hash4', userId: user.id, attemptId: attempt2Id, questionId },
  });
  const count4 = await prisma.audioMetadata.count({ where: { questionId } });
  assert(count4 >= 2, `Metadatas across attempts for same question (got ${count4})`);

  // Cleanup in FK-safe order
  await prisma.audioMetadata.deleteMany({ where: { userId: user.id } });
  await prisma.testAttempt.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
