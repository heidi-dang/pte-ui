import type { TaskModule } from '../types';
import { hcsQuestionSchema, hcsResponseSchema } from './schema';
import { HCSRenderer } from './Renderer';

export const hcsTask: TaskModule = {
  code: 'HCS',
  section: 'Listening',
  timing: { prepSeconds: 10, responseSeconds: 180, onePlayAudio: true },
  questionSchema: hcsQuestionSchema,
  responseSchema: hcsResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: ['audio'],
  Renderer: HCSRenderer,
  createInitialResponse: () => ({ selectedOption: "" }),
  normalizeResponse: (data) => data,
};
