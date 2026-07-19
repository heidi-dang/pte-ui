#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('=== No Pending_Deterministic Terminal Check ===\n');

// 1. Check no transition defines Pending_Deterministic as terminal (no outgoing edges)
const transitionsPath = join(root, 'src/practice/contracts/transitions.ts');
const transitions = readFileSync(transitionsPath, 'utf8');

const allowedLines = transitions.split('\n').filter(l => l.includes('Pending_Deterministic'));
assert(allowedLines.length >= 3, 'Pending_Deterministic appears in transitions');

// Pending_Deterministic must have outgoing transitions to Completed, Grading_Failed, Expired
const hasCompletedOut = transitions.includes("Pending_Deterministic: ['Completed', 'Grading_Failed', 'Expired']");
const hasCompletedOutAlt = transitions.includes("Pending_Deterministic: ['Completed', 'Grading_Failed', 'Expired']");
assert(hasCompletedOut || hasCompletedOutAlt, 'Pending_Deterministic can transition to Completed/Grading_Failed/Expired');

// 2. Check aiService.ts no longer returns pending_deterministic
const aiServicePath = join(root, 'src/server/aiService.ts');
const aiService = readFileSync(aiServicePath, 'utf8');
assert(!aiService.includes('pending_deterministic'), 'aiService.ts does not return pending_deterministic');
assert(!aiService.includes("'pending_deterministic'"), 'aiService.ts no longer has pending_deterministic type');

// 3. Check worker.ts no longer returns pendingDeterministic
const workerPath = join(root, 'src/server/jobs/worker.ts');
const worker = readFileSync(workerPath, 'utf8');
assert(!worker.includes('pendingDeterministic'), 'worker.ts does not return pendingDeterministic');

// 4. Check all DETERMINISTIC_TASKS have a registered scorer
const scoringIndexPath = join(root, 'src/practice/scoring/index.ts');
const scoringIndex = readFileSync(scoringIndexPath, 'utf8');

const deterministicCodes = ['MCS','MCM','ROP','FIBR','FIBRW','FIBL','HCS','MCSSL','MCMSL','SMW','HIW','WFD','ASQ'];
assert(scoringIndex.includes('const SCORER_REGISTRY'), 'SCORER_REGISTRY is defined in scoring/index.ts');

for (const code of deterministicCodes) {
  assert(scoringIndex.includes(`${code}:`), `${code} has registered scorer in SCORER_REGISTRY`);
}

// 5. Check no task returns pending_deterministic as final result in test files
const testScoringPath = join(root, 'tests/scoring/deterministic-scorers.test.ts');
if (existsSync(testScoringPath)) {
  const testContent = readFileSync(testScoringPath, 'utf8');
  assert(!testContent.includes('Pending_Deterministic'), 'Tests do not contain Pending_Deterministic');
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All terminal-state checks passed.');
