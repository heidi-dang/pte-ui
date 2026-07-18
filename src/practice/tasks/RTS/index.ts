import type { TaskModule } from '../types';
import { rtsQuestionSchema, rtsResponseSchema } from './schema';
import { RTSRenderer } from './Renderer';

export const rtsTask: TaskModule = {
  code: 'RTS',
  section: 'Speaking',
  timing: { prepSeconds: 10, responseSeconds: 40, onePlayAudio: false },
  questionSchema: rtsQuestionSchema,
  responseSchema: rtsResponseSchema,
  scoringStrategy: 'speech',
  requiredAssets: [],
  Renderer: RTSRenderer,
};
