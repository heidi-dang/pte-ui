import type { DeterministicScoreResult } from './types';
import type { ScorerInput } from './types';

export function scoreROP(input: ScorerInput): DeterministicScoreResult {
  const answerKey = input.answerKey;
  const correctOrder: string[] = (answerKey.correctOrder || answerKey.order || []) as string[];
  const submitted: string[] = (input.answer as any)?.reorderedList || [];

  const positionMap = new Map<string, number>();
  correctOrder.forEach((item, idx) => positionMap.set(item, idx));

  const submittedPositions = submitted.map((s) => positionMap.get(s) ?? -1);
  let earnedScore = 0;
  const correctPairs: string[] = [];
  const incorrectPairs: string[] = [];

  for (let i = 0; i < submittedPositions.length - 1; i++) {
    const a = submitted[i];
    const b = submitted[i + 1];
    if (submittedPositions[i] + 1 === submittedPositions[i + 1]) {
      earnedScore++;
      correctPairs.push(`${a}→${b}`);
    } else {
      incorrectPairs.push(`${a}→${b}`);
    }
  }

  const maxScore = Math.max(0, correctOrder.length - 1);
  earnedScore = Math.max(0, Math.min(earnedScore, maxScore));

  return {
    taskCode: 'ROP',
    scorerVersion: 'deterministic-pte-v1',
    maxScore,
    earnedScore,
    normalizedScore: maxScore > 0 ? earnedScore / maxScore : 0,
    correct: correctPairs,
    incorrect: incorrectPairs,
    missing: [],
    feedback: [
      `Adjacent pairs correct: ${earnedScore}/${maxScore}`,
      ...correctPairs.map((p) => `Correct pair: ${p}`),
      ...incorrectPairs.map((p) => `Incorrect order: ${p}`),
    ],
    breakdown: { correctOrder, submitted, earnedScore, maxScore },
  };
}
