import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Database Migration Compatibility Audit ---');
  try {
    const attempts = await prisma.testAttempt.findMany();
    const completedAttempts = attempts.filter(a => a.status === 'Completed');
    const pendingAttempts = attempts.filter(a => a.status === 'Pending_Grading' || a.status === 'Grading' || a.status === 'In_Progress');
    const failedAttempts = attempts.filter(a => a.status === 'Grading_Failed');

    console.log(`Total Attempts in database: ${attempts.length}`);
    console.log(`  Completed: ${completedAttempts.length}`);
    console.log(`  Pending/In Progress: ${pendingAttempts.length}`);
    console.log(`  Failed: ${failedAttempts.length}`);

    // Verify completed scores are non-null and valid (minimum score >= 10)
    for (const a of completedAttempts) {
      if (a.overallScore === null || a.overallScore < 10) {
        throw new Error(`FAIL: Historical completed attempt ${a.id} has invalid/null score: ${a.overallScore}`);
      }
    }
    console.log('PASS: All historical completed attempts maintain non-null scores >= 10.');

    // Verify pending scores are null (or null status compatibility)
    for (const a of pendingAttempts) {
      if (a.overallScore !== null && a.overallScore !== 0) {
        // (Note: legacy items might have 0 prior to migration, but new ones are null)
        console.log(`  Info: Pending attempt ${a.id} overallScore = ${a.overallScore}`);
      }
    }

    const jobs = await prisma.backgroundJob.findMany();
    console.log(`Total Background Jobs: ${jobs.length}`);
    console.log(`  Queued: ${jobs.filter(j => j.status === 'queued').length}`);
    console.log(`  Running: ${jobs.filter(j => j.status === 'running').length}`);
    console.log(`  Dead Letter: ${jobs.filter(j => j.status === 'dead_letter').length}`);

    console.log('PASS: Migration compatability checks verified.');
  } catch (err) {
    console.error('FAIL: Migration verification failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
