#!/usr/bin/env node

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

const CHECKS = [
  { name: 'Task contract parity', cmd: 'node scripts/smoke/practice-task-contract-gate.mjs' },
  { name: 'No Pending_Deterministic terminal', cmd: 'node scripts/checks/no-pending-deterministic-terminal.mjs' },
  { name: 'No unsafe publish', cmd: 'node scripts/checks/no-unsafe-question-publish.mjs' },
  { name: 'Hidden content boundary', cmd: 'bun run scripts/smoke/hidden-content-boundary-smoke.mjs' },
  { name: 'Playback limit', cmd: 'bun run scripts/smoke/playback-limit-smoke.mjs' },
  { name: 'Question bank pagination', cmd: 'bun run scripts/smoke/question-bank-pagination-smoke.mjs' },
  { name: 'No first-question-only', cmd: 'node scripts/checks/no-first-question-only.mjs' },
  { name: 'No fake workflow tests', cmd: 'node scripts/checks/no-fake-practice-workflow-tests.mjs' },
  { name: 'All 22 task start smoke', cmd: 'bun run scripts/smoke/all-22-task-start-smoke.mjs' },
];

let totalPassed = 0;
let totalFailed = 0;

console.log('=== PTE Production Readiness Gate ===\n');

for (const check of CHECKS) {
  process.stdout.write(`[${check.name}]... `);
  try {
    execSync(check.cmd, { cwd: root, stdio: 'pipe', timeout: 60000 });
    console.log('PASS');
    totalPassed++;
  } catch (err) {
    console.log('FAIL');
    const lines = String(err.stdout || '').split('\n').filter(Boolean).slice(-5);
    for (const line of lines) console.error(`  ${line}`);
    totalFailed++;
  }
}

console.log(`\nGate results: ${totalPassed} passed, ${totalFailed} failed`);
if (totalFailed > 0) process.exit(1);
console.log('PTE production readiness gate: ALL PASS');
