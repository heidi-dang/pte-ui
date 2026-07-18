import { prisma } from '../db';
import { logger } from '../logger';

export async function queueJob(name: string, data: any, idempotencyKey?: string) {
  if (idempotencyKey) {
    const existing = await prisma.backgroundJob.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      logger.info(`Job ${name} with idempotencyKey ${idempotencyKey} already exists (ID: ${existing.id}). Skipping.`);
      return existing;
    }
  }

  const job = await prisma.backgroundJob.create({
    data: {
      name,
      data: JSON.stringify(data),
      status: 'queued',
      idempotencyKey: idempotencyKey || null,
    },
  });
  logger.info(`Queued background job ${name} (ID: ${job.id})`);
  return job;
}
