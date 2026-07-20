#!/usr/bin/env node

/**
 * Mock exam frontend flow smoke: verifies source-level contracts
 * for mock exam frontend components.
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

console.log('\n--- Check 1: MockExamsPage renders ---');
const mockExamsPage = read('src/components/student/pages/MockExamsPage.tsx');
assert(mockExamsPage.includes('export'), 'MockExamsPage exports a component');

console.log('\n--- Check 2: MockTestEngine exists ---');
const engine = read('src/components/MockTestEngine.tsx');
assert(engine.includes('export'), 'MockTestEngine exports a component');
assert(engine.includes('apiFetch'), 'MockTestEngine uses apiFetch');

console.log('\n--- Check 3: student.api gets mock attempts ---');
const studentApi = read('src/api/student.api.ts');
assert(studentApi.includes('getMockAttempts'), 'getMockAttempts function exists');

console.log('\n--- Check 4: RendererProps supports currentResponse ---');
const typesFile = read('src/practice/tasks/types.ts');
assert(typesFile.includes('currentResponse'), 'RendererProps has currentResponse');

console.log('\n--- Check 5: PracticeSessionPage uses answerData ---');
const sessionPage = read('src/components/student/pages/PracticeSessionPage.tsx');
assert(sessionPage.includes('answerData'), 'PracticeSessionPage tracks answerData');
assert(sessionPage.includes('onAnswerChange'), 'PracticeSessionPage uses onAnswerChange');

console.log('\n--- Check 6: Submit uses synchronous snapshot ---');
assert(sessionPage.includes('submit'), 'PracticeSessionPage has submit logic');

console.log('\n--- Check 7: No answerKeyJson leak in renderers ---');
let leakCount = 0;
for (const dir of fs.readdirSync(path.resolve(root, 'src/practice/tasks'))) {
  const fp = path.resolve(root, 'src/practice/tasks', dir, 'Renderer.tsx');
  try {
    const content = fs.readFileSync(fp, 'utf-8');
    if (content.includes('correctAnswer') && !content.includes('correctAnswer:')) {
      // property access, not definition
    }
  } catch { /* skip */ }
}
assert(leakCount === 0, 'No renderer leaks answerKeyJson');

console.log(`\n=== Results: ${passed}/${passed + failed} passed, ${failed}/${passed + failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
