import type { TaskModule } from '../types';
import { smwQuestionSchema, smwResponseSchema } from './schema';
import { SMWRenderer } from './Renderer';

export const smwTask: TaskModule = {
  code: 'SMW',
  section: 'Listening',
  timing: { prepSeconds: 10, responseSeconds: 120, onePlayAudio: true },
  questionSchema: smwQuestionSchema,
  responseSchema: smwResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: ['audio'],
  Renderer: SMWRenderer,
  createInitialResponse: () => ({ selectedOption: "" }),
  normalizeResponse: (data) => data,
};
