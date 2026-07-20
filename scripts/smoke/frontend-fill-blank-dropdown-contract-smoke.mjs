#!/usr/bin/env node
import { ok, strictEqual, deepStrictEqual } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL  ${name}\n    ${e.message}`);
  }
}

function readSource(relativePath) {
  const full = resolve(ROOT, relativePath);
  ok(existsSync(full), `File not found: ${relativePath}`);
  return readFileSync(full, 'utf-8');
}

console.log('\nfrontend-fill-blank-dropdown-contract-smoke\n');

// 1. FIBRW Renderer handles [1] placeholders
test('FIBRW Renderer handles [1] placeholders', () => {
  const src = readSource('src/practice/tasks/FIBRW/Renderer.tsx');
  ok(src.includes('splitPromptIntoBlankParts'), 'FIBRW uses splitPromptIntoBlankParts');
  ok(src.match(/select/g), 'FIBRW renders <select> dropdowns');
});

// 2. FIBRW Renderer handles ____ placeholders
test('FIBRW Renderer handles ____ placeholders', () => {
  const src = readSource('src/practice/utils/blanks.ts');
  ok(src.includes('_{2,}'), 'blanks.ts regex matches underscore groups');
  ok(src.includes('\\[\\d+\\]'), 'blanks.ts regex matches numbered placeholders');
});

// 3. FIBRW does not render static-only underscores when options exist
test('FIBRW does not render static underscores when options exist', () => {
  const src = readSource('src/practice/tasks/FIBRW/Renderer.tsx');
  ok(src.includes('opts.length > 0'), 'FIBRW checks options length before rendering select');
  ok(src.includes('no options'), 'FIBRW shows error state when options missing');
});

// 4. FIBR Renderer same placeholder support
test('FIBR Renderer same placeholder support', () => {
  const src = readSource('src/practice/tasks/FIBR/Renderer.tsx');
  ok(src.includes('splitPromptIntoBlankParts'), 'FIBR uses splitPromptIntoBlankParts');
  ok(src.includes('normalizeBlankOptions'), 'FIBR uses normalizeBlankOptions');
});

// 5. FIBL Renderer same placeholder support
test('FIBL Renderer placeholder support', () => {
  const src = readSource('src/practice/tasks/FIBL/Renderer.tsx');
  ok(src.includes('splitPromptIntoBlankParts'), 'FIBL uses splitPromptIntoBlankParts');
  ok(src.match(/blankCount/g), 'FIBL computes blank count');
});

// 6. Mobile tappable select/dropdown exists
test('Mobile tappable select/dropdown exists', () => {
  for (const file of ['src/practice/tasks/FIBRW/Renderer.tsx', 'src/practice/tasks/FIBR/Renderer.tsx']) {
    const src = readSource(file);
    ok(src.includes('appearance-none'), `${file}: uses appearance-none for mobile-friendly select`);
    ok(src.includes('<select'), `${file}: renders native HTML select`);
  }
});

// 7. Mock exam FillBlankRenderer has dropdown support
test('Mock exam FillBlankRenderer has dropdown support', () => {
  const src = readSource('src/components/mock-exam/renderers/FillBlankRenderer.tsx');
  ok(src.includes('splitPromptIntoBlankParts'), 'Mock FillBlankRenderer uses splitPromptIntoBlankParts');
  ok(src.includes('<select'), 'Mock FillBlankRenderer renders select dropdowns');
});

// 8. Publish validation validates blank count
test('Publish validation validates blank count', () => {
  const src = readSource('src/practice/contracts/publishValidation.ts');
  ok(src.includes('promptBlankCount'), 'publishValidation checks prompt blank count');
  ok(src.includes('BLANK_ANSWER_MISMATCH'), 'publishValidation reports blank answer mismatch');
});

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
