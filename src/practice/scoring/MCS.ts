import type { DeterministicScoreResult } from './types';
import type { ScorerInput } from './types';

export function scoreMCS(input: ScorerInput): DeterministicScoreResult {
  const answerKey = input.answerKey;
  const correctAnswer = String(answerKey.correctAnswer || answerKey.answer || '');
  const selected = String((input.answer as any)?.selectedOption || '');

  const isCorrect = selected.toLowerCase() === correctAnswer.toLowerCase();

  return {
    taskCode: 'MCS',
    scorerVersion: 'deterministic-pte-v1',
    maxScore: 1,
    earnedScore: isCorrect ? 1 : 0,
    normalizedScore: isCorrect ? 1 : 0,
    correct: isCorrect ? [selected] : [],
    incorrect: isCorrect ? [] : [selected],
    missing: isCorrect ? [] : [correctAnswer],
    feedback: [isCorrect ? 'Correct' : `Incorrect. Expected: ${correctAnswer}`],
    breakdown: { selected, correctAnswer, isCorrect },
  };
}

export function scoreHCS(input: ScorerInput): DeterministicScoreResult {
  return scoreMCS(input);
}

export function scoreMCSSL(input: ScorerInput): DeterministicScoreResult {
  return scoreMCS(input);
}

export function scoreSMW(input: ScorerInput): DeterministicScoreResult {
  return scoreMCS(input);
}
