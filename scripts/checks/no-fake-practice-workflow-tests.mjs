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

function checkFile(path, patterns, label) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const pattern of patterns) {
    if (content.includes(pattern)) {
      failed++;
      console.error(`  FAIL: ${label} contains forbidden pattern "${pattern}" in ${path.replace(root, '')}`);
    } else {
      passed++;
    }
  }
}

console.log('=== No Fake Practice Workflow Tests Check ===\n');

const testFiles = [
  'scripts/integration/practice-behavioural-tests.mjs',
  'scripts/integration/practice-real-workflow-tests.mjs',
  'scripts/smoke/deterministic-practice-submit-smoke.mjs',
  'scripts/smoke/practice-submission-smoke.mjs',
];

const forbiddenPatterns = [
  "PracticeAttempt.*Completed",
  "update.*status.*Completed",
  "update.*score",
  "simulate.*success",
  "manual.*status",
  "fake terminal",
];

for (const file of testFiles) {
  const fullPath = join(root, file);
  checkFile(fullPath, forbiddenPatterns, file);
}

  // Check existing behavioural tests for specific DB-write patterns
const existingPath = join(root, 'scripts/integration/practice-behavioural-tests.mjs');
if (existsSync(existingPath)) {
  const content = readFileSync(existingPath, 'utf8');
  // Check for direct score update in prisma submission update: e.g., data: { status: 'graded', score: ... }
  const hasDirectScoreWrite = /\bdata:\s*\{[^}]*\bscore:\s*\d+/.test(content) && content.includes('prisma.practiceSubmission.update');
  if (hasDirectScoreWrite) {
    failed++;
    console.error('  FAIL: practice-behavioural-tests.mjs directly writes score to PracticeSubmission (fake grading)');
  } else {
    passed++;
  }
  // Check for "pending_deterministic" as a status assertion (not in comment text)
  if (content.includes("=== 'pending_deterministic'") || content.includes('"pending_deterministic"') || content.includes("'pending_deterministic'")) {
    failed++;
    console.error('  FAIL: practice-behavioural-tests.mjs still checks pending_deterministic as expected status');
  } else {
    passed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All no-fake-workflow checks passed.');
