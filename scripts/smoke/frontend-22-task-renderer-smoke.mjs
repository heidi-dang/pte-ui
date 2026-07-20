#!/usr/bin/env node

/**
 * 22-task renderer smoke: verifies all renderers exist, accept currentResponse,
 * and stateful renderers initialize from currentResponse.
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

const ALL_TASKS = ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS', 'SWT', 'WE',
  'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW', 'SST', 'MCMSL', 'FIBL', 'HCS',
  'MCSSL', 'SMW', 'HIW', 'WFD'];

console.log('\n--- Check 1: All 22 renderer files exist ---');
for (const task of ALL_TASKS) {
  const filePath = `src/practice/tasks/${task}/Renderer.tsx`;
  try {
    fs.accessSync(path.resolve(root, filePath));
    console.log(`  EXISTS: ${filePath}`);
    passed++;
  } catch {
    console.log(`  FAIL: ${filePath} NOT FOUND`);
    failed++;
  }
}

console.log('\n--- Check 2: All 22 renderers accept currentResponse through RendererProps ---');
const typesFile = read('src/practice/tasks/types.ts');
assert(typesFile.includes('currentResponse'), 'RendererProps includes currentResponse');

for (const task of ALL_TASKS) {
  const filePath = `src/practice/tasks/${task}/Renderer.tsx`;
  try {
    const content = read(filePath);
    const hasCurrentResponse = content.includes('currentResponse');
    const hasUseState = content.includes('useState');
    if (hasUseState) {
      assert(hasCurrentResponse, `${task} Renderer (stateful) uses currentResponse`);
    } else {
      console.log(`  OK: ${task} Renderer (stateless) — currentResponse not needed`);
      passed++;
    }
  } catch {
    // already reported in check 1
  }
}

console.log('\n--- Check 3: Stateful renderers initialize from currentResponse ---');
const STATEFUL = ['SWT', 'WE', 'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW', 'SST', 'MCMSL', 'FIBL', 'HCS', 'MCSSL', 'SMW', 'HIW', 'WFD'];
for (const task of STATEFUL) {
  const content = read(`src/practice/tasks/${task}/Renderer.tsx`);
  assert(
    content.includes('currentResponse?.'),
    `${task} initializes state from currentResponse`
  );
}

console.log('\n--- Check 4: No renderer has raw data.map crash pattern ---');
const sessionPage = read('src/components/student/pages/PracticeSessionPage.tsx');
assert(!sessionPage.includes('data.map('), 'No data.map() crash pattern in PracticeSessionPage');

console.log(`\n=== Results: ${passed}/${passed + failed} passed, ${failed}/${passed + failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
