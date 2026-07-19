#!/usr/bin/env node

import { validatePublishableQuestion, IssueCodes } from '../../src/practice/contracts/publishValidation.ts';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq(actual, expected, msg) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

console.log('=== Question Publish Validation Smoke ===\n');

// 1. Invalid draft fails publish
console.log('1. Invalid draft fails publish');
const invalidDraft = {
  audioUrl: 'https://audio.mp3',
  promptText: 'the hidden transcript',
  answerKeyJson: 'not valid json',
};
const r1 = validatePublishableQuestion('WFD', invalidDraft);
assert(r1.canPublish === false, 'invalid WFD draft -> canPublish false');
assert(r1.issues.length > 0, 'WFD has issues');
const hasHiddenPrompt = r1.issues.some(i => i.code === IssueCodes.HIDDEN_PROMPT_EXPOSED);
assert(hasHiddenPrompt, 'WFD hidden prompt detected (promptText exposed)');
const hasAnswerKeyError = r1.issues.some(i => i.code === IssueCodes.ANSWER_KEY_INVALID);
assert(hasAnswerKeyError, 'WFD answer key invalid detected');

// 2. Valid deterministic question passes
console.log('\n2. Valid deterministic question passes');
const validMCS = {
  instruction: 'Select the correct answer.',
  promptText: 'Select the correct answer',
  optionsJson: ['Option A', 'Option B', 'Option C'],
  answerKeyJson: JSON.stringify({ correctOptionId: 'Option B' }),
};
const r2 = validatePublishableQuestion('MCS', validMCS);
assert(r2.canPublish === true, 'MCS valid -> canPublish true');
assert(r2.issues.length === 0, 'MCS has no issues');

// 3. Valid ASQ with audio and answer key passes
console.log('\n3. Valid ASQ passes');
const validASQ = {
  instruction: 'Answer the question briefly.',
  audioUrl: 'https://audio.mp3',
  answerKeyJson: JSON.stringify({ acceptedAnswers: ['mitosis'], aliases: ['cell division'] }),
};
const r3 = validatePublishableQuestion('ASQ', validASQ);
assert(r3.canPublish === true, 'ASQ valid -> canPublish true');

// 4. Valid DI with image passes
console.log('\n4. DI with image passes');
const validDI = {
  instruction: 'Describe the image in detail.',
  promptText: 'Describe the chart',
  imageUrl: 'https://img.example.com/chart.png',
};
const r4 = validatePublishableQuestion('DI', validDI);
assert(r4.canPublish === true, 'DI valid -> canPublish true');

// 5. ROP validation
console.log('\n5. ROP with matching options');
const validROP = {
  instruction: 'Reorder the paragraphs.',
  optionsJson: ['Para A', 'Para B', 'Para C'],
  answerKeyJson: JSON.stringify({ correctOrder: ['Para C', 'Para A', 'Para B'] }),
};
const r5 = validatePublishableQuestion('ROP', validROP);
assert(r5.canPublish === true, 'ROP valid -> canPublish true');

// 6. Invalid ROP
console.log('\n6. ROP with mismatched options fails');
const invalidROP = {
  optionsJson: ['Para A', 'Para B', 'Para C'],
  answerKeyJson: JSON.stringify({ correctOrder: ['Unknown', 'Para A'] }),
};
const r6 = validatePublishableQuestion('ROP', invalidROP);
assert(r6.canPublish === false, 'ROP invalid option fails');
assert(r6.issues.some(i => i.code === IssueCodes.CORRECT_ORDER_INVALID), 'ROP invalid order issue');

// 7. AI-generated candidate cannot be published without answer key
console.log('\n7. AI candidate without answer key fails');
const aiCandidate = {
  promptText: 'Generated passage',
  optionsJson: ['A', 'B'],
};
const r7 = validatePublishableQuestion('MCS', aiCandidate);
assert(r7.canPublish === false, 'AI candidate without answerKey fails');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All question publish validation smoke checks passed.');
