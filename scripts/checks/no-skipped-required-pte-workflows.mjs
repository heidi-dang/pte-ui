#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('=== No Skipped Required PTE Workflows Check ===\n');

const wfPath = join(root, 'scripts/integration/practice-real-workflow-tests.mjs');
assert(existsSync(wfPath), 'workflow test file exists');

const content = readFileSync(wfPath, 'utf8');

const skipPatterns = [
  '// SKIP:', '// skip:', 'requires DeepSeek', 'requires STT',
  'requires audio infrastructure', 'via MCS', 'via MCS\'',
  '"infrastructure unavailable"',
  "'infrastructure unavailable'",
];

for (const pattern of skipPatterns) {
  assert(!content.includes(pattern), `No skip pattern "${pattern}" in workflow test`);
}

// Verify each required workflow is present
const requiredWorkflows = [
  'RA workflow', 'RS workflow', 'ASQ workflow', 'SGD workflow',
  'WFD workflow', 'HIW workflow', 'MCM workflow',
  'SWT workflow', 'WE workflow', 'SST workflow',
];

for (const wf of requiredWorkflows) {
  assert(content.includes(wf), `Required workflow "${wf}" is present`);
}

// Verify MCM is tested separately from MCS
assert(content.includes('selectedMultiple'), 'MCM uses selectedMultiple (multi-answer)');
const mcmSection = content.split("7. MCM workflow'")[1]?.split("8. SWT workflow'")[0] || '';
assert(!mcmSection.includes('selectedOption'), 'MCM section does not use selectedOption');
assert(mcmSection.includes('selectedMultiple'), 'MCM section uses selectedMultiple');

// Verify fake provider mode is used
assert(content.includes('PTE_TEST_MODE'), 'Uses PTE_TEST_MODE');
assert(content.includes('AI_PROVIDER'), 'Uses AI_PROVIDER fake');
assert(content.includes('STT_PROVIDER'), 'Uses STT_PROVIDER fake');

// Verify score assertions are present for key workflows
assert(content.includes('full score 6'), 'WFD score assertion present');
assert(content.includes('score = correct - incorrect'), 'MCM score formula present');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All no-skipped-workflow checks passed.');
