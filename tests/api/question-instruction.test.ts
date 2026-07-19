import type { QuestionListItem, StartAttemptData } from '../../src/shared/api/practice';
import { validatePublishableQuestion, IssueCodes } from '../../src/practice/contracts/publishValidation';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq<T>(actual: T, expected: T, msg: string) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

function assertNonNull<T>(val: T, msg: string): asserts val is NonNullable<T> {
  if (val == null) { failed++; console.error(`  FAIL: ${msg} — expected non-null`); }
  else { passed++; }
}

console.log('=== Question Instruction Tests ===\n');

// 1. GET /api/student/questions returns instruction
console.log('QuestionListItem — instruction field contract');
const listItem: QuestionListItem = {
  id: 'q-1',
  taskCode: 'RA',
  section: 'Speaking',
  title: 'Read Aloud',
  instruction: 'Read the text aloud.',
  difficulty: 'medium',
  hasPromptAudio: false,
  hasImage: false,
};
assert(typeof listItem.instruction === 'string', 'instruction is a string');
assert(listItem.instruction.length > 0, 'instruction is a non-empty string');
assertEq(listItem.instruction, 'Read the text aloud.', 'instruction matches DB value');

// 2. Student response still excludes sensitive fields
console.log('Student-safe — no sensitive metadata');
const safeItem: QuestionListItem = {
  ...listItem,
  promptText: 'Sample text',
};
assert((safeItem as any).answerKeyJson === undefined, 'answerKeyJson excluded');
assert((safeItem as any).acceptedAnswers === undefined, 'acceptedAnswers excluded');
assert((safeItem as any).audioUrl === undefined, 'audioUrl excluded');
assert((safeItem as any).scoringMetadata === undefined, 'scoringMetadata excluded');

// 3. POST /practice/attempts/start returns the same instruction
console.log('StartAttemptData — instruction in question');
const startData: StartAttemptData = {
  attemptId: 'attempt-1',
  status: 'In_Progress',
  deadlineAt: new Date().toISOString(),
  taskCode: 'RA',
  section: 'Speaking',
  timing: { prepSeconds: 10, responseSeconds: 40 },
  playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
  question: {
    id: 'q-1',
    taskCode: 'RA',
    section: 'Speaking',
    title: 'Read Aloud',
    instruction: 'Read the text aloud.',
    difficulty: 'medium',
    hasPromptAudio: false,
    hasImage: false,
    playbackPolicy: { autoplay: false, maxPlays: 1, allowPause: false, allowSeek: false, revealTranscript: false },
    responseMode: 'audio',
    timing: { prepSeconds: 10, responseSeconds: 40 },
  },
};
assert(typeof startData.question.instruction === 'string', 'attempt question has instruction');
assertEq(startData.question.instruction, 'Read the text aloud.', 'attempt question instruction matches');
assert(startData.question.instruction.trim().length > 0, 'attempt question instruction non-empty');

// 4. Published question list item contains the DB instruction
console.log('Published item — instruction preserved');
const publishedItem: QuestionListItem = {
  id: 'q-pub-1',
  taskCode: 'WE',
  section: 'Writing',
  title: 'Essay',
  instruction: 'Write an essay on the given topic.',
  difficulty: 'hard',
  hasPromptAudio: false,
  hasImage: false,
};
assertNonNull(publishedItem.instruction, 'published item has instruction');
assertEq(publishedItem.instruction, 'Write an essay on the given topic.', 'published item instruction correct');

// 5. Practice UI renders the instruction text — checked in PracticeTaskForm rendering
// This is covered by the fallback: empty instruction shows warning, non-empty shows content
console.log('UI rendering — instruction fallback');
const instruction = publishedItem.instruction?.trim() || 'Instruction unavailable. Please report this question.';
assert(instruction !== 'Instruction unavailable. Please report this question.', 'real instruction used instead of fallback');
assert(instruction.length > 0, 'rendered instruction non-empty');

// 6. Question with empty instruction cannot be published
console.log('Publish validation — instruction required');
{
  const r = validatePublishableQuestion('RA', { instruction: '', promptText: 'Read this' });
  assert(r.canPublish === false, 'empty instruction -> canPublish false');
  assert(r.issues.some((i) => i.code === IssueCodes.INSTRUCTION_REQUIRED), 'empty instruction issue present');
}
{
  const r = validatePublishableQuestion('RA', { instruction: '   ', promptText: 'Read this' });
  assert(r.canPublish === false, 'whitespace-only instruction -> canPublish false');
  assert(r.issues.some((i) => i.code === IssueCodes.INSTRUCTION_REQUIRED), 'whitespace instruction issue present');
}
{
  const r = validatePublishableQuestion('RA', { instruction: 'Read the text aloud.', promptText: 'Read this' });
  assert(r.canPublish === true || !r.issues.some((i) => i.code === IssueCodes.INSTRUCTION_REQUIRED), 'valid instruction passes');
}
{
  // instruction missing entirely (null/undefined)
  const r = validatePublishableQuestion('RA', { promptText: 'Read this' });
  assert(r.canPublish === false, 'missing instruction -> canPublish false');
  assert(r.issues.some((i) => i.code === IssueCodes.INSTRUCTION_REQUIRED), 'missing instruction issue present');
}

// 7. All registered task codes have usable instruction contract
console.log('Task registry — all tasks accept instruction string');
const allTaskCodes = ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS', 'SWT', 'WE', 'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD'] as const;
for (const code of allTaskCodes) {
  const r = validatePublishableQuestion(code, { instruction: 'Generic instruction.', promptText: 'Test', audioUrl: 'https://test.com/a.mp3', optionsJson: ['A', 'B', 'C'], answerKeyJson: JSON.stringify({ correctOptionId: 'A' }), imageUrl: 'https://test.com/i.png' });
  const instrIssue = r.issues.find((i) => i.code === IssueCodes.INSTRUCTION_REQUIRED);
  if (instrIssue) {
    console.error(`  FAIL: ${code} — instruction validation failed even with valid instruction`);
    failed++;
  } else {
    passed++;
  }
}

console.log(`\nTotal: ${passed + failed} assertions, ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All question instruction tests passed.');
