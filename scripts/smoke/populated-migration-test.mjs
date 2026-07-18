import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const dbPath = path.join(process.cwd(), 'prisma/populated-test.db');
const schemaInitPath = path.join(process.cwd(), 'prisma/migrations/20260718122258_init/migration.sql');

async function run() {
  console.log('--- Populated Migration Nullable Score Compatibility Test ---');

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  // 1. Apply init migration schema using sqlite3
  console.log('Initializing pre-migration SQLite database...');
  execSync(`sqlite3 ${dbPath} < ${schemaInitPath}`);

  // 2. Insert pre-migration dummy data with non-nullable zero and non-zero scores
  console.log('Populating database with legacy attempts...');
  const insertSql = `
    INSERT INTO "User" (id, email, password, name, role, targetScore, currentAvg, status, diagnosticDone, subTier, createdAt)
    VALUES ('user-migrator', 'migrator@example.com', 'pwd', 'Migrator Student', 'student', 79, 0, 'Active', 0, 'free', '2026-07-18 22:00:00');

    INSERT INTO "TestAttempt" (id, userId, testId, title, type, date, overallScore, speakingScore, writingScore, readingScore, listeningScore, status, attemptStartedAt)
    VALUES 
      ('attempt-completed', 'user-migrator', 'test-1', 'Completed Attempt', 'full', '2026-07-18', 68, 68, 65, 68, 70, 'Completed', '2026-07-18 22:01:00'),
      ('attempt-in-progress', 'user-migrator', 'test-2', 'In Progress Attempt', 'full', '2026-07-18', 0, 0, 0, 0, 0, 'In_Progress', '2026-07-18 22:02:00'),
      ('attempt-pending', 'user-migrator', 'test-3', 'Pending Attempt', 'full', '2026-07-18', 0, 0, 0, 0, 0, 'Pending_Grading', '2026-07-18 22:03:00'),
      ('attempt-grading', 'user-migrator', 'test-4', 'Grading Attempt', 'full', '2026-07-18', 0, 0, 0, 0, 0, 'Grading', '2026-07-18 22:04:00'),
      ('attempt-failed', 'user-migrator', 'test-5', 'Failed Attempt', 'full', '2026-07-18', 0, 0, 0, 0, 0, 'Grading_Failed', '2026-07-18 22:05:00');
  `;
  fs.writeFileSync('insert.sql', insertSql);
  execSync(`sqlite3 ${dbPath} < insert.sql`);
  fs.unlinkSync('insert.sql');

  // 3. Deploy migrations (running deploy will update nullable score properties and trigger any schema changes)
  console.log('Deploying prisma migrations...');
  execSync(`DATABASE_URL="file:./populated-test.db" npx prisma migrate resolve --applied 20260718122258_init`, { stdio: 'inherit' });
  execSync(`DATABASE_URL="file:./populated-test.db" npx prisma migrate deploy`, { stdio: 'inherit' });

  // 4. Assert updated records
  console.log('Asserting post-migration database states...');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: 'file:./populated-test.db' },
    },
  });

  try {
    const attempts = await prisma.testAttempt.findMany({
      orderBy: { attemptStartedAt: 'asc' },
    });

    if (attempts.length !== 5) {
      throw new Error(`FAIL: Expected 5 attempts, got ${attempts.length}`);
    }

    const completed = attempts.find(a => a.id === 'attempt-completed');
    if (!completed) throw new Error('Completed attempt not found');
    if (completed.overallScore !== 68 || completed.speakingScore !== 68 || completed.listeningScore !== 70) {
      throw new Error(`FAIL: Completed scores were modified! Got overall: ${completed.overallScore}`);
    }
    console.log('  PASS: Completed scores remained unchanged.');

    const nonCompletedIds = ['attempt-in-progress', 'attempt-pending', 'attempt-grading', 'attempt-failed'];
    for (const id of nonCompletedIds) {
      const a = attempts.find(item => item.id === id);
      if (!a) throw new Error(`Attempt ${id} not found`);
      if (a.overallScore !== null || a.speakingScore !== null || a.writingScore !== null || a.readingScore !== null || a.listeningScore !== null) {
        throw new Error(`FAIL: Non-completed attempt ${id} did not have scores converted to NULL. Got overall: ${a.overallScore}`);
      }
    }
    console.log('  PASS: All non-completed score columns successfully converted to NULL.');

    console.log('\n====================================');
    console.log('POPULATED MIGRATION TESTS PASSED! 🎉');
    console.log('====================================');
  } catch (err) {
    console.error('FAIL: Populated migration tests failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  }
}

run();
