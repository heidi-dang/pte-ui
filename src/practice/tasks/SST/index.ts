import type { TaskModule } from '../types';
import { SSTRenderer } from './Renderer';

export const sstTask: TaskModule = {
  code: 'SST',
  section: 'Listening',
  Renderer: SSTRenderer,
  createInitialResponse: () => ({ typedText: "" }),
  normalizeResponse: (data) => data,
};
