import { prisma } from '../db';
import { logger } from '../logger';

export async function queueJob(name: string, data: any) {
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
