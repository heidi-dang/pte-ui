import { z } from 'zod';

export type PteSection = 'Speaking' | 'Writing' | 'Reading' | 'Listening';
export type TaskCode = 
  | 'RA' | 'RS' | 'DI' | 'RL' | 'ASQ' | 'SGD' | 'RTS' 
  | 'SWT' | 'WE' 
  | 'MCS' | 'MCM' | 'ROP' | 'FIBR' | 'FIBRW' 
  | 'SST' | 'MCMSL' | 'FIBL' | 'HCS' | 'MCSSL' | 'SMW' | 'HIW' | 'WFD';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface QuestionTaskDefinition {
  code: TaskCode;
  section: PteSection;
  name: string;
  instruction: string;
  requiresAudio: boolean;
  requiresImage: boolean;
  requiredPayloadFields: string[];
  generationSchema: z.ZodSchema;
  validateCandidate: (candidate: any) => ValidationResult;
}

// Reusable schemas
const baseQuestionSchema = z.object({
  title: z.string().min(5),
  instruction: z.string(),
  promptText: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()).min(1),
  explanation: z.string().optional(),
});

// 1. RA: Read Aloud
const raSchema = baseQuestionSchema.extend({
  taskCode: z.literal('RA'),
  passageText: z.string().min(20),
  taskPayload: z.object({
    pronunciationNotes: z.array(z.string()).optional(),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(false),
    image: z.boolean().default(false),
  })
});

