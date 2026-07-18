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

export const CANONICAL_MOCK_TASK_REGISTRY: Record<string, MockTaskDefinition> = {
  RA: {
    taskType: 'RA',
    name: 'Read Aloud',
    requiresAudioPrompt: false,
    requiresRecording: true,
    preparationSeconds: 35,
    responseSeconds: 40,
    scoringSkills: ['speaking', 'reading'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  RS: {
    taskType: 'RS',
    name: 'Repeat Sentence',
    requiresAudioPrompt: true,
    requiresRecording: true,
    preparationSeconds: 3,
    responseSeconds: 15,
    scoringSkills: ['speaking', 'listening'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  DI: {
    taskType: 'DI',
    name: 'Describe Image',
    requiresAudioPrompt: false,
    requiresRecording: true,
    preparationSeconds: 25,
    responseSeconds: 40,
    scoringSkills: ['speaking'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  RL: {
    taskType: 'RL',
    name: 'Retell Lecture',
    requiresAudioPrompt: true,
    requiresRecording: true,
    preparationSeconds: 25,
    responseSeconds: 40,
    scoringSkills: ['speaking', 'listening'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  ASQ: {
    taskType: 'ASQ',
    name: 'Answer Short Question',
    requiresAudioPrompt: true,
    requiresRecording: true,
    preparationSeconds: 3,
    responseSeconds: 10,
    scoringSkills: ['speaking', 'listening'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  SGD: {
    taskType: 'SGD',
    name: 'Speaking Group Discuss',
    requiresAudioPrompt: true,
    requiresRecording: true,
    preparationSeconds: 30,
    responseSeconds: 45,
    scoringSkills: ['speaking'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  RTS: {
    taskType: 'RTS',
    name: 'Read To Summarize',
    requiresAudioPrompt: false,
    requiresRecording: true,
    preparationSeconds: 40,
    responseSeconds: 50,
    scoringSkills: ['speaking', 'reading'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  SWT: {
    taskType: 'SWT',
    name: 'Summarize Written Text',
    requiresAudioPrompt: false,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 600,
    scoringSkills: ['writing', 'reading'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => {
      const words = String(val || '').trim().split(/\s+/).filter(Boolean).length;
      return words >= 5 && words <= 75;
    },
  },
  WE: {
    taskType: 'WE',
    name: 'Write Essay',
    requiresAudioPrompt: false,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 1200,
    scoringSkills: ['writing'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => {
      const words = String(val || '').trim().split(/\s+/).filter(Boolean).length;
      return words >= 200 && words <= 300;
    },
  },
  FIBR: {
    taskType: 'FIBR',
    name: 'Fill in the Blanks (Reading)',
    requiresAudioPrompt: false,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 180,
    scoringSkills: ['reading'],
    normalizeAnswer: (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return {};
        }
      }
      return val || {};
    },
    validateAnswer: (val) => Object.keys(val || {}).length > 0,
  },
  FIBRW: {
    taskType: 'FIBRW',
    name: 'Fill in the Blanks (Reading & Writing)',
    requiresAudioPrompt: false,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 180,
    scoringSkills: ['reading', 'writing'],
    normalizeAnswer: (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return {};
        }
      }
      return val || {};
    },
    validateAnswer: (val) => Object.keys(val || {}).length > 0,
  },
  ROP: {
    taskType: 'ROP',
    name: 'Reorder Paragraphs',
    requiresAudioPrompt: false,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 240,
    scoringSkills: ['reading'],
    normalizeAnswer: (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return Array.isArray(val) ? val : [];
    },
    validateAnswer: (val) => Array.isArray(val) && val.length > 0,
  },
  MCS: {
    taskType: 'MCS',
    name: 'Multiple Choice (Single)',
    requiresAudioPrompt: false,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 90,
    scoringSkills: ['reading'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  MCM: {
    taskType: 'MCM',
    name: 'Multiple Choice (Multiple)',
    requiresAudioPrompt: false,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 120,
    scoringSkills: ['reading'],
    normalizeAnswer: (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return Array.isArray(val) ? val : [];
    },
    validateAnswer: (val) => Array.isArray(val) && val.length > 0,
  },
  SST: {
    taskType: 'SST',
    name: 'Summarize Spoken Text',
    requiresAudioPrompt: true,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 600,
    scoringSkills: ['listening', 'writing'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => {
      const words = String(val || '').trim().split(/\s+/).filter(Boolean).length;
      return words >= 50 && words <= 70;
    },
  },
  FIBL: {
    taskType: 'FIBL',
    name: 'Fill in the Blanks (Listening)',
    requiresAudioPrompt: true,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 120,
    scoringSkills: ['listening', 'writing'],
    normalizeAnswer: (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return {};
        }
      }
      return val || {};
    },
    validateAnswer: (val) => Object.keys(val || {}).length > 0,
  },
  HCS: {
    taskType: 'HCS',
    name: 'Highlight Correct Summary',
    requiresAudioPrompt: true,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 150,
    scoringSkills: ['listening', 'reading'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  MCSSL: {
    taskType: 'MCSSL',
    name: 'Multiple Choice (Single, Listening)',
    requiresAudioPrompt: true,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 90,
    scoringSkills: ['listening'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  MCMSL: {
    taskType: 'MCMSL',
    name: 'Multiple Choice (Multiple, Listening)',
    requiresAudioPrompt: true,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 120,
    scoringSkills: ['listening'],
    normalizeAnswer: (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return Array.isArray(val) ? val : [];
    },
    validateAnswer: (val) => Array.isArray(val) && val.length > 0,
  },
  SMW: {
    taskType: 'SMW',
    name: 'Select Missing Word',
    requiresAudioPrompt: true,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 90,
    scoringSkills: ['listening'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
  HIW: {
    taskType: 'HIW',
    name: 'Highlight Incorrect Words',
    requiresAudioPrompt: true,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 150,
    scoringSkills: ['listening', 'reading'],
    normalizeAnswer: (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return Array.isArray(val) ? val : [];
    },
    validateAnswer: (val) => Array.isArray(val) && val.length > 0,
  },
  WFD: {
    taskType: 'WFD',
    name: 'Write From Dictation',
    requiresAudioPrompt: true,
    requiresRecording: false,
    preparationSeconds: 0,
    responseSeconds: 60,
    scoringSkills: ['listening', 'writing'],
    normalizeAnswer: (val) => String(val || ''),
    validateAnswer: (val) => String(val || '').trim().length > 0,
  },
};
