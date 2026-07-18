import type { TaskModule } from '../types';
import { mcmslQuestionSchema, mcmslResponseSchema } from './schema';
import { MCMSLRenderer } from './Renderer';

export const mcmslTask: TaskModule = {
  code: 'MCMSL',
  section: 'Listening',
  timing: { prepSeconds: 10, responseSeconds: 180, onePlayAudio: true },
  questionSchema: mcmslQuestionSchema,
  responseSchema: mcmslResponseSchema,
  scoringStrategy: 'deterministic',
  requiredAssets: ['audio'],
  Renderer: MCMSLRenderer,
};
