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

console.log('=== No First-Question-Only Check ===\n');

// 1. PracticeEngine uses questionIndex (not items[0])
const enginePath = join(root, 'src/components/PracticeEngine.tsx');
const engineContent = readFileSync(enginePath, 'utf8');
assert(engineContent.includes('useState(0)'), 'PracticeEngine uses index state');
assert(!engineContent.includes('items?.[0]'), 'PracticeEngine does not use items?.[0]');
assert(!engineContent.includes('items[0]'), 'PracticeEngine does not use items[0]');

// 2. PracticeEngine loads with page/pagination
assert(engineContent.includes('setPage'), 'PracticeEngine has page state');
assert(engineContent.includes('pageSize'), 'PracticeEngine has pageSize');
assert(engineContent.includes('totalPages'), 'PracticeEngine shows totalPages');

// 3. Question list endpoint uses pagination (skip/take)
const studentPath = join(root, 'src/server/student.ts');
const studentContent = readFileSync(studentPath, 'utf8');
assert(studentContent.includes('skip,'), 'Server uses skip for pagination');
assert(studentContent.includes('take: pageSize'), 'Server uses take for pagination');

// 4. Question list endpoint returns total/totalPages
assert(studentContent.includes('totalPages'), 'Server returns totalPages');
assert(studentContent.includes('total'), 'Server returns total');

// 5. API limit is not hardcoded to 10
assert(!studentContent.includes('limit: 10'), 'Server does not hardcode limit: 10');

// 6. Frontend selects by questionIndex, not always items[0]
assert(engineContent.includes('questionIndex'), 'Frontend uses questionIndex state');
assert(engineContent.includes('setQuestionIndex'), 'Frontend updates questionIndex');
assert(engineContent.includes("items[questionIndex]"), 'Frontend selects by questionIndex');
assert(!engineContent.includes("items[0]"), 'No items[0] hardcoded selection');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All no-first-question-only checks passed.');
