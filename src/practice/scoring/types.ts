export type DeterministicScoreResult = {
  taskCode: string;
  scorerVersion: string;
  maxScore: number;
  earnedScore: number;
  normalizedScore: number;
  correct: unknown[];
  incorrect: unknown[];
  missing: unknown[];
  feedback: string[];
  breakdown: Record<string, unknown>;
};

export interface ScorerInput {
  taskCode: string;
  answer: unknown;
  answerKey: Record<string, unknown>;
}
