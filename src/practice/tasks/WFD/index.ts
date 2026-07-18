import type { TaskModule } from '../types';
import { wfdQuestionSchema, wfdResponseSchema } from './schema';
import { WFDRenderer } from './Renderer';

export const wfdTask: TaskModule = {
  code: 'WFD',
  section: 'Listening',
  timing: { prepSeconds: 10, responseSeconds: 45, onePlayAudio: true },
  questionSchema: wfdQuestionSchema,
  responseSchema: wfdResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: ['audio'],
  Renderer: WFDRenderer,
  createInitialResponse: () => ({ typedText: "" }),
  normalizeResponse: (data) => data,
};
