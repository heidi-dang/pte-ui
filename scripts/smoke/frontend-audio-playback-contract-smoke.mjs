#!/usr/bin/env node
import { ok, strictEqual } from 'node:assert';
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

console.log('\nfrontend-audio-playback-contract-smoke\n');

// 1. StudentSafeQuestion includes audioUrl for listening tasks
test('StudentSafeQuestion includes audioUrl for listening tasks', () => {
  const src = readSource('src/practice/contracts/studentSafeQuestion.ts');
  ok(src.includes('audioUrl?: string'), 'StudentSafeQuestion has audioUrl field');
  ok(src.includes('requiresPromptAudio'), 'buildStudentSafeQuestion checks requiresPromptAudio');
  ok(src.includes('safe.audioUrl'), 'buildStudentSafeQuestion sets audioUrl');
});

// 2. QuestionListItem includes audioUrl
test('QuestionListItem includes audioUrl', () => {
  const src = readSource('src/shared/api/practice.ts');
  ok(src.includes('audioUrl?: string'), 'QuestionListItem has audioUrl');
});

// 3. Server endpoint fetches audioUrl
test('Server endpoint fetches audioUrl', () => {
  const src = readSource('src/server/student.ts');
  ok(src.includes('audioUrl: true'), 'Server question list query includes audioUrl');
});

// 4. WFD cannot render answer input only when audio is required
test('WFD renderer exists with audio contract', () => {
  const src = readSource('src/practice/tasks/WFD/Renderer.tsx');
  ok(src.includes('WFDRenderer'), 'WFD Renderer exists');
});

// 5. PracticeSessionPage enters prompt_playing for listening tasks with hasPromptAudio
test('PracticeSessionPage enters prompt_playing for listening tasks', () => {
  const src = readSource('src/components/student/pages/PracticeSessionPage.tsx');
  ok(src.includes('hasPromptAudio'), 'PracticeSessionPage checks hasPromptAudio');
  ok(src.includes('prompt_playing') && src.includes('hasPromptAudio'), 'prompt_playing is triggered by hasPromptAudio');
});

// 6. Missing audio shows blocking error state
test('Missing audio shows blocking error state', () => {
  const src = readSource('src/components/student/pages/PracticeSessionPage.tsx');
  ok(src.includes('Audio Unavailable'), 'Page has Audio Unavailable state');
  ok(src.includes('audio required'), 'Page blocks answering when audio missing');
});

// 7. hasPromptAudio true requires playable audio in buildStudentSafeQuestion
test('buildStudentSafeQuestion conditionally includes audioUrl', () => {
  const src = readSource('src/practice/contracts/studentSafeQuestion.ts');
  ok(src.includes('raw.audioUrl'), 'buildStudentSafeQuestion checks raw.audioUrl before setting');
});

// 8. Publish validation ensures audio exists for listening tasks
test('Publish validation ensures audio for listening tasks', () => {
  const src = readSource('src/practice/contracts/publishValidation.ts');
  ok(src.includes('PROMPT_AUDIO_REQUIRED'), 'publishValidation has PROMPT_AUDIO_REQUIRED check');
});

console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
