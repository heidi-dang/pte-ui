import type { TaskModule } from '../types';
import { rlQuestionSchema, rlResponseSchema } from './schema';
import { RLRenderer } from './Renderer';

export const rlTask: TaskModule = {
  code: 'RL',
  section: 'Speaking',
  timing: { prepSeconds: 10, responseSeconds: 40, onePlayAudio: true },
  questionSchema: rlQuestionSchema,
  responseSchema: rlResponseSchema,
  scoringStrategy: 'speech',
  requiredAssets: ['audio'],
  Renderer: RLRenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};
