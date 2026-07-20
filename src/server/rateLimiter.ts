import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60_000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, CLEANUP_INTERVAL);

const WINDOW_MS = Math.max(1000, Number(process.env.AI_GENERATION_RATE_LIMIT_WINDOW_MS) || 60_000);
const MAX_PER_ADMIN = Math.max(1, Number(process.env.AI_GENERATION_RATE_LIMIT_MAX_REQUESTS) || 5);
const MAX_PER_IP = Math.max(1, Number(process.env.AI_GENERATION_RATE_LIMIT_IP_MAX_REQUESTS) || 10);

export function getRateLimitConfig() {
  return { windowMs: WINDOW_MS, maxPerAdmin: MAX_PER_ADMIN, maxPerIp: MAX_PER_IP };
}

export function generationRateLimit(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;
  const adminKey = user?.id ? `admin:${user.id}` : undefined;
  const ipKey = `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  const now = Date.now();

  // Check admin limit first
  if (adminKey) {
    let entry = store.get(adminKey);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      store.set(adminKey, entry);
    }
    entry.count++;
    res.setHeader('X-RateLimit-Admin', String(entry.count));
    res.setHeader('X-RateLimit-Admin-Max', String(MAX_PER_ADMIN));
    res.setHeader('X-RateLimit-Admin-Window', String(WINDOW_MS));
    if (entry.count > MAX_PER_ADMIN) {
      logger.warn(`Rate limit exceeded for admin ${user.id} (${entry.count} requests in window)`);
      res.status(429).json({
        error: 'rate_limit_exceeded',
        message: `Too many generation requests. Maximum ${MAX_PER_ADMIN} per ${WINDOW_MS / 1000}s. Please wait before trying again.`,
        retryAfterMs: entry.resetAt - now,
      });
      return;
    }
  }

  // Check IP fallback limit
  let ipEntry = store.get(ipKey);
  if (!ipEntry || ipEntry.resetAt <= now) {
    ipEntry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(ipKey, ipEntry);
  }
  ipEntry.count++;
  if (ipEntry.count > MAX_PER_IP) {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: `Too many requests from this IP. Maximum ${MAX_PER_IP} per ${WINDOW_MS / 1000}s.`,
      retryAfterMs: ipEntry.resetAt - now,
    });
    return;
  }

  next();
}
