import type { DeterministicScoreResult } from './types';
import type { ScorerInput } from './types';

export function scoreMCM(input: ScorerInput): DeterministicScoreResult {
  const answerKey = input.answerKey;
  const correctAnswers: string[] = (answerKey.correctAnswers || answerKey.answers || []) as string[];
  const correctSet = new Set(correctAnswers.map((a) => a.toLowerCase()));

  const selected: string[] = (input.answer as any)?.selectedMultiple || [];
  const selectedSet = new Set(selected.map((a) => a.toLowerCase()));

  const correctSelected = selected.filter((s) => correctSet.has(s.toLowerCase()));
  const incorrectSelected = selected.filter((s) => !correctSet.has(s.toLowerCase()));
  const missing = correctAnswers.filter((c) => !selectedSet.has(c.toLowerCase()));

  let earnedScore = correctSelected.length - incorrectSelected.length;
  earnedScore = Math.max(0, earnedScore);

  const maxScore = correctAnswers.length;

  return {
    taskCode: 'MCM',
    scorerVersion: 'deterministic-pte-v1',
    maxScore,
    earnedScore,
    normalizedScore: maxScore > 0 ? earnedScore / maxScore : 0,
    correct: correctSelected,
    incorrect: incorrectSelected,
    missing,
    feedback: [
      ...correctSelected.map((s) => `Correct: ${s}`),
      ...incorrectSelected.map((s) => `Incorrect: ${s}`),
      ...missing.map((s) => `Missing: ${s}`),
    ],
    breakdown: { correctAnswers, selected, correctSelected, incorrectSelected, earnedScore, maxScore },
  };
}

export function scoreMCMSL(input: ScorerInput): DeterministicScoreResult {
  return scoreMCM(input);
}
