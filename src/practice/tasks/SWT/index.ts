import type { TaskModule } from '../types';
import { swtQuestionSchema, swtResponseSchema } from './schema';
import { SWTRenderer } from './Renderer';

export const swtTask: TaskModule = {
  code: 'SWT',
  section: 'Writing',
  timing: { prepSeconds: 0, responseSeconds: 600, onePlayAudio: false },
  questionSchema: swtQuestionSchema,
  responseSchema: swtResponseSchema,
  scoringStrategy: 'open_response',
  requiredAssets: [],
  Renderer: SWTRenderer,
  createInitialResponse: () => ({ typedText: "" }),
  normalizeResponse: (data) => data,
};
