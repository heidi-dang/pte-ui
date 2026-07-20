#!/usr/bin/env node

/**
 * Regression smoke: Practice Session Question Loader Contract.
 *
 * Verifies the fix for the production crash:
 *   "Gt.map is not a function"
 *
 * Root cause: PracticeSessionPage treated QuestionListResponse (an object
 * with .items) as if it were a plain array.
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

console.log('\n--- Check 1: PracticeSessionPage.map() contract ---');
const sessionPage = read('src/components/student/pages/PracticeSessionPage.tsx');
assert(!sessionPage.includes('data.map('), 'PracticeSessionPage does not call data.map(');

console.log('\n--- Check 2: PracticeSessionPage uses .items ---');
assert(sessionPage.includes('data?.items'), 'PracticeSessionPage reads data?.items');
assert(sessionPage.includes('questionItems.map'), 'PracticeSessionPage maps questionItems');
assert(sessionPage.includes('questionItems.length === 0'), 'Empty items shows empty state');

console.log('\n--- Check 3: questions.api.ts typed contract ---');
const questionsApi = read('src/api/questions.api.ts');
assert(questionsApi.includes('Promise<QuestionListResponse>'), 'getPublishedQuestions returns Promise<QuestionListResponse>');
assert(questionsApi.includes('apiFetch<QuestionListResponse>'), 'apiFetch called with QuestionListResponse generic');
assert(questionsApi.includes("import type { QuestionListResponse }"), 'QuestionListResponse type imported');

console.log('\n--- Check 4: getPublishedQuestionForTask ---');
assert(questionsApi.includes('result.items?.[0]'), 'getPublishedQuestionForTask reads result.items[0]');

console.log('\n--- Check 5: pageSize query param ---');
assert(questionsApi.includes('pageSize ?? filters.limit'), 'pageSize used when supplied, limit is fallback');
assert(questionsApi.includes("params.set('pageSize'"), 'Query uses pageSize parameter');

console.log(`\n=== Results: ${passed}/${passed + failed} passed, ${failed}/${passed + failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
