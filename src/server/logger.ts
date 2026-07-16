import { prisma } from './db';

export async function logToDb(level: 'info' | 'warn' | 'error', message: string, metadata?: any) {
  try {
    const metaStr = metadata ? JSON.stringify(metadata) : null;
    console.log(`[${level.toUpperCase()}] ${message}`, metadata ? metaStr : '');
    await prisma.logEntry.create({
      data: {
        level,
        message,
        metadata: metaStr,
      },
    });
  } catch (err) {
    console.error('Failed to write log to database:', err);
  }
}

export const logger = {
  info: (message: string, metadata?: any) => logToDb('info', message, metadata),
  warn: (message: string, metadata?: any) => logToDb('warn', message, metadata),
  error: (message: string, metadata?: any) => logToDb('error', message, metadata),
};
