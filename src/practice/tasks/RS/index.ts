import type { TaskModule } from '../types';
import { rsQuestionSchema, rsResponseSchema } from './schema';
import { RSRenderer } from './Renderer';

export const rsTask: TaskModule = {
  code: 'RS',
  section: 'Speaking',
  timing: { prepSeconds: 3, responseSeconds: 15, onePlayAudio: true },
  questionSchema: rsQuestionSchema,
  responseSchema: rsResponseSchema,
  scoringStrategy: 'speech',
  requiredAssets: ['audio'],
  Renderer: RSRenderer,
};
