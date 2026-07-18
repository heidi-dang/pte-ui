import type { TaskModule } from '../types';
import { fibrQuestionSchema, fibrResponseSchema } from './schema';
import { FIBRRenderer } from './Renderer';

export const fibrTask: TaskModule = {
  code: 'FIBR',
  section: 'Reading',
  timing: { prepSeconds: 0, responseSeconds: 180, onePlayAudio: false },
  questionSchema: fibrQuestionSchema,
  responseSchema: fibrResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: [],
  Renderer: FIBRRenderer,
  createInitialResponse: () => ({ blanks: {} }),
  normalizeResponse: (data) => data,
};
