import type { DeterministicScoreResult } from './types';
import type { ScorerInput } from './types';
import { normalizeWords } from './normalize';

export function scoreWFD(input: ScorerInput): DeterministicScoreResult {
  const answerKey = input.answerKey;
  const referenceText = String(answerKey.text || answerKey.answer || '');
  const referenceWords = normalizeWords(referenceText);

  const submittedText = String((input.answer as any)?.typedText || '');
  const submittedWords = normalizeWords(submittedText);

  const correctWords: string[] = [];
  const incorrectWords: string[] = [];
  const missingWords: string[] = [];

  const maxLen = Math.max(referenceWords.length, submittedWords.length);

  for (let i = 0; i < maxLen; i++) {
    const refWord = referenceWords[i] || '';
    const subWord = submittedWords[i] || '';

    if (i >= referenceWords.length) {
      incorrectWords.push(subWord);
    } else if (i >= submittedWords.length) {
      missingWords.push(refWord);
    } else if (refWord === subWord) {
      correctWords.push(refWord);
    } else {
      incorrectWords.push(subWord);
      missingWords.push(refWord);
    }
  }

  const maxScore = referenceWords.length;
  const earnedScore = correctWords.length;

  return {
    taskCode: 'WFD',
    scorerVersion: 'deterministic-pte-v1',
    maxScore,
    earnedScore,
    normalizedScore: maxScore > 0 ? earnedScore / maxScore : 0,
    correct: correctWords,
    incorrect: incorrectWords,
    missing: missingWords,
    feedback: [
      `Words correct: ${earnedScore}/${maxScore}`,
      ...correctWords.map((w) => `Correct: ${w}`),
      ...incorrectWords.map((w) => `Incorrect position/spelling: ${w}`),
    ],
    breakdown: { referenceText, submittedText, referenceWords, submittedWords, correctWords, incorrectWords, missingWords },
  };
}
