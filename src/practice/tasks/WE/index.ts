import type { TaskModule } from '../types';
import { weQuestionSchema, weResponseSchema } from './schema';
import { WERenderer } from './Renderer';

export const weTask: TaskModule = {
  code: 'WE',
  section: 'Writing',
  timing: { prepSeconds: 0, responseSeconds: 1200, onePlayAudio: false },
  questionSchema: weQuestionSchema,
  responseSchema: weResponseSchema,
  scoringStrategy: 'open_response',
  requiredAssets: [],
  Renderer: WERenderer,
};
