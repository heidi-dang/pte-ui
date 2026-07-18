// Re-exports from canonical task contract registry.
// This file exists for backward compatibility with existing mock exam components.
// All new code should import from src/practice/contracts directly.

import { TASK_REGISTRY, type CanonicalTaskContract } from '../practice/contracts';

export interface MockTaskDefinition {
  taskType: string;
  name: string;
  requiresAudioPrompt: boolean;
  requiresRecording: boolean;
  preparationSeconds: number;
  responseSeconds: number;
  scoringSkills: string[];
  normalizeAnswer: (input: any) => any;
  validateAnswer: (input: any) => boolean;
}

function mapToMockDef(contract: CanonicalTaskContract): MockTaskDefinition {
  return {
    taskType: contract.code,
    name: contract.name,
    requiresAudioPrompt: contract.media.requiresPromptAudio,
    requiresRecording: contract.media.requiresResponseRecording,
    preparationSeconds: contract.timing.prepSeconds,
    responseSeconds: contract.timing.responseSeconds,
    scoringSkills: getSkillsForTask(contract.code),
    normalizeAnswer: (val) => {
      if (contract.scoringMode === 'deterministic') {
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch { return val || {}; }
        }
        return val || {};
      }
      return String(val || '');
    },
    validateAnswer: (val) => {
      if (contract.scoringMode === 'deterministic') {
        return val != null && (typeof val === 'object' ? Object.keys(val).length > 0 : String(val).trim().length > 0);
      }
      return String(val || '').trim().length > 0;
    },
  };
}

function getSkillsForTask(code: string): string[] {
  const map: Record<string, string[]> = {
    RA: ['speaking', 'reading'],
    RS: ['speaking', 'listening'],
    DI: ['speaking'],
    RL: ['speaking', 'listening'],
    ASQ: ['speaking', 'listening'],
    SGD: ['speaking'],
    RTS: ['speaking', 'reading'],
    SWT: ['writing', 'reading'],
    WE: ['writing'],
    MCS: ['reading'],
    MCM: ['reading'],
    ROP: ['reading'],
    FIBR: ['reading'],
    FIBRW: ['reading', 'writing'],
    SST: ['listening', 'writing'],
    FIBL: ['listening', 'writing'],
    HCS: ['listening', 'reading'],
    MCSSL: ['listening'],
    MCMSL: ['listening'],
    SMW: ['listening'],
    HIW: ['listening', 'reading'],
    WFD: ['listening', 'writing'],
  };
  return map[code] || [];
}

export const CANONICAL_MOCK_TASK_REGISTRY: Record<string, MockTaskDefinition> = {};
for (const [code, contract] of Object.entries(TASK_REGISTRY)) {
  CANONICAL_MOCK_TASK_REGISTRY[code] = mapToMockDef(contract);
}
