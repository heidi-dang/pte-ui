import { prisma } from '../db';
import { logger } from '../logger';

const ALLOWED_JOB_NAMES = ['grade_submission', 'db_cleanup', 'speech_grading', 'essay_grading'];

export async function queueJob(name: string, data: any, options?: { scheduledAt?: Date; maxAttempts?: number; idempotencyKey?: string }) {
  if (!ALLOWED_JOB_NAMES.includes(name)) {
    logger.error(`Rejected unknown job type: ${name}`);
    return null;
  }

  const payload = JSON.stringify(data);
  if (payload.length > 50000) { logger.error('Job payload too large'); return null; }

  if (options?.idempotencyKey) {
    const existing = await prisma.backgroundJob.findUnique({ where: { idempotencyKey: options.idempotencyKey } });
    if (existing) { logger.info(`Duplicate job skipped: ${name} (${options.idempotencyKey})`); return existing; }
  }

  const job = await prisma.backgroundJob.create({
    data: {
      name,
      data: payload,
      status: 'queued',
      scheduledAt: options?.scheduledAt || new Date(),
      maxAttempts: options?.maxAttempts || 3,
      idempotencyKey: options?.idempotencyKey,
    },
  });

  await prisma.auditLog.create({
    data: { action: 'JOB_CREATED', category: 'System', message: `Job queued: ${name}` },
  });

  logger.info(`Queued job ${name} (${job.id})`);
  return job;
}
