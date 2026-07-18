import type { TaskModule } from '../types';
import { asqQuestionSchema, asqResponseSchema } from './schema';
import { ASQRenderer } from './Renderer';

export const asqTask: TaskModule = {
  code: 'ASQ',
  section: 'Speaking',
  timing: { prepSeconds: 3, responseSeconds: 10, onePlayAudio: true },
  questionSchema: asqQuestionSchema,
  responseSchema: asqResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: ['audio'],
  Renderer: ASQRenderer,
};
