/**
 * Exact expected-score tests for all deterministic mock exam scorers.
 */

import { scoreDeterministic, DETERMINISTIC_TASK_CODES } from '../../src/practice/scoring/index';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.error(`  FAIL: ${label}`); }
}

function check(condition: boolean, label: string) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exit(1);
  }
  passed++;
  console.log(`  PASS: ${label}`);
}

function main() {
  console.log('=== Mock Exam Deterministic Scoring Tests ===\n');

  // 1. WFD exact match
  console.log('--- WFD: Write from Dictation ---');
  const wfdExact = scoreDeterministic({
    taskCode: 'WFD',
    answer: { kind: 'text', text: 'the quick brown fox jumps over the lazy dog' },
    answerKey: { segments: ['the quick brown fox jumps over the lazy dog'] },
  });
  check(wfdExact.earnedScore === wfdExact.maxScore, 'WFD exact sentence = full credit');
  check(wfdExact.normalizedScore === 1, `WFD normalizedScore = 1 (got ${wfdExact.normalizedScore})`);

  const wfdPartial = scoreDeterministic({
    taskCode: 'WFD',
    answer: { kind: 'text', text: 'the quick brown fox' },
    answerKey: { segments: ['the quick brown fox jumps over the lazy dog'] },
  });
  check(wfdPartial.earnedScore < wfdPartial.maxScore, 'WFD partial match earns less than max');
  check(wfdPartial.earnedScore > 0, 'WFD partial match earns some credit');

  const wfdEmpty = scoreDeterministic({
    taskCode: 'WFD',
    answer: { kind: 'text', text: '' },
    answerKey: { segments: ['some dictation text'] },
  });
  check(wfdEmpty.earnedScore === 0, 'WFD empty response = zero');
  check(wfdEmpty.normalizedScore === 0, 'WFD empty normalizedScore = 0');

  // 2. MCS: Multiple Choice Single Answer
  console.log('\n--- MCS: Multiple-choice, Choose Single Answer ---');
  const mcsCorrect = scoreDeterministic({
    taskCode: 'MCS', answer: { kind: 'single_choice', selected: 'B' },
    answerKey: { correct: 'B' },
  });
  check(mcsCorrect.earnedScore === mcsCorrect.maxScore, 'MCS correct = full credit');

  const mcsWrong = scoreDeterministic({
    taskCode: 'MCS', answer: { kind: 'single_choice', selected: 'A' },
    answerKey: { correct: 'B' },
  });
  check(mcsWrong.earnedScore === 0, 'MCS wrong = zero');

  // 3. MCM: Multiple Choice Multiple Answers
  console.log('\n--- MCM: Multiple-choice, Choose Multiple Answers ---');
  const mcmCorrect = scoreDeterministic({
    taskCode: 'MCM', answer: { kind: 'multi_choice', selected: ['A', 'C'] },
    answerKey: { correct: ['A', 'C'] },
  });
  check(mcmCorrect.earnedScore === mcmCorrect.maxScore, 'MCM all correct = full');

  const mcmPartial = scoreDeterministic({
    taskCode: 'MCM', answer: { kind: 'multi_choice', selected: ['A'] },
    answerKey: { correct: ['A', 'C'] },
  });
  check(mcmPartial.earnedScore > 0, 'MCM partial > 0');
  check(mcmPartial.earnedScore < mcmPartial.maxScore, 'MCM partial < max');

  // 4. ROP: Reorder Paragraphs
  console.log('\n--- ROP: Re-order Paragraphs ---');
  const ropExact = scoreDeterministic({
    taskCode: 'ROP', answer: { kind: 'ordered_list', ordered: ['B', 'A', 'C'] },
    answerKey: { correct: ['B', 'A', 'C'] },
  });
  check(ropExact.earnedScore === ropExact.maxScore, 'ROP exact order = full');

  const ropWrong = scoreDeterministic({
    taskCode: 'ROP', answer: { kind: 'ordered_list', ordered: ['A', 'C', 'B'] },
    answerKey: { correct: ['B', 'A', 'C'] },
  });
  check(ropWrong.earnedScore < ropWrong.maxScore, 'ROP wrong order < max');

  // 5. FIBR: Fill in the Blanks
  console.log('\n--- FIBR: Fill in the Blanks ---');
  const fibExact = scoreDeterministic({
    taskCode: 'FIBR', answer: { kind: 'blanks', blanks: { '1': 'cat', '2': 'dog' } },
    answerKey: { answers: { '1': 'cat', '2': 'dog' } },
  });
  check(fibExact.earnedScore === fibExact.maxScore, 'FIBR exact = full');

  const fibPartial = scoreDeterministic({
    taskCode: 'FIBR', answer: { kind: 'blanks', blanks: { '1': 'cat', '2': 'wrong' } },
    answerKey: { answers: { '1': 'cat', '2': 'dog' } },
  });
  check(fibPartial.earnedScore > 0, 'FIBR partial > 0');
  check(fibPartial.earnedScore < fibPartial.maxScore, 'FIBR partial < max');

  // 6. HIW: Highlight Incorrect Words
  console.log('\n--- HIW: Highlight Incorrect Words ---');
  const hiwExact = scoreDeterministic({
    taskCode: 'HIW', answer: { kind: 'highlight_words', words: ['wrong1', 'wrong2'] },
    answerKey: { incorrect: ['wrong1', 'wrong2'] },
  });
  check(hiwExact.earnedScore === hiwExact.maxScore, 'HIW exact = full');

  const hiwEmpty = scoreDeterministic({
    taskCode: 'HIW', answer: { kind: 'highlight_words', words: [] },
    answerKey: { incorrect: ['wrong1', 'wrong2'] },
  });
  check(hiwEmpty.earnedScore === 0, 'HIW empty response = zero');

  // 7. ASQ
  console.log('\n--- ASQ: Answer Short Question ---');
  const asqCorrect = scoreDeterministic({
    taskCode: 'ASQ', answer: { kind: 'audio', transcript: 'red' },
    answerKey: { answers: ['red', 'red color'] },
  });
  check(asqCorrect.earnedScore === asqCorrect.maxScore, 'ASQ correct = full');

  const asqWrong = scoreDeterministic({
    taskCode: 'ASQ', answer: { kind: 'audio', transcript: 'blue' },
    answerKey: { answers: ['red', 'red color'] },
  });
  check(asqWrong.earnedScore === 0, 'ASQ wrong = zero');

  // 8. All deterministic task codes are registered
  console.log('\n--- Registry: All scorers registered ---');
  const expectedDeterministic = ['MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD', 'ASQ'];
  for (const code of expectedDeterministic) {
    check(DETERMINISTIC_TASK_CODES.includes(code), `${code} in DETERMINISTIC_TASK_CODES`);
  }
  check(DETERMINISTIC_TASK_CODES.length >= 13, `At least 13 deterministic scorers (got ${DETERMINISTIC_TASK_CODES.length})`);

  // 9. No crash on empty/null answer
  console.log('\n--- Safety: Empty/null response handling ---');
  const nullResp = scoreDeterministic({
    taskCode: 'WFD', answer: null as any,
    answerKey: { segments: ['some text'] },
  });
  check(nullResp.earnedScore === 0, 'Null WFD answer = 0 (no crash)');

  const badResp = scoreDeterministic({
    taskCode: 'MCS', answer: {} as any,
    answerKey: { correct: 'A' },
  });
  check(badResp.earnedScore === 0, 'Empty MCS answer = 0 (no crash)');

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
