import { validatePublishableQuestion, IssueCodes } from '../../src/practice/contracts/publishValidation';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq<T>(actual: T, expected: T, msg: string) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

console.log('=== Publish Validation Tests ===\n');

// ── MCS ──
console.log('MCS');
{
  const r = validatePublishableQuestion('MCS', { instruction: 'Pick the correct answer.', promptText: 'Pick one', optionsJson: ['A', 'B', 'C'], answerKeyJson: JSON.stringify({ correctOptionId: 'B' }) });
  assert(r.canPublish === true, 'MCS valid -> canPublish true');
}
{
  const r = validatePublishableQuestion('MCS', { promptText: 'Pick one', optionsJson: ['A', 'B', 'C'] });
  assert(r.canPublish === false, 'MCS missing answerKey -> canPublish false');
  assert(r.issues.some((i) => i.code === IssueCodes.ANSWER_KEY_MISSING || i.code === IssueCodes.ANSWER_KEY_INVALID), 'MCS missing answerKey issue');
}
{
  const r = validatePublishableQuestion('MCS', { promptText: 'Pick one', optionsJson: ['A', 'B', 'C'], answerKeyJson: JSON.stringify({ correctOptionId: 'X' }) });
  assert(r.canPublish === false, 'MCS invalid option -> canPublish false');
  assert(r.issues.some((i) => i.code === IssueCodes.CORRECT_OPTION_INVALID), 'MCS invalid option issue');
}

// ── MCM ──
console.log('MCM');
{
  const r = validatePublishableQuestion('MCM', { instruction: 'Select all correct answers.', promptText: 'Pick multiple', optionsJson: ['A', 'B', 'C'], answerKeyJson: JSON.stringify({ correctOptionIds: ['A', 'C'] }) });
  assert(r.canPublish === true, 'MCM valid -> canPublish true');
}
{
  const r = validatePublishableQuestion('MCM', { promptText: 'Pick multiple', optionsJson: ['A', 'B'], answerKeyJson: JSON.stringify({ correctOptionIds: ['X'] }) });
  assert(r.canPublish === false, 'MCM wrong option ID fails');
  assert(r.issues.some((i) => i.code === IssueCodes.CORRECT_OPTION_INVALID), 'MCM wrong option issue');
}
{
  const r = validatePublishableQuestion('MCM', { promptText: 'Pick multiple', optionsJson: ['A', 'B'], answerKeyJson: JSON.stringify({ correctOptionIds: [] }) });
  assert(r.canPublish === false, 'MCM empty correctOptionIds fails');
}

// ── ROP ──
console.log('ROP');
{
  const r = validatePublishableQuestion('ROP', { instruction: 'Reorder the paragraphs.', optionsJson: ['A', 'B', 'C', 'D'], answerKeyJson: JSON.stringify({ correctOrder: ['D', 'C', 'B', 'A'] }) });
  assert(r.canPublish === true, 'ROP valid -> canPublish true');
}
{
  const r = validatePublishableQuestion('ROP', { optionsJson: ['A', 'B', 'C'], answerKeyJson: JSON.stringify({ correctOrder: ['A', 'B', 'X'] }) });
  assert(r.canPublish === false, 'ROP unknown option ID fails');
  assert(r.issues.some((i) => i.code === IssueCodes.CORRECT_ORDER_INVALID), 'ROP unknown option issue');
}

// ── FIBR/FIBRW/FIBL ──
console.log('FIBR');
{
  const r = validatePublishableQuestion('FIBR', { instruction: 'Fill in the blank.', promptText: 'Fill blank __', optionsJson: ['cat', 'dog'], answerKeyJson: JSON.stringify({ blanks: [{ id: '1', acceptedAnswers: ['cat'] }] }) });
  assert(r.canPublish === true, 'FIBR valid -> canPublish true');
}
{
  const r = validatePublishableQuestion('FIBR', { promptText: 'Fill blank', optionsJson: ['cat'], answerKeyJson: JSON.stringify({ blanks: [] }) });
  assert(r.canPublish === false, 'FIBR empty blanks fails');
}

// ── HIW ──
console.log('HIW');
{
  const r = validatePublishableQuestion('HIW', { instruction: 'Select the incorrect words.', audioUrl: 'https://audio.mp3', promptText: 'the quick brown fox jumps', optionsJson: null, answerKeyJson: JSON.stringify({ incorrectTokenPositions: [1, 3] }) });
  assert(r.canPublish === true, 'HIW valid -> canPublish true');
}
{
  const r = validatePublishableQuestion('HIW', { audioUrl: 'https://audio.mp3', promptText: 'the quick', answerKeyJson: JSON.stringify({ incorrectTokenPositions: [10] }) });
  assert(r.canPublish === false, 'HIW out-of-range position fails');
  assert(r.issues.some((i) => i.code === IssueCodes.HIW_POSITION_INVALID), 'HIW position invalid issue');
}

