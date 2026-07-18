import { prisma } from '../db';
import { logger } from '../logger';

const ALLOWED_JOB_NAMES = ['grade_submission', 'grade_mock_test'];

const BLOCKED_PAYLOAD_KEYS = ['password', 'passwordResetToken', 'token', 'jwt', 'apiKey', 'secret', 'DATABASE_URL', 'DEEPSEEK_API_KEY', 'OPENAI_API_KEY'];

function sanitizePayload(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (BLOCKED_PAYLOAD_KEYS.some(k => key.toLowerCase().includes(k))) {
      logger.warn(`Blocked secret key in job payload: ${key}`);
      continue;
    }
    sanitized[key] = data[key];
  }
  return sanitized;
}

export async function queueJob(name: string, data: any, options?: { scheduledAt?: Date; maxAttempts?: number; idempotencyKey?: string }) {
  if (!ALLOWED_JOB_NAMES.includes(name)) {
    logger.error(`Rejected unknown job type: ${name}`);
    return null;
  }

  const sanitized = sanitizePayload(data);
  const payload = JSON.stringify(sanitized);
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

  await prisma.auditLog.create({ data: { action: 'JOB_CREATED', category: 'System', message: `Job queued: ${name}` } });
  logger.info(`Queued job ${name} (${job.id})`);
  return job;
}
