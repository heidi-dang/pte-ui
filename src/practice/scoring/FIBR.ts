import type { DeterministicScoreResult } from './types';
import type { ScorerInput } from './types';
import { normalizeBlank } from './normalize';

function scoreBlanks(input: ScorerInput, taskCode: string): DeterministicScoreResult {
  const answerKey = input.answerKey;
  const correctBlanks: Record<string, string[]> =
    (answerKey.correctBlanks || answerKey.blanks || answerKey.answers || {}) as Record<string, string[]>;
  const submittedBlanks: Record<string, string> =
    (input.answer as any)?.blanks || {};

  const correct: string[] = [];
  const incorrect: string[] = [];
  const missing: string[] = [];
  const feedback: string[] = [];

  const blankKeys = Object.keys(correctBlanks);

  for (const key of blankKeys) {
    const acceptedAnswers = Array.isArray(correctBlanks[key])
      ? correctBlanks[key].map((a) => normalizeBlank(a))
      : [normalizeBlank(String(correctBlanks[key]))];
    const submitted = normalizeBlank(submittedBlanks[key] || '');

    if (!submitted) {
      missing.push(key);
      feedback.push(`Blank ${key}: missing (expected: ${acceptedAnswers[0]})`);
    } else if (acceptedAnswers.includes(submitted)) {
      correct.push(key);
      feedback.push(`Blank ${key}: correct (${submitted})`);
    } else {
      incorrect.push(key);
      feedback.push(`Blank ${key}: incorrect (got: ${submitted}, expected: ${acceptedAnswers[0]})`);
    }
  }

  const maxScore = blankKeys.length;
  const earnedScore = correct.length;

  return {
    taskCode,
    scorerVersion: 'deterministic-pte-v1',
    maxScore,
    earnedScore,
    normalizedScore: maxScore > 0 ? earnedScore / maxScore : 0,
    correct,
    incorrect,
    missing,
    feedback,
    breakdown: { blankKeys, correct, incorrect, missing },
  };
}

export function scoreFIBR(input: ScorerInput): DeterministicScoreResult {
  return scoreBlanks(input, 'FIBR');
}

export function scoreFIBRW(input: ScorerInput): DeterministicScoreResult {
  return scoreBlanks(input, 'FIBRW');
}

export function scoreFIBL(input: ScorerInput): DeterministicScoreResult {
  return scoreBlanks(input, 'FIBL');
}
