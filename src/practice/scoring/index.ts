import type { DeterministicScoreResult, ScorerInput } from './types';
import { scoreMCS, scoreHCS, scoreMCSSL, scoreSMW } from './MCS';
import { scoreMCM, scoreMCMSL } from './MCM';
import { scoreROP } from './ROP';
import { scoreFIBR, scoreFIBRW, scoreFIBL } from './FIBR';
import { scoreHIW } from './HIW';
import { scoreWFD } from './WFD';
import { scoreASQ } from './ASQ';

export type { DeterministicScoreResult, ScorerInput } from './types';

const SCORER_REGISTRY: Record<string, (input: ScorerInput) => DeterministicScoreResult> = {
  MCS: scoreMCS,
  MCM: scoreMCM,
  ROP: scoreROP,
  FIBR: scoreFIBR,
  FIBRW: scoreFIBRW,
  FIBL: scoreFIBL,
  HCS: scoreHCS,
  MCSSL: scoreMCSSL,
  MCMSL: scoreMCMSL,
  SMW: scoreSMW,
  HIW: scoreHIW,
  WFD: scoreWFD,
  ASQ: scoreASQ,
};

export function getDeterministicScorer(taskCode: string): ((input: ScorerInput) => DeterministicScoreResult) | null {
  return SCORER_REGISTRY[taskCode] || null;
}

export function scoreDeterministic(input: ScorerInput): DeterministicScoreResult {
  const scorer = getDeterministicScorer(input.taskCode);
  if (!scorer) {
    return {
      taskCode: input.taskCode,
      scorerVersion: 'deterministic-pte-v1',
      maxScore: 0,
      earnedScore: 0,
      normalizedScore: 0,
      correct: [],
      incorrect: [],
      missing: [],
      feedback: [`No deterministic scorer registered for ${input.taskCode}`],
      breakdown: { error: 'No scorer registered' },
    };
  }
  return scorer(input);
}

export const DETERMINISTIC_TASK_CODES = Object.keys(SCORER_REGISTRY);
