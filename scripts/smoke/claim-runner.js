import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const jobId = process.argv[2];
const workerId = `runner-${process.pid}`;

async function run() {
  if (!jobId) {
    console.error('jobId argument is required');
    process.exit(1);
  }

  try {
    const claimToken = crypto.randomUUID();
    const leaseSeconds = 180;

    // Simulate small random delay so they hit the db at slightly different times, 
    // but close enough to trigger SQLite contention and atomic lock race.
    await new Promise((r) => setTimeout(r, Math.random() * 50));

    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.backgroundJob.updateMany({
        where: {
          id: jobId,
          status: 'queued',
        },
        data: {
          status: 'running',
          workerId,
          claimToken,
          startedAt: new Date(),
          heartbeatAt: new Date(),
          leaseExpiresAt: new Date(Date.now() + leaseSeconds * 1000),
          attempts: { increment: 1 },
        },
      });

      return claim.count === 1;
    });

    if (result) {
      console.log(JSON.stringify({ pid: process.pid, result: 'claimed', claimToken, workerId }));
    } else {
      console.log(JSON.stringify({ pid: process.pid, result: 'lost_race' }));
    }
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ pid: process.pid, error: err.message || String(err) }));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
