import type { TaskModule } from '../types';
import { hiwQuestionSchema, hiwResponseSchema } from './schema';
import { HIWRenderer } from './Renderer';

export const hiwTask: TaskModule = {
  code: 'HIW',
  section: 'Listening',
  timing: { prepSeconds: 10, responseSeconds: 120, onePlayAudio: true },
  questionSchema: hiwQuestionSchema,
  responseSchema: hiwResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: ['audio'],
  Renderer: HIWRenderer,
};
