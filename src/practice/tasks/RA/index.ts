import type { TaskModule } from '../types';
import { raQuestionSchema, raResponseSchema } from './schema';
import { RARenderer } from './Renderer';

export const raTask: TaskModule = {
  code: 'RA',
  section: 'Speaking',
  timing: { prepSeconds: 40, responseSeconds: 40, onePlayAudio: false },
  questionSchema: raQuestionSchema,
  responseSchema: raResponseSchema,
  scoringStrategy: 'speech',
  requiredAssets: [],
  Renderer: RARenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};