// 2. RS: Repeat Sentence
const rsSchema = baseQuestionSchema.extend({
  taskCode: z.literal('RS'),
  taskPayload: z.object({
    sentence: z.string().min(5),
    referenceTranscript: z.string(),
    ttsScript: z.string(),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 3. DI: Describe Image
const diSchema = baseQuestionSchema.extend({
  taskCode: z.literal('DI'),
  taskPayload: z.object({
    chartSpecification: z.object({
      chartType: z.enum(['bar', 'line', 'pie', 'table', 'process']),
      title: z.string(),
      labels: z.array(z.string()),
      series: z.array(z.object({
        name: z.string(),
        values: z.array(z.number())
      })),
      units: z.string(),
      keyObservations: z.array(z.string())
    }),
    referencePoints: z.array(z.string())
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(false),
    image: z.boolean().default(true),
  })
});

// 4. RL: Retell Lecture
const rlSchema = baseQuestionSchema.extend({
  taskCode: z.literal('RL'),
  sampleAnswer: z.string(),
  taskPayload: z.object({
    lectureScript: z.string(),
    keyPoints: z.array(z.string()),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 5. ASQ: Answer Short Question
const asqSchema = baseQuestionSchema.extend({
  taskCode: z.literal('ASQ'),
  taskPayload: z.object({
    question: z.string(),
    acceptedShortAnswers: z.array(z.string()),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 6. SGD: Summarize Group Discussion
const sgdSchema = baseQuestionSchema.extend({
  taskCode: z.literal('SGD'),
  taskPayload: z.object({
    discussionScript: z.string(), // script formatted with speaker names
    keyPoints: z.array(z.string()),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 7. RTS: Respond to a Situation
const rtsSchema = baseQuestionSchema.extend({
  taskCode: z.literal('RTS'),
  taskPayload: z.object({
    situationScript: z.string(),
    responseCriteria: z.array(z.string()),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 8. SWT: Summarize Written Text
const swtSchema = baseQuestionSchema.extend({
  taskCode: z.literal('SWT'),
  passageText: z.string().min(50),
  sampleAnswer: z.string(), // one-sentence sample summary
  taskPayload: z.object({
    keyPoints: z.array(z.string()),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(false),
    image: z.boolean().default(false),
  })
});

// 9. WE: Write Essay
const weSchema = baseQuestionSchema.extend({
  taskCode: z.literal('WE'),
  sampleAnswer: z.string(),
  taskPayload: z.object({
    essayPrompt: z.string(),
    positionGuidance: z.array(z.string()),
    outline: z.array(z.string()),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(false),
    image: z.boolean().default(false),
  })
});

// 10. MCS: Multiple Choice (Single)
const mcsSchema = baseQuestionSchema.extend({
  taskCode: z.literal('MCS'),
  passageText: z.string(),
  taskPayload: z.object({
    options: z.array(z.string()).min(3),
    correctAnswer: z.string(),
    optionExplanations: z.record(z.string(), z.string()).optional(),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(false),
    image: z.boolean().default(false),
  })
});

// 11. MCM: Multiple Choice (Multiple)
const mcmSchema = baseQuestionSchema.extend({
  taskCode: z.literal('MCM'),
  passageText: z.string(),
  taskPayload: z.object({
    options: z.array(z.string()).min(4),
    correctAnswers: z.array(z.string()).min(2),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(false),
    image: z.boolean().default(false),
  })
});

// 12. ROP: Re-order Paragraphs
const ropSchema = baseQuestionSchema.extend({
  taskCode: z.literal('ROP'),
  taskPayload: z.object({
    paragraphBlocks: z.array(z.string()).min(3),
    canonicalOrder: z.array(z.string()), // identical to paragraphBlocks but in correct order
    transitionExplanations: z.array(z.string()).optional(),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(false),
    image: z.boolean().default(false),
  })
});

// 13. FIBR: Fill in the Blanks (R) - Drag and drop
const fibrSchema = baseQuestionSchema.extend({
  taskCode: z.literal('FIBR'),
  passageText: z.string(), // Contains [[blank_1]], [[blank_2]], etc.
  taskPayload: z.object({
    options: z.array(z.string()).min(3), // More options than blanks
    answerMap: z.record(z.string(), z.string()), // e.g., { "blank_1": "correct_option" }
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(false),
    image: z.boolean().default(false),
  })
});

// 14. FIBRW: Fill in the Blanks (RW) - Dropdowns
const fibrwSchema = baseQuestionSchema.extend({
  taskCode: z.literal('FIBRW'),
  passageText: z.string(), // Contains [[blank_1]], [[blank_2]], etc.
  taskPayload: z.object({
    optionSets: z.record(z.string(), z.array(z.string())), // e.g., { "blank_1": ["opt1", "opt2", "opt3"] }
    answerMap: z.record(z.string(), z.string()), // e.g., { "blank_1": "opt2" }
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(false),
    image: z.boolean().default(false),
  })
});

// 15. SST: Summarize Spoken Text
const sstSchema = baseQuestionSchema.extend({
  taskCode: z.literal('SST'),
  sampleAnswer: z.string(),
  taskPayload: z.object({
    lectureScript: z.string(),
    keyPoints: z.array(z.string()),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 16. MCMSL: Multiple Choice (L) - Multiple Correct
const mcmslSchema = baseQuestionSchema.extend({
  taskCode: z.literal('MCMSL'),
  taskPayload: z.object({
    audioScript: z.string(),
    options: z.array(z.string()).min(4),
    correctAnswers: z.array(z.string()).min(2),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 17. FIBL: Fill in the Blanks (L)
const fiblSchema = baseQuestionSchema.extend({
  taskCode: z.literal('FIBL'),
  taskPayload: z.object({
    audioScript: z.string(), // Full transcript
    displayedBlanks: z.string(), // Transcript with blanks [[blank_1]]
    answerMap: z.record(z.string(), z.string()), // Mapping to exact words typed
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 18. HCS: Highlight Correct Summary
const hcsSchema = baseQuestionSchema.extend({
  taskCode: z.literal('HCS'),
  taskPayload: z.object({
    audioScript: z.string(),
    summaryOptions: z.array(z.string()).min(3),
    correctSummary: z.string(),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 19. MCSSL: Multiple Choice Single (L)
const mcsslSchema = baseQuestionSchema.extend({
  taskCode: z.literal('MCSSL'),
  taskPayload: z.object({
    audioScript: z.string(),
    options: z.array(z.string()).min(3),
    correctAnswer: z.string(),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 20. SMW: Select Missing Word
const smwSchema = baseQuestionSchema.extend({
  taskCode: z.literal('SMW'),
  taskPayload: z.object({
    audioScript: z.string(), // with a beep indicated
    missingWordLocation: z.string(), // e.g. "end" or context
    options: z.array(z.string()).min(3),
    correctAnswer: z.string(),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 21. HIW: Highlight Incorrect Words
const hiwSchema = baseQuestionSchema.extend({
  taskCode: z.literal('HIW'),
  taskPayload: z.object({
    correctTranscript: z.string(),
    alteredDisplayTranscript: z.string(),
    mismatchIndexes: z.array(z.number()), // array of word indexes that are altered
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

// 22. WFD: Write from Dictation
const wfdSchema = baseQuestionSchema.extend({
  taskCode: z.literal('WFD'),
  taskPayload: z.object({
    dictationSentence: z.string(),
    canonicalTranscript: z.string(),
  }),
  assetRequirements: z.object({
    audio: z.boolean().default(true),
    image: z.boolean().default(false),
  })
});

export const generatedQuestionUnion = z.discriminatedUnion('taskCode', [
  raSchema, rsSchema, diSchema, rlSchema, asqSchema, sgdSchema, rtsSchema,
  swtSchema, weSchema, mcsSchema, mcmSchema, ropSchema, fibrSchema, fibrwSchema,
  sstSchema, mcmslSchema, fiblSchema, hcsSchema, mcsslSchema, smwSchema, hiwSchema, wfdSchema
]);

export const QUESTION_REGISTRY: Record<TaskCode, QuestionTaskDefinition> = {
  RA: {
    code: 'RA',
    section: 'Speaking',
    name: 'Read Aloud',
    instruction: 'Read the text aloud as naturally and clearly as possible.',
    requiresAudio: false,
    requiresImage: false,
    requiredPayloadFields: [],
    generationSchema: raSchema,
    validateCandidate: (c) => ({ valid: true }) // Deterministic validators can go here or in a separate file
  },
  RS: {
    code: 'RS',
    section: 'Speaking',
    name: 'Repeat Sentence',
    instruction: 'You will hear a sentence. Please repeat the sentence exactly as you hear it.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['sentence', 'ttsScript'],
    generationSchema: rsSchema,
    validateCandidate: (c) => ({ valid: true })
  },
  DI: {
    code: 'DI',
    section: 'Speaking',
    name: 'Describe Image',
    instruction: 'Describe the image in detail.',
    requiresAudio: false,
    requiresImage: true,
    requiredPayloadFields: ['chartSpecification', 'referencePoints'],
    generationSchema: diSchema,
    validateCandidate: (c) => {
      const spec = c.taskPayload?.chartSpecification;
      if (!spec || !spec.series || spec.series.length === 0) return { valid: false, errors: ['DI requires chart series'] };
      return { valid: true };
    }
  },
  RL: {
    code: 'RL',
    section: 'Speaking',
    name: 'Retell Lecture',
    instruction: 'You will hear a lecture. After listening, retell what you have just heard.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['lectureScript', 'keyPoints'],
    generationSchema: rlSchema,
    validateCandidate: (c) => ({ valid: true })
  },
  ASQ: {
    code: 'ASQ',
    section: 'Speaking',
    name: 'Answer Short Question',
    instruction: 'You will hear a question. Please give a simple and short answer.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['question', 'acceptedShortAnswers'],
    generationSchema: asqSchema,
    validateCandidate: (c) => ({ valid: true })
  },
  SGD: {
    code: 'SGD',
    section: 'Speaking',
    name: 'Summarize Group Discussion',
    instruction: 'Listen to the discussion and summarize it.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['discussionScript', 'keyPoints'],
    generationSchema: sgdSchema,
    validateCandidate: (c) => ({ valid: true })
  },
  RTS: {
    code: 'RTS',
    section: 'Speaking',
    name: 'Respond to a Situation',
    instruction: 'Listen to the situation and respond appropriately.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['situationScript', 'responseCriteria'],
    generationSchema: rtsSchema,
    validateCandidate: (c) => ({ valid: true })
  },
  SWT: {
    code: 'SWT',
    section: 'Writing',
    name: 'Summarize Written Text',
    instruction: 'Read the passage and write a one-sentence summary.',
    requiresAudio: false,
    requiresImage: false,
    requiredPayloadFields: ['keyPoints'],
    generationSchema: swtSchema,
    validateCandidate: (c) => ({ valid: true })
  },
  WE: {
    code: 'WE',
    section: 'Writing',
    name: 'Write Essay',
    instruction: 'Write an essay on the given topic.',
    requiresAudio: false,
    requiresImage: false,
    requiredPayloadFields: ['essayPrompt', 'positionGuidance', 'outline'],
    generationSchema: weSchema,
    validateCandidate: (c) => ({ valid: true })
  },
  MCS: {
    code: 'MCS',
    section: 'Reading',
    name: 'Multiple Choice (Single)',
    instruction: 'Read the text and answer the multiple-choice question by selecting the correct response.',
    requiresAudio: false,
    requiresImage: false,
    requiredPayloadFields: ['options', 'correctAnswer'],
    generationSchema: mcsSchema,
    validateCandidate: (c) => {
      const { options, correctAnswer } = c.taskPayload || {};
      if (!options?.includes(correctAnswer)) return { valid: false, errors: ['Correct answer must be in options'] };
      return { valid: true };
    }
  },
  MCM: {
    code: 'MCM',
    section: 'Reading',
    name: 'Multiple Choice (Multiple)',
    instruction: 'Read the text and answer the question by selecting all the correct responses.',
    requiresAudio: false,
    requiresImage: false,
    requiredPayloadFields: ['options', 'correctAnswers'],
    generationSchema: mcmSchema,
    validateCandidate: (c) => {
      const { options, correctAnswers } = c.taskPayload || {};
      if (!correctAnswers?.every((ans: string) => options?.includes(ans))) return { valid: false, errors: ['All correct answers must be in options'] };
      return { valid: true };
    }
  },
  ROP: {
    code: 'ROP',
    section: 'Reading',
    name: 'Re-order Paragraphs',
    instruction: 'The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel.',
    requiresAudio: false,
    requiresImage: false,
    requiredPayloadFields: ['paragraphBlocks', 'canonicalOrder'],
    generationSchema: ropSchema,
    validateCandidate: (c) => {
      const { paragraphBlocks, canonicalOrder } = c.taskPayload || {};
      if (paragraphBlocks?.length !== canonicalOrder?.length) return { valid: false, errors: ['Canonical order must have same length as paragraph blocks'] };
      return { valid: true };
    }
  },
  FIBR: {
    code: 'FIBR',
    section: 'Reading',
    name: 'Fill in the Blanks (R)',
    instruction: 'In the text below some words are missing. Drag words from the box below to the appropriate place in the text.',
    requiresAudio: false,
    requiresImage: false,
    requiredPayloadFields: ['options', 'answerMap'],
    generationSchema: fibrSchema,
    validateCandidate: (c) => {
      const { options, answerMap } = c.taskPayload || {};
      if (!Object.values(answerMap || {}).every((ans) => options?.includes(ans as string))) return { valid: false, errors: ['All answers must be in options'] };
      return { valid: true };
    }
  },
  FIBRW: {
    code: 'FIBRW',
    section: 'Reading',
    name: 'Fill in the Blanks (RW)',
    instruction: 'Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.',
    requiresAudio: false,
    requiresImage: false,
    requiredPayloadFields: ['optionSets', 'answerMap'],
    generationSchema: fibrwSchema,
    validateCandidate: (c) => {
      const { optionSets, answerMap } = c.taskPayload || {};
      for (const blankId in answerMap) {
        if (!optionSets[blankId]?.includes(answerMap[blankId])) return { valid: false, errors: [`Answer for ${blankId} is not in its option set`] };
      }
      return { valid: true };
    }
  },
  SST: {
    code: 'SST',
    section: 'Listening',
    name: 'Summarize Spoken Text',
    instruction: 'You will hear a short report. Write a summary for a fellow student who was not present.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['lectureScript', 'keyPoints'],
    generationSchema: sstSchema,
    validateCandidate: (c) => ({ valid: true })
  },
  MCMSL: {
    code: 'MCMSL',
    section: 'Listening',
    name: 'Multiple Choice (L)',
    instruction: 'Listen to the recording and answer the question by selecting all the correct responses.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['audioScript', 'options', 'correctAnswers'],
    generationSchema: mcmslSchema,
    validateCandidate: (c) => {
      const { options, correctAnswers } = c.taskPayload || {};
      if (!correctAnswers?.every((ans: string) => options?.includes(ans))) return { valid: false, errors: ['All correct answers must be in options'] };
      return { valid: true };
    }
  },
  FIBL: {
    code: 'FIBL',
    section: 'Listening',
    name: 'Fill in the Blanks (L)',
    instruction: 'You will hear a recording. Type the missing words in each blank.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['audioScript', 'displayedBlanks', 'answerMap'],
    generationSchema: fiblSchema,
    validateCandidate: (c) => ({ valid: true })
  },
  HCS: {
    code: 'HCS',
    section: 'Listening',
    name: 'Highlight Correct Summary',
    instruction: 'You will hear a recording. Click on the paragraph that best relates to the recording.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['audioScript', 'summaryOptions', 'correctSummary'],
    generationSchema: hcsSchema,
    validateCandidate: (c) => {
      const { summaryOptions, correctSummary } = c.taskPayload || {};
      if (!summaryOptions?.includes(correctSummary)) return { valid: false, errors: ['Correct summary must be in options'] };
      return { valid: true };
    }
  },
  MCSSL: {
    code: 'MCSSL',
    section: 'Listening',
    name: 'Multiple Choice Single (L)',
    instruction: 'Listen to the recording and answer the multiple-choice question by selecting the correct response.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['audioScript', 'options', 'correctAnswer'],
    generationSchema: mcsslSchema,
    validateCandidate: (c) => {
      const { options, correctAnswer } = c.taskPayload || {};
      if (!options?.includes(correctAnswer)) return { valid: false, errors: ['Correct answer must be in options'] };
      return { valid: true };
    }
  },
  SMW: {
    code: 'SMW',
    section: 'Listening',
    name: 'Select Missing Word',
    instruction: 'You will hear a recording about a topic. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['audioScript', 'missingWordLocation', 'options', 'correctAnswer'],
    generationSchema: smwSchema,
    validateCandidate: (c) => {
      const { options, correctAnswer } = c.taskPayload || {};
      if (!options?.includes(correctAnswer)) return { valid: false, errors: ['Correct answer must be in options'] };
      return { valid: true };
    }
  },
  HIW: {
    code: 'HIW',
    section: 'Listening',
    name: 'Highlight Incorrect Words',
    instruction: 'You will hear a recording. Some words in the transcript differ from what the speaker says. Please click on the words that are different.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['correctTranscript', 'alteredDisplayTranscript', 'mismatchIndexes'],
    generationSchema: hiwSchema,
    validateCandidate: (c) => ({ valid: true })
  },
  WFD: {
    code: 'WFD',
    section: 'Listening',
    name: 'Write from Dictation',
    instruction: 'You will hear a sentence. Type the sentence in the box below exactly as you hear it. You will hear the sentence only once.',
    requiresAudio: true,
    requiresImage: false,
    requiredPayloadFields: ['dictationSentence', 'canonicalTranscript'],
    generationSchema: wfdSchema,
    validateCandidate: (c) => ({ valid: true })
  }
};
