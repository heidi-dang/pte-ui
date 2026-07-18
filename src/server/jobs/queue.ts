import { prisma } from '../db';
import { logger } from '../logger';

export async function queueJob(name: string, data: any, idempotencyKey?: string) {
  if (idempotencyKey) {
    // Atomic create — unique constraint on idempotencyKey handles the race
    try {
      const job = await prisma.backgroundJob.create({
        data: {
          name,
          data: JSON.stringify(data),
          status: 'queued',
          idempotencyKey,
        },
      });
      logger.info(`Queued background job ${name} (ID: ${job.id})`);
      return job;
    } catch (err: any) {
      if (err.code === 'P2002') {
        const existing = await prisma.backgroundJob.findUniqueOrThrow({
          where: { idempotencyKey },
        });
        logger.info(`Job ${name} with idempotencyKey ${idempotencyKey} already exists (ID: ${existing.id}). Skipping.`);
        return existing;
      }
      throw err;
    }
  }

  const job = await prisma.backgroundJob.create({
    data: {
      name,
      data: JSON.stringify(data),
      status: 'queued',
    },
  });
  logger.info(`Queued background job ${name} (ID: ${job.id})`);
  return job;
}
