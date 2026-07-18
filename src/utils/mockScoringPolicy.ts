export const MOCK_SCORING_POLICY_VERSION = 'pte-estimated-v1';

export interface TaskScoringWeight {
  taskCode: string;
  maxCredit: number;
  skills: ('speaking' | 'writing' | 'reading' | 'listening')[];
}

// Registry defining raw credit bounds and communicative skill impacts for all 22 task types
export const TASK_SCORING_REGISTRY: Record<string, TaskScoringWeight> = {
  RA: { taskCode: 'RA', maxCredit: 15, skills: ['speaking', 'reading'] },
  RS: { taskCode: 'RS', maxCredit: 13, skills: ['speaking', 'listening'] },
  DI: { taskCode: 'DI', maxCredit: 15, skills: ['speaking'] },
  RL: { taskCode: 'RL', maxCredit: 15, skills: ['speaking', 'listening'] },
  ASQ: { taskCode: 'ASQ', maxCredit: 10, skills: ['speaking', 'listening'] },
  SGD: { taskCode: 'SGD', maxCredit: 15, skills: ['speaking'] },
  RTS: { taskCode: 'RTS', maxCredit: 15, skills: ['speaking', 'reading'] },
  
  SWT: { taskCode: 'SWT', maxCredit: 10, skills: ['writing', 'reading'] },
  WE: { taskCode: 'WE', maxCredit: 15, skills: ['writing'] },
  
  FIBR: { taskCode: 'FIBR', maxCredit: 10, skills: ['reading'] },
  FIBRW: { taskCode: 'FIBRW', maxCredit: 15, skills: ['reading', 'writing'] },
  ROP: { taskCode: 'ROP', maxCredit: 10, skills: ['reading'] },
  MCS: { taskCode: 'MCS', maxCredit: 5, skills: ['reading'] },
  MCM: { taskCode: 'MCM', maxCredit: 8, skills: ['reading'] },
  
  SST: { taskCode: 'SST', maxCredit: 10, skills: ['listening', 'writing'] },
  FIBL: { taskCode: 'FIBL', maxCredit: 8, skills: ['listening', 'writing'] },
  HCS: { taskCode: 'HCS', maxCredit: 5, skills: ['listening', 'reading'] },
  MCSSL: { taskCode: 'MCSSL', maxCredit: 5, skills: ['listening'] },
  MCMSL: { taskCode: 'MCMSL', maxCredit: 8, skills: ['listening'] },
  SMW: { taskCode: 'SMW', maxCredit: 5, skills: ['listening'] },
  HIW: { taskCode: 'HIW', maxCredit: 8, skills: ['listening', 'reading'] },
  WFD: { taskCode: 'WFD', maxCredit: 10, skills: ['listening', 'writing'] },
};

export function normalizeSkillScore(earned: number, maximum: number): number | null {
  if (maximum <= 0) return null;
  const ratio = Math.max(0, Math.min(1, earned / maximum));
  return Math.round(10 + ratio * 80); // PTE Scale: 10 to 90
}

export interface SkillScores {
  speaking: number | null;
  writing: number | null;
  reading: number | null;
  listening: number | null;
}

export function calculateOverallScore(scores: SkillScores): number | null {
  const activeScores = [
    scores.speaking,
    scores.writing,
    scores.reading,
    scores.listening,
  ].filter((s): s is number => s !== null);

  if (activeScores.length === 0) return null;

  const total = activeScores.reduce((sum, s) => sum + s, 0);
  return Math.round(total / activeScores.length);
}
