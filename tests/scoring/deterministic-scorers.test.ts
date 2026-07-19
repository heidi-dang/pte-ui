#!/usr/bin/env bun

import { scoreMCS, scoreHCS, scoreMCSSL, scoreSMW } from '../../src/practice/scoring/MCS';
import { scoreMCM, scoreMCMSL } from '../../src/practice/scoring/MCM';
import { scoreROP } from '../../src/practice/scoring/ROP';
import { scoreFIBR, scoreFIBRW, scoreFIBL } from '../../src/practice/scoring/FIBR';
import { scoreHIW } from '../../src/practice/scoring/HIW';
import { scoreWFD } from '../../src/practice/scoring/WFD';
import { scoreASQ } from '../../src/practice/scoring/ASQ';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq<T>(actual: T, expected: T, msg: string) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

console.log('=== Deterministic Scorers Unit Tests ===\n');

// ── MCS ──
console.log('MCS — Multiple-choice Single Answer');
{
  const r = scoreMCS({ taskCode: 'MCS', answer: { selectedOption: 'B' }, answerKey: { correctAnswer: 'B' } });
  assertEq(r.earnedScore, 1, 'MCS correct');
  assertEq(r.maxScore, 1, 'MCS maxScore 1');
}
{
  const r = scoreMCS({ taskCode: 'MCS', answer: { selectedOption: 'A' }, answerKey: { correctAnswer: 'B' } });
  assertEq(r.earnedScore, 0, 'MCS wrong');
  assert(r.incorrect.length === 1, 'MCS incorrect tracked');
}

// ── HCS ──
console.log('HCS — Highlight Correct Summary');
{
  const r = scoreHCS({ taskCode: 'HCS', answer: { selectedOption: 'Option 2' }, answerKey: { correctAnswer: 'Option 2' } });
  assertEq(r.earnedScore, 1, 'HCS correct');
}

// ── MCSSL ──
console.log('MCSSL — Multiple-choice Single (Listening)');
{
  const r = scoreMCSSL({ taskCode: 'MCSSL', answer: { selectedOption: 'C' }, answerKey: { correctAnswer: 'C' } });
  assertEq(r.earnedScore, 1, 'MCSSL correct');
}

// ── SMW ──
console.log('SMW — Select Missing Word');
{
  const r = scoreSMW({ taskCode: 'SMW', answer: { selectedOption: 'D' }, answerKey: { correctAnswer: 'D' } });
  assertEq(r.earnedScore, 1, 'SMW correct');
}
{
  const r = scoreSMW({ taskCode: 'SMW', answer: { selectedOption: 'A' }, answerKey: { correctAnswer: 'B' } });
  assertEq(r.earnedScore, 0, 'SMW wrong');
}

// ── MCM ──
console.log('MCM — Multiple-choice Multiple Answers');
{
  const r = scoreMCM({ taskCode: 'MCM', answer: { selectedMultiple: ['A', 'B', 'X'] }, answerKey: { correctAnswers: ['A', 'B', 'C'] } });
  assertEq(r.earnedScore, 1, 'MCM partial (2-1=1)');
  assertEq(r.maxScore, 3, 'MCM maxScore 3');
}
{
  const r = scoreMCM({ taskCode: 'MCM', answer: { selectedMultiple: ['X', 'Y'] }, answerKey: { correctAnswers: ['A', 'B'] } });
  assertEq(r.earnedScore, 0, 'MCM clamp to zero');
}
{
  const r = scoreMCM({ taskCode: 'MCM', answer: { selectedMultiple: ['A', 'B'] }, answerKey: { correctAnswers: ['A', 'B'] } });
  assertEq(r.earnedScore, 2, 'MCM all correct');
}

// ── MCMSL ──
console.log('MCMSL — Multiple-choice Multiple (Listening)');
{
  // A,C,D selected, A,B,C correct → 2 correct, 1 incorrect → 2-1=1
  const r = scoreMCMSL({ taskCode: 'MCMSL', answer: { selectedMultiple: ['A', 'C', 'D'] }, answerKey: { correctAnswers: ['A', 'B', 'C'] } });
  assertEq(r.earnedScore, 1, 'MCMSL partial (2-1=1)');
}

// ── ROP ──
console.log('ROP — Re-order Paragraphs');
{
  const r = scoreROP({ taskCode: 'ROP', answer: { reorderedList: ['A', 'B', 'C', 'D'] }, answerKey: { correctOrder: ['A', 'B', 'C', 'D'] } });
  assertEq(r.earnedScore, 3, 'ROP all correct pairs');
  assertEq(r.maxScore, 3, 'ROP maxScore 3');
}
{
  const r = scoreROP({ taskCode: 'ROP', answer: { reorderedList: ['B', 'A', 'C', 'D'] }, answerKey: { correctOrder: ['A', 'B', 'C', 'D'] } });
  assertEq(r.earnedScore, 1, 'ROP one correct pair (C-D)');
}

