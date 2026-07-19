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

console.log('=== No False ASQ Workflow Pass Check ===\n');

const wfPath = join(root, 'scripts/integration/practice-real-workflow-tests.mjs');
const content = readFileSync(wfPath, 'utf8');

// 1. ASQ must assert score > 0 (proves deterministic scorer found match)
assert(!content.includes('(score=0)'), 'ASQ does not assert score=0 (a passing ASQ must have score > 0)');
assert(content.includes('score > 0'), 'ASQ asserts score > 0');

// 2. ASQ must assert transcript matches fake STT output
assert(content.includes('transcript'), 'ASQ workflow asserts transcript');

// 3. ASQ must assert score > 0 as proof of accepted-answer match
assert(content.includes('deterministic scorer found answer match'), 'ASQ workflow asserts deterministic match reason');

// 4. ASQ workflow must check more than just status=Completed
const asqSection = content.split("ASQ workflow'")[1]?.split("SGD workflow'")[0] || '';
assert(asqSection.includes('assert'), 'ASQ section has assertions');
const assertionCount = (asqSection.match(/assert/g) || []).length;
assert(assertionCount >= 4, `ASQ section has at least 4 assertions (has ${assertionCount})`);

// 5. Check ASQ scorer reads typedText (from merged answerJson)
const asqScorerPath = join(root, 'src/practice/scoring/ASQ.ts');
const scorerContent = readFileSync(asqScorerPath, 'utf8');
assert(scorerContent.includes('typedText'), 'ASQ scorer reads typedText');

// 6. Check ASQ scorer version is deterministic-pte-v1 (used by scorers even if result endpoint returns pte-v1)
assert(scorerContent.includes("scorerVersion: 'deterministic-pte-v1'"), 'ASQ scorer has deterministic-pte-v1');

// 7. Check evaluateSubmission merges answerText into parsed answer for deterministic tasks
const aiServicePath = join(root, 'src/server/aiService.ts');
const aiContent = readFileSync(aiServicePath, 'utf8');
assert(aiContent.includes('typedText: answerText'), 'evaluateSubmission merges answerText into parsed answer');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All no-false-ASQ checks passed.');
