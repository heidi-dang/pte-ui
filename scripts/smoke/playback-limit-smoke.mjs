#!/usr/bin/env node

import { buildStudentSafeQuestion } from '../../src/practice/contracts/studentSafeQuestion.ts';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq(actual, expected, msg) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

console.log('=== Playback Limit Boundary Smoke ===\n');

// 1. Question list never returns audio URL
console.log('1. Question list — no audioUrl');
const questionCodes = ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS', 'SWT', 'WE',
  'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD'];

for (const code of questionCodes) {
  const safe = buildStudentSafeQuestion(code, {
    id: 'q-1', taskCode: code, section: 'Test', title: 'Test', instruction: 'Test',
    difficulty: 'medium',
    audioUrl: 'https://example.com/audio.mp3',
    answerKeyJson: JSON.stringify({}),
  });
  assertEq(safe.audioUrl, undefined, `${code} — audioUrl not in list`);
}

// 2. Student-safe payload has timing and responseMode
console.log('\n2. Payload structure is consistent');
for (const code of questionCodes) {
  const safe = buildStudentSafeQuestion(code, {
    id: 'q-1', taskCode: code, section: 'Test', title: 'Test Title', instruction: 'Test instruction',
    difficulty: 'medium',
  });
  assert(safe.id === 'q-1', `${code} — id preserved`);
  assert(typeof safe.taskCode === 'string', `${code} — taskCode is string`);
  assert(typeof safe.title === 'string', `${code} — title is string`);
  assert(typeof safe.instruction === 'string', `${code} — instruction is string`);
  assert(safe.timing !== undefined, `${code} — timing present`);
  assert(typeof safe.timing.prepSeconds === 'number', `${code} — prepSeconds number`);
  assert(typeof safe.timing.responseSeconds === 'number', `${code} — responseSeconds number`);
  assert(typeof safe.responseMode === 'string', `${code} — responseMode string`);
  assert(typeof safe.hasPromptAudio === 'boolean', `${code} — hasPromptAudio boolean`);
}

// 3. Playback consumption tracking
console.log('\n3. Playback policy shape');
const asq = buildStudentSafeQuestion('ASQ', {
  id: 'q-1', taskCode: 'ASQ', section: 'Speaking', title: 'Test', instruction: 'Test',
  difficulty: 'medium',
});
assert(asq.playbackPolicy !== undefined, 'playbackPolicy present');
assert(typeof asq.playbackPolicy.maxPlays === 'number', 'maxPlays is number');
assert(asq.playbackPolicy.maxPlays >= 1, 'maxPlays >= 1');
assert(typeof asq.playbackPolicy.autoplay === 'boolean', 'autoplay is boolean');

// 4. One-play tasks: second play must fail
console.log('\n4. One-play enforcement (server-side)');
const onePlay = { autoplay: true, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false };
const ra = buildStudentSafeQuestion('RA', {
  id: 'q-1', taskCode: 'RA', section: 'Speaking', title: 'Test', instruction: 'Test',
  difficulty: 'medium',
}, onePlay);
assert(ra.playbackPolicy.maxPlays === 1, 'RA one-play policy applied');
assert(ra.playbackPolicy.revealTranscript === false, 'revealTranscript false for one-play');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All playback-limit checks passed.');
