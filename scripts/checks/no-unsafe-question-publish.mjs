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

console.log('=== No Unsafe Question Publish Check ===\n');

// 1. Publish validation module exists and exports validatePublishableQuestion
const pvPath = join(root, 'src/practice/contracts/publishValidation.ts');
assert(existsSync(pvPath), 'publishValidation.ts exists');
const pvContent = readFileSync(pvPath, 'utf8');
assert(pvContent.includes('export function validatePublishableQuestion'), 'validatePublishableQuestion exported');
assert(pvContent.includes('export function getAnswerKeySchema'), 'getAnswerKeySchema exported');
assert(pvContent.includes('IssueCodes'), 'IssueCodes exported');

// 2. Answer-key schemas for all deterministic tasks
const deterministicCodes = ['MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD', 'ASQ'];
for (const code of deterministicCodes) {
  assert(pvContent.includes(`${code}:`), `${code} has answer-key schema in schemas object`);
}

// 3. Admin publish endpoint calls validatePublishableQuestion before publishing
const adminPath = join(root, 'src/server/admin.ts');
const adminContent = readFileSync(adminPath, 'utf8');
assert(adminContent.includes('validatePublishableQuestion'), 'admin.ts imports validatePublishableQuestion');
assert(adminContent.includes('validation.canPublish'), 'admin.ts checks canPublish before publishing');

// 4. Student-facing question endpoints do not select answerKeyJson
const studentPath = join(root, 'src/server/student.ts');
const studentContent = readFileSync(studentPath, 'utf8');
const answerKeyInStudentSelect = studentContent.match(/select\s*:\s*\{[^}]*answerKeyJson[^}]*\}/);
assert(!answerKeyInStudentSelect, 'student.ts does not select answerKeyJson in question list');

// 5. Broken duplicated condition is gone from validation.ts
const validationPath = join(root, 'src/practice/contracts/validation.ts');
const validationContent = readFileSync(validationPath, 'utf8');
assert(!validationContent.includes('!payload.answerKeyJson && !payload.answerKeyJson'), 'Duplicated condition removed from validation.ts');

// 6. publishValidation has all required issue codes
const requiredCodes = [
  'TASK_UNKNOWN', 'QUESTION_SCHEMA_INVALID', 'ANSWER_KEY_MISSING',
  'ANSWER_KEY_INVALID', 'PROMPT_AUDIO_REQUIRED', 'IMAGE_REQUIRED',
  'OPTIONS_REQUIRED', 'CORRECT_OPTION_INVALID', 'CORRECT_ORDER_INVALID',
  'BLANK_ANSWER_MISMATCH', 'HIW_POSITION_INVALID', 'HIDDEN_PROMPT_EXPOSED',
  'UNSAFE_STUDENT_FIELD',
];
for (const code of requiredCodes) {
  assert(pvContent.includes(code), `Issue code ${code} exists`);
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All no-unsafe-publish checks passed.');
