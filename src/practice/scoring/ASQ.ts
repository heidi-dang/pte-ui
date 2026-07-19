import type { DeterministicScoreResult } from './types';
import type { ScorerInput } from './types';
import { normalizeText } from './normalize';

export function scoreASQ(input: ScorerInput): DeterministicScoreResult {
  const answerKey = input.answerKey;
  const acceptedAnswers: string[] = (answerKey.acceptedAnswers || answerKey.aliases || answerKey.answers || []) as string[];
  const primaryAnswer = String(answerKey.answer || answerKey.correctAnswer || '');
  const allAnswers = [primaryAnswer, ...acceptedAnswers].filter(Boolean).map((a) => normalizeText(a));
  const uniqueAnswers = [...new Set(allAnswers)];

  const transcript = String((input.answer as any)?.transcript || (input.answer as any)?.typedText || '');
  const normalizedTranscript = normalizeText(transcript);

  const isCorrect = uniqueAnswers.some((a) => a === normalizedTranscript || normalizedTranscript.includes(a));

  return {
    taskCode: 'ASQ',
    scorerVersion: 'deterministic-pte-v1',
    maxScore: 1,
    earnedScore: isCorrect ? 1 : 0,
    normalizedScore: isCorrect ? 1 : 0,
    correct: isCorrect ? [transcript] : [],
    incorrect: isCorrect ? [] : [transcript],
    missing: isCorrect ? [] : uniqueAnswers,
    feedback: [
      isCorrect
        ? 'Correct answer'
        : `Incorrect. Accepted answers: ${uniqueAnswers.join(', ')}`,
    ],
    breakdown: { transcript, normalizedTranscript, acceptedAnswers: uniqueAnswers, isCorrect },
  };
}
