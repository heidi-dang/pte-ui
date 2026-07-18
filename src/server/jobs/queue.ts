import type { PrismaClient } from '@prisma/client';
import { prisma as globalPrisma } from '../db';
import { logger } from '../logger';

export async function queueJob(
  name: string,
  data: any,
  idempotencyKey?: string,
  tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
) {
  const client = tx || globalPrisma;

  if (idempotencyKey) {
    try {
      const job = await client.backgroundJob.create({
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
        const existing = await client.backgroundJob.findUniqueOrThrow({
          where: { idempotencyKey },
        });
        logger.info(`Job ${name} with idempotencyKey ${idempotencyKey} already exists (ID: ${existing.id}). Skipping.`);
        return existing;
      }
      throw err;
    }
  }

  const job = await client.backgroundJob.create({
    data: {
      name,
      data: JSON.stringify(data),
      status: 'queued',
    },
  });
  logger.info(`Queued background job ${name} (ID: ${job.id})`);
  return job;
}
