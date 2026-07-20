/**
 * Smoke test: Question bank generation rate limiting.
 */
import fs from 'fs';

let passed = 0; let failed = 0;
function assert(cond, label) { if (cond) { passed++; console.log(`  PASS: ${label}`); } else { failed++; console.error(`  FAIL: ${label}`); } }

function main() {
  console.log('=== Question Bank Generation Rate Limit Smoke ===\n');

  // 1. generation route exists with rate limiter
  console.log('--- Generation route ---');
  const adminSource = fs.readFileSync('src/server/admin.ts', 'utf8');
  const rateLimitSource = fs.readFileSync('src/server/rateLimiter.ts', 'utf8');
  assert(adminSource.includes('generationRateLimit'), 'Route uses generationRateLimit middleware');
  assert(rateLimitSource.includes('status(429)'), 'rateLimiter sends 429');
  assert(rateLimitSource.includes('rate_limit_exceeded'), '429 error is rate_limit_exceeded');

  // 2. Auth guards exist
  console.log('\n--- Auth guards ---');
  assert(adminSource.includes('authenticateToken'), 'authenticateToken middleware present');
  assert(adminSource.includes('requireRole'), 'requireRole middleware present');

  // 3. Rate limit config exists
  console.log('\n--- Rate limit config ---');
  assert(rateLimitSource.includes('WINDOW_MS'), 'Window config exists');
  assert(rateLimitSource.includes('MAX_PER_ADMIN'), 'Per-admin limit exists');
  assert(rateLimitSource.includes('MAX_PER_IP'), 'Per-IP fallback limit exists');
  assert(rateLimitSource.includes('AI_GENERATION_RATE_LIMIT_WINDOW_MS'), 'Configurable via env');
  assert(rateLimitSource.includes('AI_GENERATION_RATE_LIMIT_MAX_REQUESTS'), 'Max requests configurable via env');
  assert(rateLimitSource.includes('status(429)'), '429 status code sent');

  // 4. Concurrency guard exists
  console.log('\n--- Concurrency guard ---');
  assert(adminSource.includes('generation_in_progress'), 'Concurrency guard error message exists');
  assert(adminSource.includes('already running'), 'Active batch rejection message exists');

  // 5. RequestKey idempotency still exists
  console.log('\n--- Idempotency ---');
  assert(adminSource.includes('findUnique({ where: { requestKey } })'), 'requestKey idempotency check preserved');

  // 6. Batch size is 10
  console.log('\n--- Batch size ---');
  const batchMatch = adminSource.match(/i\s*<=\s*10[^}]*slotNumber/);
  assert(batchMatch !== null, 'Batch size is 10 (slot loop to 10)');

  // 7. Rate limiter exports config
  console.log('\n--- Rate limiter exports ---');
  assert(rateLimitSource.includes('export function generationRateLimit'), 'generationRateLimit exported');
  assert(rateLimitSource.includes('export function getRateLimitConfig'), 'getRateLimitConfig exported');

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
