import type { TaskModule } from '../types';
import { mcmQuestionSchema, mcmResponseSchema } from './schema';
import { MCMRenderer } from './Renderer';

export const mcmTask: TaskModule = {
  code: 'MCM',
  section: 'Reading',
  timing: { prepSeconds: 0, responseSeconds: 180, onePlayAudio: false },
  questionSchema: mcmQuestionSchema,
  responseSchema: mcmResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: [],
  Renderer: MCMRenderer,
};
