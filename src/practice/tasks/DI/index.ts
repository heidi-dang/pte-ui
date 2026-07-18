import type { TaskModule } from '../types';
import { diQuestionSchema, diResponseSchema } from './schema';
import { DIRenderer } from './Renderer';

export const diTask: TaskModule = {
  code: 'DI',
  section: 'Speaking',
  timing: { prepSeconds: 25, responseSeconds: 40, onePlayAudio: false },
  questionSchema: diQuestionSchema,
  responseSchema: diResponseSchema,
  scoringStrategy: 'speech',
  requiredAssets: ['image'],
  Renderer: DIRenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};
