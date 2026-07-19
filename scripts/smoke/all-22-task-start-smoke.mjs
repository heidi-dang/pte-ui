#!/usr/bin/env node

import { getContract, TASK_REGISTRY } from '../../src/practice/contracts/registry.ts';
import { buildStudentSafeQuestion } from '../../src/practice/contracts/studentSafeQuestion.ts';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq(actual, expected, msg) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

function assertUndefined(val, msg) {
  if (val === undefined) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected undefined, got ${JSON.stringify(val)}`); }
}

console.log('=== All 22 Task Start Smoke ===\n');

const TASK_CODES = [
  'RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS',
  'SWT', 'WE', 'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW',
  'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD',
];

for (const code of TASK_CODES) {
  const contract = getContract(code);
  const safe = buildStudentSafeQuestion(code, {
    id: `seed-${code}`,
    taskCode: code,
    section: contract.section,
    title: `Test ${code}`,
    instruction: `Complete the ${code} task`,
    promptText: code === 'RA' || code === 'DI' || code === 'RTS' || code === 'SWT' || code === 'WE' || code === 'MCS' || code === 'MCM' ? 'Visible prompt for this task' : undefined,
    audioUrl: contract.media.requiresPromptAudio ? 'https://audio.example.com/prompt.mp3' : undefined,
    imageUrl: contract.media.requiresImage ? 'https://img.example.com/image.png' : undefined,
    optionsJson: contract.responseMode === 'structured' ? JSON.stringify(['Option A', 'Option B', 'Option C']) : undefined,
    difficulty: 'medium',
  });

  // 1. Task has a registered contract
  assert(!!contract, `${code}: contract registered`);
  assert(typeof contract.timing.prepSeconds === 'number', `${code}: prepSeconds is number`);
  assert(typeof contract.timing.responseSeconds === 'number', `${code}: responseSeconds is number`);
  assert(typeof contract.scoringMode === 'string', `${code}: scoringMode defined`);
  assert(typeof contract.responseMode === 'string', `${code}: responseMode defined`);
  assert(typeof contract.media.requiresPromptAudio === 'boolean', `${code}: requiresPromptAudio boolean`);

  // 2. Student-safe question has required fields
  assert(typeof safe.id === 'string', `${code}: safe.id string`);
  assert(typeof safe.taskCode === 'string', `${code}: safe.taskCode string`);
  assert(typeof safe.section === 'string', `${code}: safe.section string`);
  assert(typeof safe.title === 'string', `${code}: safe.title string`);
  assert(typeof safe.instruction === 'string', `${code}: safe.instruction string`);
  assert(typeof safe.hasPromptAudio === 'boolean', `${code}: safe.hasPromptAudio boolean`);
  assert(typeof safe.timing === 'object', `${code}: safe.timing object`);
  assert(typeof safe.responseMode === 'string', `${code}: safe.responseMode string`);

  // 3. Never leak sensitive fields
  assertUndefined(safe.answerKeyJson, `${code}: answerKeyJson not leaked`);
  assertUndefined(safe.acceptedAnswers, `${code}: acceptedAnswers not leaked`);
  assertUndefined(safe.audioUrl, `${code}: raw audioUrl not leaked`);

  // 4. Hidden prompt tasks do not show promptText
  const hiddenTasks = ['RS', 'RL', 'ASQ', 'SGD', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD'];
  if (hiddenTasks.includes(code)) {
    assertUndefined(safe.promptText, `${code}: hidden prompt — no promptText`);
  }

  // 5. Visible text tasks show promptText
  const visibleTasks = ['RA', 'DI', 'RTS', 'SWT', 'WE', 'MCS', 'MCM'];
  if (visibleTasks.includes(code)) {
    assert(typeof safe.promptText === 'string', `${code}: visible prompt — has promptText`);
  }
  // Structured tasks with options may not have promptText
  const noPromptTasks = ['ROP', 'FIBR', 'FIBRW'];
  if (noPromptTasks.includes(code)) {
    // These tasks have visible options/items but may not require a separate promptText
    assert(Array.isArray(safe.options) || safe.promptText !== undefined, `${code}: has options or promptText`);
  }

  // 6. Task has hasPromptAudio correctly
  assert(safe.hasPromptAudio === contract.media.requiresPromptAudio, `${code}: hasPromptAudio matches contract`);
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All 22 task start smoke checks passed.');
