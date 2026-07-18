import type { TaskModule } from '../types';
import { ropQuestionSchema, ropResponseSchema } from './schema';
import { ROPRenderer } from './Renderer';

export const ropTask: TaskModule = {
  code: 'ROP',
  section: 'Reading',
  timing: { prepSeconds: 0, responseSeconds: 240, onePlayAudio: false },
  questionSchema: ropQuestionSchema,
  responseSchema: ropResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: [],
  Renderer: ROPRenderer,
};
