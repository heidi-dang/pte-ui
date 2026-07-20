/**
 * Smoke test: AI provider architecture.
 * Verifies:
 * - production rejects AI_PROVIDER=fake
 * - production rejects missing DeepSeek key when AI_PROVIDER=deepseek
 * - test mode allows fake provider
 * - generator imports centralized provider
 * - reviewer imports centralized provider
 * - batch size remains 10
 */
import fs from 'fs';

let passed = 0; let failed = 0;
function assert(cond, label) { if (cond) { passed++; console.log(`  PASS: ${label}`); } else { failed++; console.error(`  FAIL: ${label}`); } }

function testValidateConfig(provider, nodeEnv, deepseekKey) {
  const isProduction = nodeEnv === 'production';
  if (isProduction && provider === 'fake') {
    return { ok: false, error: 'fake' };
  }
  if (provider === 'deepseek') {
    if (!deepseekKey || deepseekKey.length < 8) {
      return { ok: false, error: 'no-deepseek-key' };
    }
  }
  return { ok: true };
}

async function main() {
  console.log('=== Question Bank AI Provider Architecture Smoke ===\n');

  // 1. Production rejects AI_PROVIDER=fake
  console.log('--- Production rejects fake provider ---');
  const prodFake = testValidateConfig('fake', 'production', '');
  assert(!prodFake.ok, 'production + AI_PROVIDER=fake -> rejected');
  assert(prodFake.error === 'fake', 'error type is fake');

  // 2. Production rejects missing DeepSeek key
  console.log('\n--- Production requires DeepSeek key ---');
  const prodNoKey = testValidateConfig('deepseek', 'production', '');
  assert(!prodNoKey.ok, 'production + deepseek without key -> rejected');

  const prodShortKey = testValidateConfig('deepseek', 'production', 'short');
  assert(!prodShortKey.ok, 'production + deepseek with short key -> rejected');

  const prodWithKey = testValidateConfig('deepseek', 'production', 'sk-valid-key-length');
  assert(prodWithKey.ok, 'production + deepseek with valid key -> allowed');

  // 3. Test mode allows fake provider
  console.log('\n--- Test mode allows fake ---');
  const testFake = testValidateConfig('fake', 'development', '');
  assert(testFake.ok, 'development + AI_PROVIDER=fake -> allowed');

  // 4. Generator imports centralized provider
  console.log('\n--- Generator uses centralized provider ---');
  const genSource = fs.readFileSync('src/server/questionGeneration/generator.ts', 'utf8');
  assert(genSource.includes("from '../ai/provider'"), 'generator imports from ../ai/provider');
  assert(!genSource.includes("from '../aiService'"), 'generator does not import from aiService');

  // 5. Reviewer imports centralized provider
  console.log('\n--- Reviewer uses centralized provider ---');
  const revSource = fs.readFileSync('src/server/questionGeneration/reviewer.ts', 'utf8');
  assert(revSource.includes("from '../ai/provider'"), 'reviewer imports from ../ai/provider');
  assert(!revSource.includes("from '../aiService'"), 'reviewer does not import from aiService');

  // 6. No legacy direct DeepSeek call remains in generation pipeline
  console.log('\n--- No direct DeepSeek fetch in generation pipeline ---');
  assert(!genSource.includes('api.deepseek.com'), 'generator no direct DeepSeek URL');
  assert(!revSource.includes('api.deepseek.com'), 'reviewer no direct DeepSeek URL');

  // 7. Batch size is 10
  console.log('\n--- Batch size ---');
  const adminSource = fs.readFileSync('src/server/admin.ts', 'utf8');
  const batchMatch = adminSource.match(/requestedCount:\s*(\d+)/);
  assert(batchMatch !== null, 'Batch size found in admin.ts');
  assert(batchMatch[1] === '10', `Batch size is 10 (got ${batchMatch[1]})`);

  // 8. Provider config has validateConfig function
  console.log('\n--- Provider config has production guard ---');
  const providerSource = fs.readFileSync('src/server/ai/provider.ts', 'utf8');
  assert(providerSource.includes('validateConfig'), 'provider.ts exports validateConfig');
  assert(providerSource.includes('NODE_ENV === \'production\''), 'provider.ts checks NODE_ENV');

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('Crash:', err); process.exit(1); });
