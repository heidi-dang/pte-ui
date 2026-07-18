import type { PrismaClient } from '@prisma/client';
import { prisma as globalPrisma } from '../db';
import { logger } from '../logger';

const ALLOWED_JOB_NAMES = ['grade_submission', 'grade_mock_test', 'transcribe_audio'];
const BLOCKED_KEYS = ['password', 'passwordresettoken', 'token', 'jwt', 'apikey', 'secret', 'database_url', 'deepseek_api_key', 'openai_api_key'];

function sanitizePayload(data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(sanitizePayload);
  if (typeof data !== 'object') return data;
  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (BLOCKED_KEYS.some(k => key.toLowerCase().includes(k))) {
      logger.warn(`Blocked secret key in job payload: ${key}`);
      continue;
    }
    sanitized[key] = typeof data[key] === 'object' && data[key] !== null ? sanitizePayload(data[key]) : data[key];
  }
  return sanitized;
}

export async function queueJob(
  name: string,
  data: any,
  options?: { scheduledAt?: Date; maxAttempts?: number; idempotencyKey?: string },
  tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
) {
  if (!ALLOWED_JOB_NAMES.includes(name)) { logger.error(`Rejected unknown job type: ${name}`); return null; }

  const sanitized = sanitizePayload(data);
  const payload = JSON.stringify(sanitized);
  if (payload.length > 50000) { logger.error('Job payload too large'); return null; }

  const client = tx || globalPrisma;
  const idempotencyKey = options?.idempotencyKey;

  if (idempotencyKey) {
    try {
      const job = await client.backgroundJob.create({
        data: {
          name,
          data: payload,
          status: 'queued',
          scheduledAt: options?.scheduledAt || new Date(),
          maxAttempts: options?.maxAttempts || 3,
          idempotencyKey,
        },
      });
      logger.info(`Queued job ${name} (${job.id})`);
      return job;
    } catch (err: any) {
      if (err.code === 'P2002') {
        const existing = await client.backgroundJob.findUniqueOrThrow({ where: { idempotencyKey } });
        logger.info(`Race resolved: returning existing job ${existing.id}`);
        return existing;
      }
      logger.error(`Failed to create job ${name}:`, err.message);
      return null;
    }
  }

  try {
    const job = await client.backgroundJob.create({
      data: {
        name,
        data: payload,
        status: 'queued',
        scheduledAt: options?.scheduledAt || new Date(),
        maxAttempts: options?.maxAttempts || 3,
      },
    });
    logger.info(`Queued job ${name} (${job.id})`);
    return job;
  } catch (err: any) {
    logger.error(`Failed to create job ${name}:`, err.message);
    return null;
  }
}