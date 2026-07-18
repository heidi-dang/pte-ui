import type { TaskModule } from '../types';
import { mcsslQuestionSchema, mcsslResponseSchema } from './schema';
import { MCSSLRenderer } from './Renderer';

export const mcsslTask: TaskModule = {
  code: 'MCSSL',
  section: 'Listening',
  timing: { prepSeconds: 10, responseSeconds: 120, onePlayAudio: true },
  questionSchema: mcsslQuestionSchema,
  responseSchema: mcsslResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: ['audio'],
  Renderer: MCSSLRenderer,
  createInitialResponse: () => ({ selectedOption: "" }),
  normalizeResponse: (data) => data,
};
