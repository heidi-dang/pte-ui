export interface PTETaskInfo {
  code: string;
  name: string;
  section: 'Speaking' | 'Writing' | 'Reading' | 'Listening';
  prepSeconds: number;
  responseSeconds: number;
  skillImpacts: ('speaking' | 'writing' | 'reading' | 'listening')[];
  rendererKey: string;
  requiresAudioPrompt: boolean;
  requiresStudentAudio: boolean;
  responseKind: 'audio' | 'text' | 'single_choice' | 'multi_choice' | 'ordered_list' | 'blanks' | 'highlight_words';
  scoringKind: 'deterministic' | 'ai' | 'stt_ai';
  maxCredit: number;
  examModeNavigation: 'sequential' | 'free';
}

export const PTE_TASK_REGISTRY: Record<string, PTETaskInfo> = {
  // Speaking (7 tasks)
  RA: {
    code: 'RA', name: 'Read Aloud', section: 'Speaking',
    prepSeconds: 10, responseSeconds: 40,
    skillImpacts: ['speaking', 'reading'],
    rendererKey: 'SpeakingAudio', requiresAudioPrompt: false, requiresStudentAudio: true,
    responseKind: 'audio', scoringKind: 'stt_ai', maxCredit: 15,
    examModeNavigation: 'sequential',
  },
  RS: {
    code: 'RS', name: 'Repeat Sentence', section: 'Speaking',
    prepSeconds: 3, responseSeconds: 15,
    skillImpacts: ['speaking', 'listening'],
    rendererKey: 'SpeakingAudio', requiresAudioPrompt: true, requiresStudentAudio: true,
    responseKind: 'audio', scoringKind: 'stt_ai', maxCredit: 13,
    examModeNavigation: 'sequential',
  },
  DI: {
    code: 'DI', name: 'Describe Image', section: 'Speaking',
    prepSeconds: 25, responseSeconds: 40,
    skillImpacts: ['speaking'],
    rendererKey: 'SpeakingAudio', requiresAudioPrompt: false, requiresStudentAudio: true,
    responseKind: 'audio', scoringKind: 'stt_ai', maxCredit: 15,
    examModeNavigation: 'sequential',
  },
  RL: {
    code: 'RL', name: 'Retell Lecture', section: 'Speaking',
    prepSeconds: 10, responseSeconds: 40,
    skillImpacts: ['speaking', 'listening'],
    rendererKey: 'SpeakingAudio', requiresAudioPrompt: true, requiresStudentAudio: true,
    responseKind: 'audio', scoringKind: 'stt_ai', maxCredit: 15,
    examModeNavigation: 'sequential',
  },
  ASQ: {
    code: 'ASQ', name: 'Answer Short Question', section: 'Speaking',
    prepSeconds: 3, responseSeconds: 10,
    skillImpacts: ['speaking', 'listening'],
    rendererKey: 'SpeakingAudio', requiresAudioPrompt: true, requiresStudentAudio: true,
    responseKind: 'audio', scoringKind: 'deterministic', maxCredit: 10,
    examModeNavigation: 'sequential',
  },
  SGD: {
    code: 'SGD', name: 'Summarize Group Discussion', section: 'Speaking',
    prepSeconds: 10, responseSeconds: 120,
    skillImpacts: ['speaking'],
    rendererKey: 'SpeakingAudio', requiresAudioPrompt: true, requiresStudentAudio: true,
    responseKind: 'audio', scoringKind: 'stt_ai', maxCredit: 15,
    examModeNavigation: 'sequential',
  },
  RTS: {
    code: 'RTS', name: 'Respond to a Situation', section: 'Speaking',
    prepSeconds: 10, responseSeconds: 40,
    skillImpacts: ['speaking', 'reading'],
    rendererKey: 'SpeakingAudio', requiresAudioPrompt: false, requiresStudentAudio: true,
    responseKind: 'audio', scoringKind: 'stt_ai', maxCredit: 15,
    examModeNavigation: 'sequential',
  },

  // Writing (2 tasks)
  SWT: {
    code: 'SWT', name: 'Summarize Written Text', section: 'Writing',
    prepSeconds: 0, responseSeconds: 600,
    skillImpacts: ['writing', 'reading'],
    rendererKey: 'WritingText', requiresAudioPrompt: false, requiresStudentAudio: false,
    responseKind: 'text', scoringKind: 'ai', maxCredit: 10,
    examModeNavigation: 'sequential',
  },
  WE: {
    code: 'WE', name: 'Write Essay', section: 'Writing',
    prepSeconds: 0, responseSeconds: 1200,
    skillImpacts: ['writing'],
    rendererKey: 'WritingText', requiresAudioPrompt: false, requiresStudentAudio: false,
    responseKind: 'text', scoringKind: 'ai', maxCredit: 15,
    examModeNavigation: 'sequential',
  },

  // Reading (5 tasks)
  MCS: {
    code: 'MCS', name: 'Multiple-choice, Choose Single Answer', section: 'Reading',
    prepSeconds: 0, responseSeconds: 90,
    skillImpacts: ['reading'],
    rendererKey: 'SingleChoice', requiresAudioPrompt: false, requiresStudentAudio: false,
    responseKind: 'single_choice', scoringKind: 'deterministic', maxCredit: 5,
    examModeNavigation: 'sequential',
  },
  MCM: {
    code: 'MCM', name: 'Multiple-choice, Choose Multiple Answers', section: 'Reading',
    prepSeconds: 0, responseSeconds: 120,
    skillImpacts: ['reading'],
    rendererKey: 'MultiChoice', requiresAudioPrompt: false, requiresStudentAudio: false,
    responseKind: 'multi_choice', scoringKind: 'deterministic', maxCredit: 8,
    examModeNavigation: 'sequential',
  },
  ROP: {
    code: 'ROP', name: 'Re-order Paragraphs', section: 'Reading',
    prepSeconds: 0, responseSeconds: 240,
    skillImpacts: ['reading'],
    rendererKey: 'ReorderParagraph', requiresAudioPrompt: false, requiresStudentAudio: false,
    responseKind: 'ordered_list', scoringKind: 'deterministic', maxCredit: 10,
    examModeNavigation: 'sequential',
  },
  FIBR: {
    code: 'FIBR', name: 'Fill in the Blanks (Reading)', section: 'Reading',
    prepSeconds: 0, responseSeconds: 180,
    skillImpacts: ['reading'],
    rendererKey: 'FillBlank', requiresAudioPrompt: false, requiresStudentAudio: false,
    responseKind: 'blanks', scoringKind: 'deterministic', maxCredit: 10,
    examModeNavigation: 'sequential',
  },
  FIBRW: {
    code: 'FIBRW', name: 'Fill in the Blanks (Reading & Writing)', section: 'Reading',
    prepSeconds: 0, responseSeconds: 180,
    skillImpacts: ['reading', 'writing'],
    rendererKey: 'FillBlank', requiresAudioPrompt: false, requiresStudentAudio: false,
    responseKind: 'blanks', scoringKind: 'deterministic', maxCredit: 15,
    examModeNavigation: 'sequential',
  },

  // Listening (8 tasks)
  SST: {
    code: 'SST', name: 'Summarize Spoken Text', section: 'Listening',
    prepSeconds: 10, responseSeconds: 600,
    skillImpacts: ['listening', 'writing'],
    rendererKey: 'WritingText', requiresAudioPrompt: true, requiresStudentAudio: false,
    responseKind: 'text', scoringKind: 'ai', maxCredit: 10,
    examModeNavigation: 'sequential',
  },
  MCMSL: {
    code: 'MCMSL', name: 'Multiple-choice, Choose Multiple Answers (Listening)', section: 'Listening',
    prepSeconds: 10, responseSeconds: 120,
    skillImpacts: ['listening'],
    rendererKey: 'MultiChoice', requiresAudioPrompt: true, requiresStudentAudio: false,
    responseKind: 'multi_choice', scoringKind: 'deterministic', maxCredit: 8,
    examModeNavigation: 'sequential',
  },
  FIBL: {
    code: 'FIBL', name: 'Fill in the Blanks (Listening)', section: 'Listening',
    prepSeconds: 10, responseSeconds: 120,
    skillImpacts: ['listening', 'writing'],
    rendererKey: 'FillBlank', requiresAudioPrompt: true, requiresStudentAudio: false,
    responseKind: 'blanks', scoringKind: 'deterministic', maxCredit: 8,
    examModeNavigation: 'sequential',
  },
  HCS: {
    code: 'HCS', name: 'Highlight Correct Summary', section: 'Listening',
    prepSeconds: 10, responseSeconds: 150,
    skillImpacts: ['listening', 'reading'],
    rendererKey: 'SingleChoice', requiresAudioPrompt: true, requiresStudentAudio: false,
    responseKind: 'single_choice', scoringKind: 'deterministic', maxCredit: 5,
    examModeNavigation: 'sequential',
  },
  MCSSL: {
    code: 'MCSSL', name: 'Multiple-choice, Choose Single Answer (Listening)', section: 'Listening',
    prepSeconds: 10, responseSeconds: 90,
    skillImpacts: ['listening'],
    rendererKey: 'SingleChoice', requiresAudioPrompt: true, requiresStudentAudio: false,
    responseKind: 'single_choice', scoringKind: 'deterministic', maxCredit: 5,
    examModeNavigation: 'sequential',
  },
  SMW: {
    code: 'SMW', name: 'Select Missing Word', section: 'Listening',
    prepSeconds: 10, responseSeconds: 90,
    skillImpacts: ['listening'],
    rendererKey: 'SingleChoice', requiresAudioPrompt: true, requiresStudentAudio: false,
    responseKind: 'single_choice', scoringKind: 'deterministic', maxCredit: 5,
    examModeNavigation: 'sequential',
  },
  HIW: {
    code: 'HIW', name: 'Highlight Incorrect Words', section: 'Listening',
    prepSeconds: 10, responseSeconds: 150,
    skillImpacts: ['listening', 'reading'],
    rendererKey: 'HighlightIncorrectWords', requiresAudioPrompt: true, requiresStudentAudio: false,
    responseKind: 'highlight_words', scoringKind: 'deterministic', maxCredit: 8,
    examModeNavigation: 'sequential',
  },
  WFD: {
    code: 'WFD', name: 'Write from Dictation', section: 'Listening',
    prepSeconds: 10, responseSeconds: 60,
    skillImpacts: ['listening', 'writing'],
    rendererKey: 'WriteFromDictation', requiresAudioPrompt: true, requiresStudentAudio: false,
    responseKind: 'text', scoringKind: 'deterministic', maxCredit: 10,
    examModeNavigation: 'sequential',
  },
};

export const PTE_TASK_CODES = Object.keys(PTE_TASK_REGISTRY);
export const PTE_TASKS_BY_SECTION = Object.values(PTE_TASK_REGISTRY).reduce(
  (acc, t) => {
    (acc[t.section] ??= []).push(t);
    return acc;
  },
  {} as Record<string, PTETaskInfo[]>,
);

export function getTaskInfo(code: string): PTETaskInfo | undefined {
  return PTE_TASK_REGISTRY[code];
}

export function getAllTaskInfos(): PTETaskInfo[] {
  return Object.values(PTE_TASK_REGISTRY);
}
