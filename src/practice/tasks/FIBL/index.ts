import type { TaskModule } from '../types';
import { fiblQuestionSchema, fiblResponseSchema } from './schema';
import { FIBLRenderer } from './Renderer';

export const fiblTask: TaskModule = {
  code: 'FIBL',
  section: 'Listening',
  timing: { prepSeconds: 10, responseSeconds: 180, onePlayAudio: true },
  questionSchema: fiblQuestionSchema,
  responseSchema: fiblResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: ['audio'],
  Renderer: FIBLRenderer,
};
