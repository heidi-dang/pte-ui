import type { DeterministicScoreResult } from './types';
import type { ScorerInput } from './types';
import { normalizeText } from './normalize';

export function scoreHIW(input: ScorerInput): DeterministicScoreResult {
  const answerKey = input.answerKey;
  const trueWrongWords: string[] = (answerKey.incorrectWords || answerKey.wrongWords || answerKey.incorrect || []) as string[];
  const answer = input.answer as any;
  const submittedHighlighted: string[] = answer?.words || answer?.highlightedIncorrect || [];

  const trueWrongSet = new Set(trueWrongWords.map((w) => normalizeText(w)));
  const submittedSet = new Set(submittedHighlighted.map((w) => normalizeText(w)));

  const correctHighlights = submittedHighlighted.filter((w) => trueWrongSet.has(normalizeText(w)));
  const incorrectHighlights = submittedHighlighted.filter((w) => !trueWrongSet.has(normalizeText(w)));
  const missing = trueWrongWords.filter((w) => !submittedSet.has(normalizeText(w)));

  let earnedScore = correctHighlights.length - incorrectHighlights.length;
  earnedScore = Math.max(0, earnedScore);

  const maxScore = trueWrongWords.length;

  return {
    taskCode: 'HIW',
    scorerVersion: 'deterministic-pte-v1',
    maxScore,
    earnedScore,
    normalizedScore: maxScore > 0 ? earnedScore / maxScore : 0,
    correct: correctHighlights,
    incorrect: incorrectHighlights,
    missing,
    feedback: [
      ...correctHighlights.map((w) => `Correct highlight: ${w}`),
      ...incorrectHighlights.map((w) => `Incorrect highlight: ${w}`),
      ...missing.map((w) => `Missed: ${w}`),
    ],
    breakdown: { trueWrongWords, submittedHighlighted, correctHighlights, incorrectHighlights, missing },
  };
}
