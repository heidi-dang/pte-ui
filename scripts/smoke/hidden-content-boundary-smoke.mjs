#!/usr/bin/env node

import { buildStudentSafeQuestion } from '../../src/practice/contracts/studentSafeQuestion.ts';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertUndefined(val, msg) {
  if (val === undefined) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected undefined, got ${JSON.stringify(val)}`); }
}

console.log('=== Hidden Content Boundary Smoke ===\n');

// Simulates server-side student question list and attempt-start boundary checks

const baseQuestion = {
  id: 'q-test-1',
  taskCode: 'WFD',
  section: 'Listening',
  title: 'Test Dictation',
  instruction: 'Type what you hear',
  promptText: 'The hidden transcript.',
  promptHtml: '<p>The hidden transcript.</p>',
  imageUrl: null,
  optionsJson: null,
  difficulty: 'medium',
  answerKeyJson: JSON.stringify({ text: 'the hidden transcript' }),
  acceptedAnswers: JSON.stringify(['the hidden transcript']),
  aliases: JSON.stringify([]),
};

const TASK_CODES = [
  'RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS',
  'SWT', 'WE', 'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW',
  'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD',
];

// 1. No question list item leaks answerKeyJson, acceptedAnswers, aliases
console.log('1. Question list — no leaked fields');
for (const code of TASK_CODES) {
  const safe = buildStudentSafeQuestion(code, { ...baseQuestion, taskCode: code });
  assertUndefined(safe.answerKeyJson, `${code} — answerKeyJson not in payload`);
  assertUndefined(safe.acceptedAnswers, `${code} — acceptedAnswers not in payload`);
  assertUndefined(safe.aliases, `${code} — aliases not in payload`);
  assertUndefined(safe.audioUrl, `${code} — raw audioUrl not in payload`);
}

// 2. Hidden tasks do not expose promptText or promptHtml
console.log('\n2. Hidden tasks — prompt text hidden');
const hiddenTasks = ['RS', 'RL', 'ASQ', 'SGD', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD'];
for (const code of hiddenTasks) {
  const safe = buildStudentSafeQuestion(code, { ...baseQuestion, taskCode: code });
  assert(safe.promptText === undefined, `${code} — promptText hidden`);
  assert(safe.promptHtml === undefined, `${code} — promptHtml hidden`);
  assert(safe.hasPromptAudio === true, `${code} — hasPromptAudio true`);
}

// 3. Visible tasks expose promptText
console.log('\n3. Visible tasks — prompt text shown');
const visibleTasks = ['RA', 'DI', 'RTS', 'SWT', 'WE', 'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW'];
for (const code of visibleTasks) {
  const safe = buildStudentSafeQuestion(code, { ...baseQuestion, taskCode: code });
  assert(safe.promptText !== undefined, `${code} — has promptText`);
}

// 4. Attempt-start question does not expose raw audioUrl
console.log('\n4. Attempt-start — no raw audioUrl');
for (const code of TASK_CODES) {
  const safe = buildStudentSafeQuestion(code, { ...baseQuestion, taskCode: code });
  assert(!('audioUrl' in safe), `${code} — audioUrl not in attempt-start question`);
}

// 5. hasPromptAudio correctly set
console.log('\n5. hasPromptAudio flag');
const audioTasks = new Set(['RS', 'RL', 'ASQ', 'SGD', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD']);
for (const code of TASK_CODES) {
  const safe = buildStudentSafeQuestion(code, { ...baseQuestion, taskCode: code });
  assert(safe.hasPromptAudio === audioTasks.has(code), `${code} — hasPromptAudio ${audioTasks.has(code)}`);
}

// 6. Options visible for selection tasks, correct answer never
console.log('\n6. Options visible, answers hidden');
const optionTasks = ['MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW', 'HCS', 'MCSSL', 'MCMSL', 'SMW'];
for (const code of optionTasks) {
  const safe = buildStudentSafeQuestion(code, { ...baseQuestion, taskCode: code, optionsJson: JSON.stringify(['A', 'B', 'C']) });
  assert(Array.isArray(safe.options), `${code} — options is array`);
  assert(safe.options.length === 3, `${code} — has 3 options`);
  assertUndefined(safe.answerKeyJson, `${code} — answer key not exposed`);
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All hidden-content boundary checks passed.');
