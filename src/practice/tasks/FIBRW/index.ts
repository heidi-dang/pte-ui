import type { TaskModule } from '../types';
import { fibrwQuestionSchema, fibrwResponseSchema } from './schema';
import { FIBRWRenderer } from './Renderer';

export const fibrwTask: TaskModule = {
  code: 'FIBRW',
  section: 'Reading',
  timing: { prepSeconds: 0, responseSeconds: 180, onePlayAudio: false },
  questionSchema: fibrwQuestionSchema,
  responseSchema: fibrwResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: [],
  Renderer: FIBRWRenderer,
};
