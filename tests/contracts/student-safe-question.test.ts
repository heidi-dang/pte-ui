import { buildStudentSafeQuestion } from '../../src/practice/contracts/studentSafeQuestion';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq<T>(actual: T, expected: T, msg: string) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

function assertUndefined(val: unknown, msg: string) {
  if (val === undefined) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected undefined, got ${JSON.stringify(val)}`); }
}

console.log('=== Student-Safe Question Contract Tests ===\n');

const baseQuestion = {
  id: 'q-1',
  taskCode: 'RA',
  section: 'Speaking',
  title: 'Test Question',
  instruction: 'Read the passage aloud',
  promptText: 'This is the visible prompt passage.',
  promptHtml: '<p>This is the visible prompt passage.</p>',
  imageUrl: 'https://example.com/image.png',
  passageText: 'A passage for reading tasks.',
  optionsJson: JSON.stringify(['Option A', 'Option B', 'Option C']),
  difficulty: 'medium',
  answerKeyJson: JSON.stringify({ correctAnswer: 'B' }),
  acceptedAnswers: JSON.stringify(['photosynthesis']),
  aliases: JSON.stringify(['photosynthetic process']),
};

// ── WFD hides reference transcript ──
console.log('WFD — hidden prompt');
{
  const r = buildStudentSafeQuestion('WFD', { ...baseQuestion, taskCode: 'WFD' });
  assertUndefined(r.promptText, 'WFD promptText hidden');
  assertUndefined(r.promptHtml, 'WFD promptHtml hidden');
  assertUndefined(r.passageText, 'WFD passageText hidden');
  assertEq(r.hasPromptAudio, true, 'WFD hasPromptAudio true');
}

// ── ASQ hides prompt transcript, shows hasPromptAudio ──
console.log('ASQ — hidden prompt');
{
  const r = buildStudentSafeQuestion('ASQ', { ...baseQuestion, taskCode: 'ASQ' });
  assertUndefined(r.promptText, 'ASQ promptText hidden');
  assertEq(r.hasPromptAudio, true, 'ASQ hasPromptAudio true');
}

// ── RS hides audio transcript ──
console.log('RS — hidden prompt');
{
  const r = buildStudentSafeQuestion('RS', { ...baseQuestion, taskCode: 'RS' });
  assertUndefined(r.promptText, 'RS promptText hidden');
  assertEq(r.hasPromptAudio, true, 'RS hasPromptAudio true');
}

// ── RA exposes passage (visible prompt) ──
console.log('RA — visible passage');
{
  const r = buildStudentSafeQuestion('RA', { ...baseQuestion, taskCode: 'RA' });
  assertEq(r.promptText, 'This is the visible prompt passage.', 'RA promptText visible');
  assertEq(r.passageText, 'A passage for reading tasks.', 'RA passageText visible');
  assertEq(r.hasPromptAudio, false, 'RA hasPromptAudio false');
}

// ── DI exposes image ──
console.log('DI — visible image');
{
  const r = buildStudentSafeQuestion('DI', { ...baseQuestion, taskCode: 'DI' });
  assertEq(r.promptText, 'This is the visible prompt passage.', 'DI promptText visible');
  assertEq(r.imageUrl, 'https://example.com/image.png', 'DI imageUrl visible');
  assertEq(r.hasPromptAudio, false, 'DI hasPromptAudio false');
}

// ── MCS exposes options but not correct answer ──
console.log('MCS — options safe, answer hidden');
{
  const r = buildStudentSafeQuestion('MCS', { ...baseQuestion, taskCode: 'MCS' });
  assert(Array.isArray(r.options), 'MCS options is array');
  assertEq(r.options?.length, 3, 'MCS has 3 options');
  assert(r.options?.includes('Option A'), 'MCS includes Option A');
  assertEq(r.hasPromptAudio, false, 'MCS hasPromptAudio false');
}

// ── ROP exposes items but not correct order ──
console.log('ROP — options visible, order hidden');
{
  const r = buildStudentSafeQuestion('ROP', { ...baseQuestion, taskCode: 'ROP' });
  assert(Array.isArray(r.options), 'ROP options is array');
  assertEq(r.options?.length, 3, 'ROP has 3 options');
}

// ── No task-safe payload includes answerKeyJson ──
console.log('Answer key never exposed');
{
  const codes: Array<import('../../src/practice/contracts/types').PTETaskCode> = [
    'RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS',
    'SWT', 'WE', 'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW',
    'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD',
  ];
  for (const code of codes) {
    const r = buildStudentSafeQuestion(code, { ...baseQuestion, taskCode: code });
    assertEq((r as any).answerKeyJson, undefined, `${code} answerKeyJson not exposed`);
    assertEq((r as any).acceptedAnswers, undefined, `${code} acceptedAnswers not exposed`);
    assertEq((r as any).aliases, undefined, `${code} aliases not exposed`);
  }
}

// ── Hidden tasks check ──
console.log('Hidden task attributes');
{
  const hidden = ['RS', 'RL', 'ASQ', 'SGD', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD'] as const;
  for (const code of hidden) {
    const r = buildStudentSafeQuestion(code, { ...baseQuestion, taskCode: code });
    assertEq(r.hasPromptAudio, true, `${code} hasPromptAudio true`);
    assertUndefined((r as any).audioUrl, `${code} raw audioUrl not exposed`);
  }
}

// ── Visible text tasks ──
console.log('Visible text tasks show promptText');
{
  const visible = ['RA', 'DI', 'RTS', 'SWT', 'WE', 'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW'] as const;
  for (const code of visible) {
    const r = buildStudentSafeQuestion(code, { ...baseQuestion, taskCode: code });
    assertEq(r.promptText, 'This is the visible prompt passage.', `${code} promptText visible`);
  }
}

// ── FIB exposes blanks but not accepted answers ──
console.log('FIB — blanks visible, accepted answers hidden');
{
  const r = buildStudentSafeQuestion('FIBR', { ...baseQuestion, taskCode: 'FIBR', optionsJson: JSON.stringify(['word1', 'word2', 'word3']) });
  assert(Array.isArray(r.options), 'FIBR options is array');
  assertEq(r.options?.length, 3, 'FIBR has 3 options');
  assertUndefined((r as any).acceptedAnswers, 'FIBR accepted answers hidden');
  assertUndefined((r as any).answerKeyJson, 'FIBR answerKeyJson hidden');
}

console.log(`\nTotal: ${passed + failed} assertions, ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All student-safe question tests passed.');
