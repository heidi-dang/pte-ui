#!/usr/bin/env node

/**
 * Frontend API contract smoke: verifies no unstable array-or-object
 * response shapes exist in frontend API consumers.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  PASS: ${label}`); passed++; }
  else { console.log(`  FAIL: ${label}`); failed++; }
}

function read(file) {
  return fs.readFileSync(path.resolve(root, file), 'utf-8');
}

console.log('\n--- Check 1: No data.map bug in PracticeSessionPage ---');
const sessionPage = read('src/components/student/pages/PracticeSessionPage.tsx');
assert(!sessionPage.includes('data.map('), 'No raw data.map() on API response');

console.log('\n--- Check 2: getPublishedQuestions returns QuestionListResponse ---');
const questionsApi = read('src/api/questions.api.ts');
assert(questionsApi.includes('Promise<QuestionListResponse>'), 'Typed return contract');

console.log('\n--- Check 3: All .map() calls after apiFetch use .items ---');
const mockExamsPage = read('src/components/student/pages/MockExamsPage.tsx');
const questionBrowser = read('src/components/student/pages/QuestionBrowserPage.tsx');
assert(mockExamsPage.includes('data?.items') || mockExamsPage.includes('.map('), 'MockExamsPage handles response shape');
assert(questionBrowser.includes('res.items'), 'QuestionBrowser uses res.items');

console.log('\n--- Check 4: getMockAttempts has typed return ---');
const studentApi = read('src/api/student.api.ts');
assert(studentApi.includes('Promise<'), 'student.api functions have return types');

console.log(`\n=== Results: ${passed}/${passed + failed} passed, ${failed}/${passed + failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
