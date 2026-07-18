import type { TaskModule } from '../types';
import { sstQuestionSchema, sstResponseSchema } from './schema';
import { SSTRenderer } from './Renderer';

export const sstTask: TaskModule = {
  code: 'SST',
  section: 'Listening',
  timing: { prepSeconds: 12, responseSeconds: 600, onePlayAudio: true },
  questionSchema: sstQuestionSchema,
  responseSchema: sstResponseSchema,
  scoringStrategy: 'open_response',
  requiredAssets: ['audio'],
  Renderer: SSTRenderer,
};