// ── FIBR ──
console.log('FIBR — Fill in Blanks (Reading)');
{
  const r = scoreFIBR({ taskCode: 'FIBR', answer: { blanks: { '1': 'cat', '2': 'dog' } }, answerKey: { correctBlanks: { '1': ['cat'], '2': ['dog'] } } });
  assertEq(r.earnedScore, 2, 'FIBR all correct');
  assertEq(r.maxScore, 2, 'FIBR maxScore 2');
}
{
  const r = scoreFIBR({ taskCode: 'FIBR', answer: { blanks: { '1': 'cat' } }, answerKey: { correctBlanks: { '1': ['dog'], '2': ['mouse'] } } });
  assertEq(r.earnedScore, 0, 'FIBR all wrong');
  assert(r.incorrect.length === 1, 'FIBR 1 incorrect');
  assert(r.missing.length === 1, 'FIBR 1 missing');
}
{
  const r = scoreFIBR({ taskCode: 'FIBR', answer: { blanks: { '1': 'CAT' } }, answerKey: { correctBlanks: { '1': ['cat'] } } });
  assertEq(r.earnedScore, 1, 'FIBR case insensitive');
}

// ── FIBRW ──
console.log('FIBRW — Fill in Blanks (Reading & Writing)');
{
  const r = scoreFIBRW({ taskCode: 'FIBRW', answer: { blanks: { 'a': 'hello' } }, answerKey: { correctBlanks: { 'a': ['hello'] } } });
  assertEq(r.earnedScore, 1, 'FIBRW correct');
}

// ── FIBL ──
console.log('FIBL — Fill in Blanks (Listening)');
{
  const r = scoreFIBL({ taskCode: 'FIBL', answer: { blanks: { '1': 'correct' } }, answerKey: { correctBlanks: { '1': ['correct'] } } });
  assertEq(r.earnedScore, 1, 'FIBL correct');
}

// ── HIW ──
console.log('HIW — Highlight Incorrect Words');
{
  const r = scoreHIW({ taskCode: 'HIW', answer: { highlightedIncorrect: ['wrong1', 'wrong2'] }, answerKey: { incorrectWords: ['wrong1', 'wrong2', 'wrong3'] } });
  assertEq(r.earnedScore, 2, 'HIW correct highlights');
  assertEq(r.maxScore, 3, 'HIW maxScore 3');
}
{
  const r = scoreHIW({ taskCode: 'HIW', answer: { highlightedIncorrect: ['wrong1', 'notWrong'] }, answerKey: { incorrectWords: ['wrong1'] } });
  assertEq(r.earnedScore, 0, 'HIW penalty: 1-1=0');
}
{
  const r = scoreHIW({ taskCode: 'HIW', answer: { highlightedIncorrect: ['x', 'y', 'z'] }, answerKey: { incorrectWords: ['a'] } });
  assertEq(r.earnedScore, 0, 'HIW clamp to zero');
}

// ── WFD ──
console.log('WFD — Write from Dictation');
{
  const r = scoreWFD({ taskCode: 'WFD', answer: { typedText: 'the cat sat on the mat' }, answerKey: { text: 'the cat sat on the mat' } });
  assertEq(r.earnedScore, 6, 'WFD full correct');
  assertEq(r.maxScore, 6, 'WFD maxScore 6');
}
{
  const r = scoreWFD({ taskCode: 'WFD', answer: { typedText: 'the cat on mat' }, answerKey: { text: 'the cat sat on the mat' } });
  assertEq(r.earnedScore, 2, 'WFD partial (2 correct in position)');
}
{
  const r = scoreWFD({ taskCode: 'WFD', answer: { typedText: 'the kat sat on the mat' }, answerKey: { text: 'the cat sat on the mat' } });
  assertEq(r.earnedScore, 5, 'WFD spelling error');
}

// ── ASQ ──
console.log('ASQ — Answer Short Question');
{
  const r = scoreASQ({ taskCode: 'ASQ', answer: { transcript: 'photosynthesis' }, answerKey: { acceptedAnswers: ['photosynthesis', 'photosynthetic process'] } });
  assertEq(r.earnedScore, 1, 'ASQ exact match');
}
{
  const r = scoreASQ({ taskCode: 'ASQ', answer: { transcript: 'photosynthetic process' }, answerKey: { acceptedAnswers: ['photosynthesis', 'photosynthetic process'] } });
  assertEq(r.earnedScore, 1, 'ASQ alias match');
}
{
  const r = scoreASQ({ taskCode: 'ASQ', answer: { transcript: 'respiration' }, answerKey: { acceptedAnswers: ['photosynthesis'] } });
  assertEq(r.earnedScore, 0, 'ASQ wrong answer');
}
{
  const r = scoreASQ({ taskCode: 'ASQ', answer: { transcript: 'mitosis' }, answerKey: { answer: 'mitosis' } });
  assertEq(r.earnedScore, 1, 'ASQ primary answer');
}
{
  const r = scoreASQ({ taskCode: 'ASQ', answer: { transcript: 'PHOTOSYNTHESIS' }, answerKey: { acceptedAnswers: ['photosynthesis'] } });
  assertEq(r.earnedScore, 1, 'ASQ case insensitive');
}

console.log(`\nTotal: ${passed + failed} assertions, ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All deterministic scorer tests passed.');
