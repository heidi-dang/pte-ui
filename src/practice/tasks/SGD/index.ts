import type { TaskModule } from '../types';
import { sgdQuestionSchema, sgdResponseSchema } from './schema';
import { SGDRenderer } from './Renderer';

export const sgdTask: TaskModule = {
  code: 'SGD',
  section: 'Speaking',
  timing: { prepSeconds: 10, responseSeconds: 120, onePlayAudio: true },
  questionSchema: sgdQuestionSchema,
  responseSchema: sgdResponseSchema,
  scoringStrategy: 'speech',
  requiredAssets: ['audio'],
  Renderer: SGDRenderer,
  createInitialResponse: () => ({}),
  normalizeResponse: (data) => data,
};
