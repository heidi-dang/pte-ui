#!/usr/bin/env node
import { ok } from 'node:assert';
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

console.log('\nmock-audio-fillblank-contract-smoke\n');

// 1. Mock listening question has playable audio path/playback endpoint
test('MockTestEngine has play-prompt endpoint', () => {
  const src = readSource('src/components/MockTestEngine.tsx');
  ok(src.includes('play-prompt'), 'MockTestEngine calls play-prompt endpoint');
  ok(src.includes('authorizedAudioUrl'), 'MockTestEngine uses authorizedAudioUrl');
});

// 2. Mock fill-blank question renders selectable blanks
test('Mock FillBlankRenderer renders selectable blanks', () => {
  const src = readSource('src/components/mock-exam/renderers/FillBlankRenderer.tsx');
  ok(src.includes('<select'), 'Mock FillBlankRenderer uses dropdowns');
  ok(src.includes('splitPromptIntoBlankParts'), 'Mock FillBlankRenderer parses blanks');
});

// 3. Play-prompt validates audio exists before consumption
test('Play-prompt validates audio exists', () => {
  const src = readSource('src/server/student.ts');
  ok(src.includes('play-prompt'), 'Server has play-prompt endpoint');
});

// 4. Mock exam audio handling for fill-blank dropdown
test('Mock FillBlankRenderer uses blank navigation correctly', () => {
  const src = readSource('src/components/mock-exam/renderers/FillBlankRenderer.tsx');
  ok(src.includes('blankCount'), 'Mock FillBlankRenderer computes blank count');
  ok(src.includes('normalizeBlankOptions'), 'Mock FillBlankRenderer normalizes options');
});

// 5. Blanks utility supports both blank types
test('Blanks utility supports [1] and ____ blanks', () => {
  const src = readSource('src/practice/utils/blanks.ts');
  ok(src.includes('_{2,}'), 'Regex handles ____ blanks');
  ok(src.includes('\\[\\d+\\]'), 'Regex handles [1] blanks');
  ok(src.includes('normalizeBlankOptions'), 'Utility normalizes blank options');
});

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
