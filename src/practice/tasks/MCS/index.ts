import type { TaskModule } from '../types';
import { mcsQuestionSchema, mcsResponseSchema } from './schema';
import { MCSRenderer } from './Renderer';

export const mcsTask: TaskModule = {
  code: 'MCS',
  section: 'Reading',
  timing: { prepSeconds: 0, responseSeconds: 120, onePlayAudio: false },
  questionSchema: mcsQuestionSchema,
  responseSchema: mcsResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: [],
  Renderer: MCSRenderer,
  createInitialResponse: () => ({ selectedOption: "" }),
  normalizeResponse: (data) => data,
};