// ── WFD ──
console.log('WFD');
{
  const r = validatePublishableQuestion('WFD', { instruction: 'Write from dictation.', audioUrl: 'https://audio.mp3', answerKeyJson: JSON.stringify({ referenceText: 'the cat sat on the mat' }) });
  assert(r.canPublish === true, 'WFD valid -> canPublish true');
}
{
  // WFD with exposed prompt text should fail
  const r = validatePublishableQuestion('WFD', { audioUrl: 'https://audio.mp3', promptText: 'the cat sat', answerKeyJson: JSON.stringify({ referenceText: 'the cat sat on the mat' }) });
  assert(r.canPublish === false, 'WFD exposed promptText fails');
  assert(r.issues.some((i) => i.code === IssueCodes.HIDDEN_PROMPT_EXPOSED), 'WFD hidden prompt issue');
}

// ── ASQ ──
console.log('ASQ');
{
  const r = validatePublishableQuestion('ASQ', { instruction: 'Answer the question briefly.', audioUrl: 'https://audio.mp3', answerKeyJson: JSON.stringify({ acceptedAnswers: ['photosynthesis'], aliases: ['photosynthetic process'] }) });
  assert(r.canPublish === true, 'ASQ valid -> canPublish true');
}
{
  const r = validatePublishableQuestion('ASQ', { audioUrl: 'https://audio.mp3', answerKeyJson: JSON.stringify({ acceptedAnswers: [] }) });
  assert(r.canPublish === false, 'ASQ empty acceptedAnswers fails');
}

// ── DI (image required) ──
console.log('DI');
{
  const r = validatePublishableQuestion('DI', { instruction: 'Describe the image in detail.', promptText: 'Describe', imageUrl: 'https://img.png' });
  assert(r.canPublish === true, 'DI with image -> canPublish true');
}
{
  const r = validatePublishableQuestion('DI', { promptText: 'Describe' });
  assert(r.canPublish === false, 'DI missing image fails');
  assert(r.issues.some((i) => i.code === IssueCodes.IMAGE_REQUIRED), 'DI image required issue');
}

// ── Audio tasks ──
console.log('Audio tasks');
{
  const r = validatePublishableQuestion('RS', { instruction: 'Repeat the sentence.', audioUrl: 'https://audio.mp3' });
  assert(r.canPublish === true, 'RS with audio -> canPublish true');
}
{
  const r = validatePublishableQuestion('RS', {});
  assert(r.canPublish === false, 'RS missing audio fails');
  assert(r.issues.some((i) => i.code === IssueCodes.PROMPT_AUDIO_REQUIRED), 'RS audio required issue');
}

// ── Hidden prompt tasks ──
console.log('Hidden prompt');
{
  const r = validatePublishableQuestion('RS', { audioUrl: 'https://audio.mp3', promptText: 'This is the hidden transcript' });
  assert(r.canPublish === false, 'RS hidden prompt exposed fails');
  assert(r.issues.some((i) => i.code === IssueCodes.HIDDEN_PROMPT_EXPOSED), 'RS hidden prompt issue');
}
{
  const r = validatePublishableQuestion('RL', { audioUrl: 'https://audio.mp3', promptText: 'Hidden lecture' });
  assert(r.canPublish === false, 'RL hidden prompt exposed fails');
}

// ── Unknown task ──
console.log('Unknown task');
{
  const r = validatePublishableQuestion('UNKNOWN' as any, {});
  assert(r.canPublish === false, 'Unknown task fails');
  assert(r.issues.some((i) => i.code === IssueCodes.TASK_UNKNOWN), 'Unknown task issue');
}

// ── Unparseable answer key JSON ──
console.log('Invalid answer key JSON');
{
  const r = validatePublishableQuestion('MCS', { promptText: 'A', optionsJson: ['A', 'B'], answerKeyJson: 'not json' });
  assert(r.canPublish === false, 'Invalid answer key JSON fails');
  assert(r.issues.some((i) => i.code === IssueCodes.ANSWER_KEY_INVALID), 'Unparseable answer key issue');
}

console.log(`\nTotal: ${passed + failed} assertions, ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All publish validation tests passed.');
